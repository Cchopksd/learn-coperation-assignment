"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import {
  bookingService,
  useBranches,
  useClassSession,
  useCompensations,
  useStaffs,
  useStudents,
} from "@/service";
import { formatDateTime } from "@/utils/format";
import { bookingSchema, type BookingFormValues } from "@/schema/booking.schema";
import type {
  Compensation,
  FinalAttendanceStatus,
  SessionBooking,
  Student,
} from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  Button,
  Field,
  Select,
  LoadingState,
  ErrorState,
} from "@/components/ui";
import {
  AttendanceStatusBadge,
  CompensationStatusBadge,
} from "@/components/StatusBadge";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { SeatsBadge } from "../page";

export default function ClassSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const session = useClassSession(id);
  const students = useStudents();
  const comps = useCompensations();
  const branches = useBranches();
  const staffs = useStaffs();

  // Index students by id so roster rows can show name + live credit balance.
  const studentById = useMemo(() => {
    const map = new Map<string, Student>();
    (students.data ?? []).forEach((s) => map.set(s.id, s));
    return map;
  }, [students.data]);

  // Index compensations by bookingId to show make-up status on the roster.
  const compByBooking = useMemo(() => {
    const map = new Map<string, Compensation>();
    (comps.data ?? []).forEach((c) => map.set(c.bookingId, c));
    return map;
  }, [comps.data]);

  function refresh() {
    session.reload();
    students.reload();
    comps.reload();
  }

  if (session.loading) return <LoadingState label="Loading class session…" />;
  if (session.error || !session.data)
    return (
      <ErrorState
        message={session.error ?? "Class session not found."}
        onRetry={session.reload}
      />
    );

  const c = session.data;
  const branch = (branches.data ?? []).find((b) => b.id === c.branchId);
  const teacher = (staffs.data ?? []).find((s) => s.id === c.teacherId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={c.title}
        description="Book seats and mark attendance for this class."
        actions={
          <Link href="/class-sessions">
            <Button variant="secondary">← Back to sessions</Button>
          </Link>
        }
      />

      {/* Class summary */}
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-4">
          <Summary label="Branch" value={branch ? `${branch.name} (${branch.code})` : "—"} />
          <Summary label="Teacher" value={teacher ? teacher.name : "Unassigned"} />
          <Summary label="Start" value={formatDateTime(c.startTime)} />
          <Summary label="End" value={formatDateTime(c.endTime)} />
          <Summary label="Capacity" value={String(c.capacity)} />
          <Summary label="Booked seats" value={String(c.bookedSeats)} />
          <Summary label="Available seats" value={String(c.availableSeats)} />
          <Summary
            label="Seats"
            value={
              <SeatsBadge
                booked={c.bookedSeats}
                capacity={c.capacity}
                available={c.availableSeats}
              />
            }
          />
        </div>
        {c.description && (
          <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
            {c.description}
          </p>
        )}
      </Card>

      {/* Booking section */}
      <BookSeatCard
        sessionId={id}
        branchId={c.branchId}
        isFull={c.availableSeats <= 0}
        bookings={c.bookings}
        students={students.data ?? []}
        onBooked={refresh}
      />

      {/* Attendance roster */}
      <Card>
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
          Attendance roster
        </h2>
        <AttendanceRoster
          bookings={c.bookings}
          studentById={studentById}
          compByBooking={compByBooking}
          loading={students.loading}
          onMarked={refresh}
        />
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-slate-800">{value}</div>
    </div>
  );
}

function BookSeatCard({
  sessionId,
  branchId,
  isFull,
  bookings,
  students,
  onBooked,
}: {
  sessionId: string;
  branchId: string;
  isFull: boolean;
  bookings: SessionBooking[];
  students: Student[];
  onBooked: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { studentId: "" },
  });

  const selectedStudentId = useWatch({ control, name: "studentId" });

  const bookedIds = useMemo(
    () => new Set(bookings.map((b) => b.studentId)),
    [bookings],
  );

  // Only students in this branch, active, and not already booked can be added.
  const eligible = students.filter(
    (s) => s.branchId === branchId && s.isActive && !bookedIds.has(s.id),
  );

  async function book(values: BookingFormValues) {
    setServerError(null);
    try {
      await bookingService.create({
        classSessionId: sessionId,
        studentId: values.studentId,
      });
      reset();
      onBooked();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not book seat.",
      );
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Book a seat</h2>
      {isFull ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This class is full. No more seats can be booked.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit(book)}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-64 flex-1">
            <Field label="Student" error={errors.studentId?.message}>
              <Select {...register("studentId")}>
                <option value="">— Select student —</option>
                {eligible.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.creditBalance} credits
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={isSubmitting || !selectedStudentId}>
            {isSubmitting ? "Booking…" : "Book seat"}
          </Button>
        </form>
      )}
      {eligible.length === 0 && !isFull && (
        <p className="mt-2 text-xs text-slate-500">
          No eligible students in this branch (all booked or inactive).
        </p>
      )}
      {serverError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}
    </Card>
  );
}

interface PendingAction {
  booking: SessionBooking;
  status: FinalAttendanceStatus;
}

function AttendanceRoster({
  bookings,
  studentById,
  compByBooking,
  loading,
  onMarked,
}: {
  bookings: SessionBooking[];
  studentById: Map<string, Student>;
  compByBooking: Map<string, Compensation>;
  loading: boolean;
  onMarked: () => void;
}) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    if (!pending) return;
    setError(null);
    setSubmitting(true);
    try {
      await bookingService.markAttendance(pending.booking.id, pending.status);
      setPending(null);
      onMarked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not mark attendance.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState />;
  if (bookings.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-500">
        No bookings yet. Book a seat above to add students to this class.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Credit balance</th>
              <th className="px-4 py-3">Compensation</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const student = studentById.get(b.studentId);
              const comp = compByBooking.get(b.id);
              return (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    {student ? (
                      <Link
                        href={`/students/${student.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {student.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Unknown student</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AttendanceStatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {student ? student.creditBalance : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {comp ? (
                      <CompensationStatusBadge status={comp.status} />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {b.status === "BOOKED" ? (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => setPending({ booking: b, status: "ATTEND" })}
                          >
                            Attend
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPending({ booking: b, status: "SKIP" })}
                          >
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setPending({ booking: b, status: "ABSENT" })}
                          >
                            Absent
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Marked · final
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmActionDialog
        open={pending !== null}
        title={pending ? `Mark ${describe(pending.status)}` : ""}
        message={pending ? confirmMessage(pending.status) : ""}
        confirmLabel={pending ? `Mark ${describe(pending.status)}` : "Confirm"}
        confirmVariant={pending?.status === "ABSENT" ? "danger" : "success"}
        submitting={submitting}
        error={error}
        onConfirm={confirm}
        onClose={() => {
          if (!submitting) {
            setPending(null);
            setError(null);
          }
        }}
      />
    </>
  );
}

function describe(status: FinalAttendanceStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function confirmMessage(status: FinalAttendanceStatus): string {
  switch (status) {
    case "ATTEND":
      return "This deducts 1 credit from the student and finalises attendance as Attended.";
    case "ABSENT":
      return "This deducts 1 credit from the student and finalises attendance as Absent.";
    case "SKIP":
      return "No credit is deducted. A make-up (MAKEUP_CLASS) compensation will be created for the student.";
  }
}

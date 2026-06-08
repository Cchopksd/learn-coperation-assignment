"use client";

import { useState } from "react";
import Link from "next/link";

import { ApiError } from "@/lib/api-client";
import { bookingService } from "@/service/booking.service";
import type {
  Compensation,
  FinalAttendanceStatus,
  SessionBooking,
  Student,
} from "@/lib/types";
import { Button, LoadingState } from "@/components/ui";
import {
  AttendanceStatusBadge,
  CompensationStatusBadge,
} from "@/components/StatusBadge";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

interface PendingAction {
  booking: SessionBooking;
  status: FinalAttendanceStatus;
}

export function AttendanceRoster({
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

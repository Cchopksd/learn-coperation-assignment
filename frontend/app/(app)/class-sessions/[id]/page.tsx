"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useBranches } from "@/service/branch.service";
import { useClassSession } from "@/service/class-session.service";
import { useCompensations } from "@/service/compensation.service";
import { useStaffs } from "@/service/staff.service";
import { useStudents } from "@/service/student.service";
import { formatDateTime } from "@/utils/format";
import type { Compensation, Student } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, LoadingState, ErrorState } from "@/components/ui";
import { SeatsBadge } from "@/components/class-sessions/SeatsBadge";
import { Summary } from "@/components/class-sessions/Summary";
import { BookSeatCard } from "@/components/class-sessions/BookSeatCard";
import { AttendanceRoster } from "@/components/class-sessions/AttendanceRoster";

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
            <Button variant="secondary" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to sessions
            </Button>
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

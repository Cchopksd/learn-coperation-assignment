"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { bookingService } from "@/service/booking.service";
import { bookingSchema, type BookingFormValues } from "@/schema/booking.schema";
import type { SessionBooking, Student } from "@/lib/types";
import { Card, Button, Field, Select } from "@/components/ui";

export function BookSeatCard({
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

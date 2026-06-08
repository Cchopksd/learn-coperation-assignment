"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { studentService } from "@/service/student.service";
import {
  adjustCreditSchema,
  type AdjustCreditFormValues,
} from "@/schema/credit.schema";
import { Card, Button, Field, Input, Textarea } from "@/components/ui";

export function AdjustCreditCard({
  studentId,
  onAdjusted,
}: {
  studentId: string;
  onAdjusted: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustCreditFormValues>({
    resolver: zodResolver(adjustCreditSchema),
    defaultValues: { amount: "", reason: "", note: "" },
  });

  async function submit(values: AdjustCreditFormValues) {
    setServerError(null);
    setOkMessage(null);
    try {
      const combinedNote = [values.reason?.trim(), values.note?.trim()]
        .filter(Boolean)
        .join(" — ");
      const res = await studentService.adjustCredit(studentId, {
        amount: Number(values.amount),
        note: combinedNote || undefined,
      });
      setOkMessage(`Done. New balance: ${res.student.creditBalance}.`);
      reset();
      onAdjusted();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not adjust credit.",
      );
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">
        Add / adjust credit
      </h2>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Field
          label="Amount"
          required
          hint="Positive to add, negative to deduct."
          error={errors.amount?.message}
        >
          <Input
            type="number"
            step={1}
            placeholder="e.g. 10 or -2"
            {...register("amount")}
          />
        </Field>
        <Field label="Reason" error={errors.reason?.message}>
          <Input placeholder="e.g. Initial top-up" {...register("reason")} />
        </Field>
        <Field label="Note" error={errors.note?.message}>
          <Textarea {...register("note")} />
        </Field>
        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}
        {okMessage && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {okMessage}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Apply adjustment"}
        </Button>
        <p className="text-xs text-slate-400">
          Recorded as a MANUAL_ADJUSTMENT in the credit ledger.
        </p>
      </form>
    </Card>
  );
}

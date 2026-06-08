"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";

import { ApiError } from "@/lib/api-client";
import { useBranches } from "@/service/branch.service";
import {
  studentService,
  useStudent,
  useStudentCompensations,
  useStudentLedger,
} from "@/service/student.service";
import { formatDate, formatDateTime, titleCase } from "@/utils/format";
import {
  adjustCreditSchema,
  type AdjustCreditFormValues,
} from "@/schema/credit.schema";
import type {
  AttendanceStatus,
  CreditLedgerEntry,
} from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, Field, Input, Textarea, LoadingState, ErrorState } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import {
  AttendanceStatusBadge,
  CompensationStatusBadge,
  CompensationTypeBadge,
  StatusBadge,
} from "@/components/StatusBadge";
import { CreditAmount } from "@/components/CreditAmount";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const student = useStudent(id);
  const ledger = useStudentLedger(id);
  const comps = useStudentCompensations(id);
  const branches = useBranches();

  const branchName = useMemo(() => {
    const b = (branches.data ?? []).find((x) => x.id === student.data?.branchId);
    return b ? `${b.name} (${b.code})` : "—";
  }, [branches.data, student.data]);

  // Recent bookings are derived from credit ledger (attend/absent) + compensations
  // (skip), since the backend has no per-student bookings endpoint.
  const recentBookings = useMemo(
    () => deriveRecentBookings(ledger.data ?? [], comps.data ?? []),
    [ledger.data, comps.data],
  );

  function refreshAll() {
    student.reload();
    ledger.reload();
    comps.reload();
  }

  if (student.loading) return <LoadingState label="Loading student…" />;
  if (student.error || !student.data)
    return <ErrorState message={student.error ?? "Student not found."} onRetry={student.reload} />;

  const s = student.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        description="Student profile, credits, bookings and compensations."
        actions={
          <Link href="/students">
            <Button variant="secondary" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to students
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile summary */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Profile</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Detail label="Email" value={s.email || "—"} />
            <Detail label="Phone" value={s.phone || "—"} />
            <Detail label="Branch" value={branchName} />
            <Detail
              label="Status"
              value={
                s.isActive ? (
                  <StatusBadge label="Active" tone="success" />
                ) : (
                  <StatusBadge label="Inactive" tone="muted" />
                )
              }
            />
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Current credit balance
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">
                {s.creditBalance}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Adjust credit */}
        <AdjustCreditCard studentId={id} onAdjusted={refreshAll} />
      </div>

      {/* Recent bookings (derived) */}
      <Card>
        <SectionTitle title="Recent bookings" />
        <DataTable
          columns={recentBookingColumns}
          rows={recentBookings}
          rowKey={(r) => r.bookingId}
          loading={ledger.loading || comps.loading}
          error={ledger.error || comps.error}
          onRetry={refreshAll}
          emptyTitle="No bookings yet"
        />
      </Card>

      {/* Compensations */}
      <Card>
        <SectionTitle title="Compensations" />
        <DataTable
          columns={compColumns}
          rows={comps.data ?? []}
          rowKey={(c) => c.id}
          loading={comps.loading}
          error={comps.error}
          onRetry={comps.reload}
          emptyTitle="No compensations"
          emptyDescription="Skipped classes generate make-up compensations here."
        />
      </Card>

      {/* Credit ledger */}
      <Card>
        <SectionTitle title="Credit ledger" />
        <DataTable
          columns={ledgerColumns}
          rows={ledger.data ?? []}
          rowKey={(l) => l.id}
          loading={ledger.loading}
          error={ledger.error}
          onRetry={ledger.reload}
          emptyTitle="No credit movements yet"
        />
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-800">{value}</dd>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
      {title}
    </h2>
  );
}

function AdjustCreditCard({
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

// ---- derived recent bookings ----

interface DerivedBooking {
  bookingId: string;
  status: AttendanceStatus;
  date: string;
}

function deriveRecentBookings(
  ledger: CreditLedgerEntry[],
  comps: { bookingId: string; createdAt: string }[],
): DerivedBooking[] {
  const map = new Map<string, DerivedBooking>();
  for (const entry of ledger) {
    if (!entry.bookingId) continue;
    if (entry.reason === "ATTENDANCE_ATTEND") {
      map.set(entry.bookingId, {
        bookingId: entry.bookingId,
        status: "ATTEND",
        date: entry.createdAt,
      });
    } else if (entry.reason === "ATTENDANCE_ABSENT") {
      map.set(entry.bookingId, {
        bookingId: entry.bookingId,
        status: "ABSENT",
        date: entry.createdAt,
      });
    }
  }
  for (const comp of comps) {
    if (!map.has(comp.bookingId)) {
      map.set(comp.bookingId, {
        bookingId: comp.bookingId,
        status: "SKIP",
        date: comp.createdAt,
      });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

const recentBookingColumns: Column<DerivedBooking>[] = [
  { header: "Date", cell: (r) => formatDateTime(r.date) },
  { header: "Booking", cell: (r) => <span className="font-mono text-xs">{r.bookingId.slice(0, 8)}</span> },
  { header: "Outcome", cell: (r) => <AttendanceStatusBadge status={r.status} /> },
];

const compColumns: Column<{
  id: string;
  type: "MAKEUP_CLASS" | "SEAT_CREDIT" | "EXTEND_EXPIRY";
  status: "AVAILABLE" | "USED" | "CANCELLED";
  createdAt: string;
  usedAt: string | null;
}>[] = [
  { header: "Type", cell: (c) => <CompensationTypeBadge type={c.type} /> },
  { header: "Status", cell: (c) => <CompensationStatusBadge status={c.status} /> },
  { header: "Created", cell: (c) => formatDate(c.createdAt) },
  { header: "Used", cell: (c) => formatDate(c.usedAt) },
];

const ledgerColumns: Column<CreditLedgerEntry>[] = [
  { header: "Date", cell: (l) => formatDateTime(l.createdAt) },
  { header: "Amount", cell: (l) => <CreditAmount value={l.amount} /> },
  { header: "Reason", cell: (l) => titleCase(l.reason) },
  {
    header: "Related class",
    cell: (l) => (l.bookingId ? "Attendance booking" : "—"),
  },
  { header: "Balance after", cell: (l) => l.balanceAfter },
  { header: "Note", cell: (l) => l.note || "—" },
];

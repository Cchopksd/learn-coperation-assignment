"use client";

import { useMemo, useState } from "react";

import { useCreditLedgers } from "@/service/credit-ledger.service";
import { useStudents } from "@/service/student.service";
import { formatDateTime, titleCase } from "@/utils/format";
import type { CreditLedgerEntry, CreditLedgerReason } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Field, Select, Input, Button } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { CreditAmount } from "@/components/CreditAmount";

const REASONS: CreditLedgerReason[] = [
  "INITIAL_CREDIT",
  "MANUAL_ADJUSTMENT",
  "ATTENDANCE_ATTEND",
  "ATTENDANCE_ABSENT",
];

export default function CreditLedgersPage() {
  const students = useStudents();

  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Server-side filters: the hook re-fetches whenever a filter changes.
  const ledgers = useCreditLedgers({
    studentId: studentId || undefined,
    reason: reason || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
  });

  const columns = useMemo<Column<CreditLedgerEntry>[]>(
    () => [
      { header: "Date", cell: (l) => formatDateTime(l.createdAt) },
      {
        header: "Student",
        cell: (l) => l.student?.name ?? "—",
      },
      { header: "Amount", cell: (l) => <CreditAmount value={l.amount} /> },
      { header: "Reason", cell: (l) => titleCase(l.reason) },
      {
        header: "Related class",
        cell: (l) => l.booking?.classSession?.title ?? "—",
      },
      { header: "Balance after", cell: (l) => l.balanceAfter },
      { header: "Created by", cell: (l) => l.createdBy?.name ?? "System" },
      { header: "Note", cell: (l) => l.note || "—" },
    ],
    [],
  );

  function clearFilters() {
    setStudentId("");
    setReason("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Ledgers"
        description="Every credit movement across all students (replaces audit logs)."
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Student">
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">All students</option>
              {(students.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reason">
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">All reasons</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {titleCase(r)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Field>
          <Field label="To">
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={ledgers.data ?? []}
          rowKey={(l) => l.id}
          loading={ledgers.loading}
          error={ledgers.error}
          onRetry={ledgers.reload}
          emptyTitle="No credit movements"
          emptyDescription="Try adjusting the filters above."
        />
      </Card>
    </div>
  );
}

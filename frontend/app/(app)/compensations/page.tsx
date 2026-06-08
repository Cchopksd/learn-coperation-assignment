"use client";

import { useMemo, useState } from "react";

import { ApiError } from "@/lib/api-client";
import {
  compensationService,
  useCompensations,
} from "@/service/compensation.service";
import { useStudents } from "@/service/student.service";
import { formatDate, titleCase } from "@/utils/format";
import type {
  Compensation,
  CompensationStatus,
  CompensationType,
} from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Field, Select, Button } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import {
  CompensationStatusBadge,
  CompensationTypeBadge,
} from "@/components/StatusBadge";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

const STATUSES: CompensationStatus[] = ["AVAILABLE", "USED", "CANCELLED"];
const TYPES: CompensationType[] = ["MAKEUP_CLASS", "SEAT_CREDIT", "EXTEND_EXPIRY"];

export default function CompensationsPage() {
  const students = useStudents();

  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [markUsed, setMarkUsed] = useState<Compensation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const comps = useCompensations({
    studentId: studentId || undefined,
    status: status || undefined,
    type: type || undefined,
  });

  async function confirmMarkUsed() {
    if (!markUsed) return;
    setActionError(null);
    setSubmitting(true);
    try {
      await compensationService.updateStatus(markUsed.id, "USED");
      setMarkUsed(null);
      comps.reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not update compensation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const columns = useMemo<Column<Compensation>[]>(
    () => [
      { header: "Student", cell: (c) => c.student?.name ?? "—" },
      {
        header: "Source class",
        cell: (c) => c.booking?.classSession?.title ?? "—",
      },
      { header: "Type", cell: (c) => <CompensationTypeBadge type={c.type} /> },
      {
        header: "Status",
        cell: (c) => <CompensationStatusBadge status={c.status} />,
      },
      { header: "Created", cell: (c) => formatDate(c.createdAt) },
      { header: "Used", cell: (c) => formatDate(c.usedAt) },
      {
        header: "Action",
        className: "text-right",
        cell: (c) => (
          <div className="flex justify-end">
            {c.status === "AVAILABLE" ? (
              <Button size="sm" variant="secondary" onClick={() => setMarkUsed(c)}>
                Mark used
              </Button>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  function clearFilters() {
    setStudentId("");
    setStatus("");
    setType("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compensations"
        description="Make-up entitlements generated when a booking is skipped."
      />

      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
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
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </Select>
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
          rows={comps.data ?? []}
          rowKey={(c) => c.id}
          loading={comps.loading}
          error={comps.error}
          onRetry={comps.reload}
          emptyTitle="No compensations"
          emptyDescription="Skipping a booked seat creates a make-up compensation here."
        />
      </Card>

      <ConfirmActionDialog
        open={markUsed !== null}
        title="Mark compensation as used"
        message="This marks the make-up entitlement as USED and records the time. It cannot be reverted."
        confirmLabel="Mark used"
        submitting={submitting}
        error={actionError}
        onConfirm={confirmMarkUsed}
        onClose={() => {
          if (!submitting) {
            setMarkUsed(null);
            setActionError(null);
          }
        }}
      />
    </div>
  );
}

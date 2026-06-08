"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useBranches } from "@/service/branch.service";
import { useStudents } from "@/service/student.service";
import type { Student } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { CreditAmount } from "@/components/CreditAmount";
import { CreateStudentModal } from "@/components/students/CreateStudentModal";

export default function StudentsPage() {
  const router = useRouter();
  const students = useStudents();
  const branches = useBranches();
  const [open, setOpen] = useState(false);

  const branchName = useMemo(() => {
    const map = new Map<string, string>();
    (branches.data ?? []).forEach((b) => map.set(b.id, b.name));
    return (id: string) => map.get(id) ?? "—";
  }, [branches.data]);

  const columns: Column<Student>[] = [
    {
      header: "Name",
      cell: (s) => <span className="font-medium text-slate-900">{s.name}</span>,
    },
    { header: "Branch", cell: (s) => branchName(s.branchId) },
    {
      header: "Credit balance",
      cell: (s) => <CreditAmount value={s.creditBalance} signed={false} />,
    },
    {
      header: "Status",
      cell: (s) =>
        s.isActive ? (
          <StatusBadge label="Active" tone="success" />
        ) : (
          <StatusBadge label="Inactive" tone="muted" />
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Each student belongs to a branch and holds a credit balance."
        actions={<Button onClick={() => setOpen(true)}>New student</Button>}
      />

      <Card>
        <DataTable
          columns={columns}
          rows={students.data ?? []}
          rowKey={(s) => s.id}
          loading={students.loading}
          error={students.error}
          onRetry={students.reload}
          onRowClick={(s) => router.push(`/students/${s.id}`)}
          emptyTitle="No students yet"
          emptyAction={<Button onClick={() => setOpen(true)}>New student</Button>}
        />
      </Card>

      <CreateStudentModal
        open={open}
        branches={branches.data ?? []}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          students.reload();
        }}
      />
    </div>
  );
}

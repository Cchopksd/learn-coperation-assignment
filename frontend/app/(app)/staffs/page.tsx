"use client";

import { useMemo, useState } from "react";

import { useBranches } from "@/service/branch.service";
import { useStaffs } from "@/service/staff.service";
import type { Staff } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { RoleBadge } from "@/components/StatusBadge";
import { CreateStaffModal } from "@/components/staffs/CreateStaffModal";

export default function StaffsPage() {
  const staffs = useStaffs();
  const branches = useBranches();
  const [open, setOpen] = useState(false);

  const branchName = useMemo(() => {
    const map = new Map<string, string>();
    (branches.data ?? []).forEach((b) => map.set(b.id, b.name));
    return (id: string | null) => (id ? map.get(id) ?? "—" : "HQ (no branch)");
  }, [branches.data]);

  const columns: Column<Staff>[] = [
    { header: "Name", cell: (s) => <span className="font-medium text-slate-900">{s.name}</span> },
    { header: "Email", cell: (s) => s.email },
    { header: "Role", cell: (s) => <RoleBadge role={s.role} /> },
    { header: "Branch", cell: (s) => branchName(s.branchId) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staffs"
        description="HQ staff, branch staff and teachers who can sign in."
        actions={<Button onClick={() => setOpen(true)}>New staff</Button>}
      />

      <Card>
        <DataTable
          columns={columns}
          rows={staffs.data ?? []}
          rowKey={(s) => s.id}
          loading={staffs.loading}
          error={staffs.error}
          onRetry={staffs.reload}
          emptyTitle="No staff accounts yet"
          emptyAction={<Button onClick={() => setOpen(true)}>New staff</Button>}
        />
      </Card>

      <CreateStaffModal
        open={open}
        branches={branches.data ?? []}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          staffs.reload();
        }}
      />
    </div>
  );
}

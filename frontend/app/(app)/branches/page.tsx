"use client";

import { useState } from "react";

import { useBranches } from "@/service/branch.service";
import { formatDate } from "@/utils/format";
import type { Branch } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { CreateBranchModal } from "@/components/branches/CreateBranchModal";

export default function BranchesPage() {
  const { data, loading, error, reload } = useBranches();
  const [open, setOpen] = useState(false);

  const columns: Column<Branch>[] = [
    {
      header: "Code",
      cell: (b) => <span className="font-mono text-slate-900">{b.code}</span>,
    },
    { header: "Name", cell: (b) => b.name },
    { header: "Address", cell: (b) => b.address || "—" },
    { header: "Created", cell: (b) => formatDate(b.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Locations that own students, staff and class sessions."
        actions={<Button onClick={() => setOpen(true)}>New branch</Button>}
      />

      <Card>
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(b) => b.id}
          loading={loading}
          error={error}
          onRetry={reload}
          emptyTitle="No branches yet"
          emptyDescription="Create your first branch to get started."
          emptyAction={<Button onClick={() => setOpen(true)}>New branch</Button>}
        />
      </Card>

      <CreateBranchModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          reload();
        }}
      />
    </div>
  );
}

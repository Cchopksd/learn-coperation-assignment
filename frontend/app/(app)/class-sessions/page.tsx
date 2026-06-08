"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useBranches } from "@/service/branch.service";
import { useClassSessions } from "@/service/class-session.service";
import { useStaffs } from "@/service/staff.service";
import { formatDateTime } from "@/utils/format";
import type { ClassSession } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { SeatsBadge } from "@/components/class-sessions/SeatsBadge";
import { CreateSessionModal } from "@/components/class-sessions/CreateSessionModal";

export default function ClassSessionsPage() {
  const router = useRouter();
  const sessions = useClassSessions();
  const branches = useBranches();
  const staffs = useStaffs();
  const [open, setOpen] = useState(false);

  const branchName = useMemo(() => {
    const map = new Map<string, string>();
    (branches.data ?? []).forEach((b) => map.set(b.id, b.name));
    return (id: string) => map.get(id) ?? "—";
  }, [branches.data]);

  const teacherName = useMemo(() => {
    const map = new Map<string, string>();
    (staffs.data ?? []).forEach((s) => map.set(s.id, s.name));
    return (id: string | null) => (id ? map.get(id) ?? "—" : "Unassigned");
  }, [staffs.data]);

  const columns: Column<ClassSession>[] = [
    {
      header: "Title",
      cell: (c) => <span className="font-medium text-slate-900">{c.title}</span>,
    },
    { header: "Branch", cell: (c) => branchName(c.branchId) },
    { header: "Teacher", cell: (c) => teacherName(c.teacherId) },
    { header: "Start", cell: (c) => formatDateTime(c.startTime) },
    { header: "End", cell: (c) => formatDateTime(c.endTime) },
    {
      header: "Seats",
      cell: (c) => (
        <SeatsBadge
          booked={c.bookedSeats}
          capacity={c.capacity}
          available={c.availableSeats}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Sessions"
        description="Scheduled classes. Open a session to book seats and mark attendance."
        actions={<Button onClick={() => setOpen(true)}>New session</Button>}
      />

      <Card>
        <DataTable
          columns={columns}
          rows={sessions.data ?? []}
          rowKey={(c) => c.id}
          loading={sessions.loading}
          error={sessions.error}
          onRetry={sessions.reload}
          onRowClick={(c) => router.push(`/class-sessions/${c.id}`)}
          emptyTitle="No class sessions yet"
          emptyAction={<Button onClick={() => setOpen(true)}>New session</Button>}
        />
      </Card>

      <CreateSessionModal
        open={open}
        branches={branches.data ?? []}
        staffs={staffs.data ?? []}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          sessions.reload();
        }}
      />
    </div>
  );
}

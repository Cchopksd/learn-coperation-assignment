"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import {
  classSessionService,
  useBranches,
  useClassSessions,
  useStaffs,
} from "@/service";
import { formatDateTime, toLocalInputValue, localInputToIso } from "@/utils/format";
import {
  classSessionSchema,
  type ClassSessionFormValues,
} from "@/schema/class-session.schema";
import type { Branch, ClassSession, Staff } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, Field, Input, Textarea, Select } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { StatusBadge } from "@/components/StatusBadge";

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

export function SeatsBadge({
  booked,
  capacity,
  available,
}: {
  booked: number;
  capacity: number;
  available: number;
}) {
  const tone = available <= 0 ? "destructive" : available <= 2 ? "warning" : "success";
  return (
    <div className="flex items-center gap-2">
      <span className="tabular-nums text-slate-700">
        {booked}/{capacity}
      </span>
      <StatusBadge
        label={available <= 0 ? "Full" : `${available} left`}
        tone={tone}
      />
    </div>
  );
}

function CreateSessionModal({
  open,
  branches,
  staffs,
  onClose,
  onCreated,
}: {
  open: boolean;
  branches: Branch[];
  staffs: Staff[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const defaults: ClassSessionFormValues = useMemo(
    () => ({
      title: "",
      branchId: "",
      teacherId: "",
      startTime: toLocalInputValue(),
      endTime: toLocalInputValue(),
      capacity: "10",
      description: "",
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClassSessionFormValues>({
    resolver: zodResolver(classSessionSchema),
    defaultValues: defaults,
  });

  const branchId = useWatch({ control, name: "branchId" });

  // Backend requires the teacher to belong to the class branch and have role TEACHER.
  const teacherOptions = staffs.filter(
    (s) => s.role === "TEACHER" && s.isActive && s.branchId === branchId,
  );

  function close() {
    reset(defaults);
    setServerError(null);
    onClose();
  }

  async function submit(values: ClassSessionFormValues) {
    setServerError(null);
    try {
      await classSessionService.create({
        branchId: values.branchId,
        teacherId: values.teacherId || undefined,
        title: values.title,
        description: values.description || undefined,
        startTime: localInputToIso(values.startTime),
        endTime: localInputToIso(values.endTime),
        capacity: Number(values.capacity),
      });
      reset(defaults);
      onCreated();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not create session.",
      );
    }
  }

  return (
    <FormModal
      open={open}
      title="New class session"
      onClose={close}
      onSubmit={handleSubmit(submit)}
      submitting={isSubmitting}
      submitLabel="Create session"
      error={serverError}
    >
      <Field label="Title" required error={errors.title?.message}>
        <Input {...register("title")} />
      </Field>
      <Field label="Branch" required error={errors.branchId?.message}>
        <Select
          {...register("branchId", {
            onChange: () => setValue("teacherId", ""),
          })}
        >
          <option value="">— Choose branch —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Teacher"
        hint={
          branchId
            ? "Only active teachers in the selected branch are shown."
            : "Choose a branch first."
        }
        error={errors.teacherId?.message}
      >
        <Select {...register("teacherId")} disabled={!branchId}>
          <option value="">— Unassigned —</option>
          {teacherOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time" required error={errors.startTime?.message}>
          <Input type="datetime-local" {...register("startTime")} />
        </Field>
        <Field label="End time" required error={errors.endTime?.message}>
          <Input type="datetime-local" {...register("endTime")} />
        </Field>
      </div>
      <Field label="Capacity" required error={errors.capacity?.message}>
        <Input type="number" min={1} {...register("capacity")} />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <Textarea {...register("description")} />
      </Field>
    </FormModal>
  );
}

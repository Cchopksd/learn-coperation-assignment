"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { studentService, useBranches, useStudents } from "@/service";
import { studentSchema, type StudentFormValues } from "@/schema/student.schema";
import type { Branch, Student } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, Field, Input, Select } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { StatusBadge } from "@/components/StatusBadge";
import { CreditAmount } from "@/components/CreditAmount";

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

function CreateStudentModal({
  open,
  branches,
  onClose,
  onCreated,
}: {
  open: boolean;
  branches: Branch[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { branchId: "", name: "", email: "", phone: "" },
  });

  function close() {
    reset();
    setServerError(null);
    onClose();
  }

  async function submit(values: StudentFormValues) {
    setServerError(null);
    try {
      await studentService.create({
        branchId: values.branchId,
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
      });
      reset();
      onCreated();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not create student.",
      );
    }
  }

  return (
    <FormModal
      open={open}
      title="New student"
      onClose={close}
      onSubmit={handleSubmit(submit)}
      submitting={isSubmitting}
      submitLabel="Create student"
      error={serverError}
    >
      <Field label="Name" required error={errors.name?.message}>
        <Input {...register("name")} />
      </Field>
      <Field label="Branch" required error={errors.branchId?.message}>
        <Select {...register("branchId")}>
          <option value="">— Choose branch —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" {...register("email")} />
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <Input {...register("phone")} />
      </Field>
    </FormModal>
  );
}

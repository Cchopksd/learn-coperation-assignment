"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { useBranches } from "@/service/branch.service";
import { staffService, useStaffs } from "@/service/staff.service";
import {
  STAFF_ROLES,
  staffSchema,
  type StaffFormValues,
} from "@/schema/staff.schema";
import type { Branch, Staff } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, Field, Input, Select } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { RoleBadge } from "@/components/StatusBadge";

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

function CreateStaffModal({
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "BRANCH_STAFF",
      branchId: "",
    },
  });

  const role = useWatch({ control, name: "role" });
  const branchRequired = role !== "HQ_STAFF";

  function close() {
    reset();
    setServerError(null);
    onClose();
  }

  async function submit(values: StaffFormValues) {
    setServerError(null);
    try {
      await staffService.create({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        branchId: values.branchId || undefined,
      });
      reset();
      onCreated();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not create staff.",
      );
    }
  }

  return (
    <FormModal
      open={open}
      title="New staff account"
      onClose={close}
      onSubmit={handleSubmit(submit)}
      submitting={isSubmitting}
      submitLabel="Create staff"
      error={serverError}
    >
      <Field label="Name" required error={errors.name?.message}>
        <Input {...register("name")} />
      </Field>
      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" {...register("email")} />
      </Field>
      <Field
        label="Password"
        required
        hint="At least 8 characters."
        error={errors.password?.message}
      >
        <Input type="password" {...register("password")} />
      </Field>
      <Field label="Role" required error={errors.role?.message}>
        <Select {...register("role")}>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Branch"
        required={branchRequired}
        hint={branchRequired ? undefined : "Optional for HQ staff."}
        error={errors.branchId?.message}
      >
        <Select {...register("branchId")}>
          <option value="">— None —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </Select>
      </Field>
    </FormModal>
  );
}

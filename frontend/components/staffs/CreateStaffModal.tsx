"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { staffService } from "@/service/staff.service";
import {
  STAFF_ROLES,
  staffSchema,
  type StaffFormValues,
} from "@/schema/staff.schema";
import type { Branch } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui";
import { FormModal } from "@/components/FormModal";

export function CreateStaffModal({
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

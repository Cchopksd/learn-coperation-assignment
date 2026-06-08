"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { branchService } from "@/service/branch.service";
import { branchSchema, type BranchFormValues } from "@/schema/branch.schema";
import { Field, Input } from "@/components/ui";
import { FormModal } from "@/components/FormModal";

export function CreateBranchModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { code: "", name: "", address: "" },
  });

  function close() {
    reset();
    setServerError(null);
    onClose();
  }

  async function submit(values: BranchFormValues) {
    setServerError(null);
    try {
      await branchService.create({
        code: values.code,
        name: values.name,
        address: values.address || undefined,
      });
      reset();
      onCreated();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not create branch.",
      );
    }
  }

  return (
    <FormModal
      open={open}
      title="New branch"
      onClose={close}
      onSubmit={handleSubmit(submit)}
      submitting={isSubmitting}
      submitLabel="Create branch"
      error={serverError}
    >
      <Field
        label="Code"
        required
        hint="Short unique identifier, e.g. BKK01."
        error={errors.code?.message}
      >
        <Input {...register("code")} />
      </Field>
      <Field label="Name" required error={errors.name?.message}>
        <Input {...register("name")} />
      </Field>
      <Field label="Address" error={errors.address?.message}>
        <Input {...register("address")} />
      </Field>
    </FormModal>
  );
}

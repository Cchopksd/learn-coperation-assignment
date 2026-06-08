"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { studentService } from "@/service/student.service";
import { studentSchema, type StudentFormValues } from "@/schema/student.schema";
import type { Branch } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui";
import { FormModal } from "@/components/FormModal";

export function CreateStudentModal({
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

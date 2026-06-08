"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { classSessionService } from "@/service/class-session.service";
import { toLocalInputValue, localInputToIso } from "@/utils/format";
import {
  classSessionSchema,
  type ClassSessionFormValues,
} from "@/schema/class-session.schema";
import type { Branch, Staff } from "@/lib/types";
import { Field, Input, Textarea, Select } from "@/components/ui";
import { FormModal } from "@/components/FormModal";

export function CreateSessionModal({
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

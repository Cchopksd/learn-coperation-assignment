"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { branchService, useBranches } from "@/service/branch.service";
import { formatDate } from "@/utils/format";
import { branchSchema, type BranchFormValues } from "@/schema/branch.schema";
import type { Branch } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, Field, Input } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";

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

function CreateBranchModal({
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

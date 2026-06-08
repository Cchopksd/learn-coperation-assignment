"use client";

import { useEffect } from "react";

import { Button } from "./ui";

interface FormModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  /** Pass React Hook Form's `handleSubmit(onValid)` here. */
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  submitting?: boolean;
  submitLabel?: string;
  error?: string | null;
  children: React.ReactNode;
}

/**
 * Reusable modal that wraps a <form>. The parent owns field state and submits
 * via onSubmit; this component handles layout, escape-to-close and the footer.
 */
export function FormModal({
  open,
  title,
  description,
  onClose,
  onSubmit,
  submitting,
  submitLabel = "Save",
  error,
  children,
}: FormModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 px-5 py-4">
            {children}
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

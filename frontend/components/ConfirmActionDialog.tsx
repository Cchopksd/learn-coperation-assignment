"use client";

import { Button } from "./ui";

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger" | "success";
  submitting?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Confirmation dialog for irreversible / impactful actions
 * (e.g. marking attendance, which deducts credit).
 */
export function ConfirmActionDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  submitting,
  error,
  onConfirm,
  onClose,
}: ConfirmActionDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { ApiError, cn } from "@/shared/lib";

import { Button } from "./button";
import { ResponsiveDialog } from "./responsive-dialog";

export type ActionConfirmDialogProps = {
  children?: ReactNode;
  confirmDisabled?: boolean;
  confirmLabel: string;
  description: ReactNode;
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
  pendingLabel?: string;
  title: ReactNode;
  tone?: "default" | "danger";
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

export function ActionConfirmDialog({
  children,
  confirmDisabled = false,
  confirmLabel,
  description,
  onClose,
  onConfirm,
  pendingLabel = "Working...",
  title,
  tone = "danger",
}: ActionConfirmDialogProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClose() {
    if (!isSubmitting) onClose();
  }

  async function handleConfirm() {
    setError("");
    setIsSubmitting(true);

    try {
      await onConfirm();
      onClose();
    } catch (confirmError) {
      setError(getErrorMessage(confirmError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog
      bodyClassName={cn(
        "grid flex-none gap-4",
        !children && !error && "hidden",
      )}
      className="min-[761px]:max-w-[520px] [&>footer]:border-t-0 [&>header]:border-b-0"
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
      description={description}
      footer={
        <>
          <Button disabled={isSubmitting} onClick={handleClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || confirmDisabled}
            onClick={() => void handleConfirm()}
            variant={tone === "danger" ? "danger" : "primary"}
          >
            {isSubmitting ? pendingLabel : confirmLabel}
          </Button>
        </>
      }
      onClose={handleClose}
      title={title}
    >
      {children}
      {error && (
        <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </ResponsiveDialog>
  );
}

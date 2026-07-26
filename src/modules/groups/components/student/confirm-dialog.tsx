"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Button, ResponsiveDialog } from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";

type ConfirmDialogProps = {
  children?: ReactNode;
  confirmLabel: string;
  description: string;
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
  title: string;
  tone?: "default" | "danger";
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

export function ConfirmDialog({
  children,
  confirmLabel,
  description,
  onClose,
  onConfirm,
  title,
  tone = "default",
}: ConfirmDialogProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      closeOnBackdrop={false}
      description={description}
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={handleConfirm}
            variant={tone === "danger" ? "danger" : "primary"}
          >
            {isSubmitting ? "Working..." : confirmLabel}
          </Button>
        </>
      }
      onClose={onClose}
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

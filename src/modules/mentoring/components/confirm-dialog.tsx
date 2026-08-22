"use client";

import { useState } from "react";
import { Button, ResponsiveDialog } from "@/shared/components";
import { cn } from "@/shared/lib";
import type { ConfirmAction } from "./availability-calendar.types";
import {
  errorPanelClassName,
  getErrorMessage,
} from "./availability-calendar.utils";

export function ConfirmDialog({
  action,
  onClose,
}: {
  action: ConfirmAction;
  onClose: () => void;
}) {
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setFormError("");

    try {
      setIsSubmitting(true);
      await action.onConfirm();
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog
      bodyClassName={cn(
        "grid flex-none gap-4",
        !formError && "hidden",
      )}
      className="min-[761px]:max-w-[500px] [&>footer]:border-t-0 [&>header]:border-b-0"
      description={action.description}
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={handleConfirm}
            variant="danger"
          >
            {isSubmitting ? "Canceling..." : action.confirmLabel}
          </Button>
        </>
      }
      onClose={onClose}
      title={action.title}
    >
      {formError && <div className={errorPanelClassName}>{formError}</div>}
    </ResponsiveDialog>
  );
}

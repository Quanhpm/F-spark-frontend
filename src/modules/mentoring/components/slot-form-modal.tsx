"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button, ResponsiveDialog, TextInput } from "@/shared/components";
import { getMinimumDateTimeLocal } from "@/shared/lib";
import type { MentorAvailabilitySlotDto } from "../types";
import type { SlotFormState } from "./availability-calendar.types";
import {
  EMPTY_SLOT_FORM,
  createFormFromSlot,
  errorPanelClassName,
  getErrorMessage,
  getMinimumEndDateTimeLocal,
  validateSlotForm,
} from "./availability-calendar.utils";

export function SlotFormModal({
  mode,
  onClose,
  onSubmit,
  slot,
}: {
  mode: "create" | "duplicate" | "edit";
  onClose: () => void;
  onSubmit: (form: SlotFormState) => Promise<unknown>;
  slot?: MentorAvailabilitySlotDto;
}) {
  const formId = useId();
  const [form, setForm] = useState<SlotFormState>(() =>
    slot ? createFormFromSlot(slot) : EMPTY_SLOT_FORM,
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const minimumDateTime = getMinimumDateTimeLocal();

  function updateField<K extends keyof SlotFormState>(
    field: K,
    value: SlotFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const validationError = validateSlotForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(form);
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const title =
    mode === "edit"
      ? "Edit slot"
      : mode === "duplicate"
        ? "Duplicate slot"
        : "Create slot";

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[620px]"
      closeLabel="Close slot form"
      description="Publish a Google Meet slot that assigned groups can book."
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} form={formId} type="submit">
            {isSubmitting ? "Saving..." : "Save slot"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={title}
    >
      <form
        aria-label={title}
        className="grid min-w-0 gap-[18px]"
        id={formId}
        onSubmit={handleSubmit}
      >
        {formError && <div className={errorPanelClassName}>{formError}</div>}
        <TextInput
          hint="Future date and time"
          icon={<CalendarClock size={16} />}
          label="Start"
          min={minimumDateTime}
          onChange={(event) => updateField("startAt", event.target.value)}
          type="datetime-local"
          value={form.startAt}
        />
        <TextInput
          hint="Future date and time"
          icon={<CalendarClock size={16} />}
          label="End"
          min={getMinimumEndDateTimeLocal(form.startAt, minimumDateTime)}
          onChange={(event) => updateField("endAt", event.target.value)}
          type="datetime-local"
          value={form.endAt}
        />
        <TextInput
          label="Google Meet link"
          onChange={(event) => updateField("meetLink", event.target.value)}
          placeholder="https://meet.google.com/abc-defg-hij"
          value={form.meetLink}
        />
        <TextInput
          label="Note"
          onChange={(event) => updateField("note", event.target.value)}
          placeholder="Office hours, project review..."
          value={form.note}
        />
      </form>
    </ResponsiveDialog>
  );
}

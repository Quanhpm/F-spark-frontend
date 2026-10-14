"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { CalendarClock } from "lucide-react";
import {
  Button,
  DateTimeInput,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import { getMinimumDateTimeLocal } from "@/shared/lib";
import type { MentorAvailabilitySlotDto } from "../types";
import type { SlotFormState } from "./availability-calendar.types";
import {
  EMPTY_SLOT_FORM,
  DEFAULT_SLOT_DURATION_MINUTES,
  createFormFromSlot,
  errorPanelClassName,
  getErrorMessage,
  getSlotEndDateTimeLocal,
  getSlotDurationMinutes,
  isWholeMinute,
  MINUTE_IN_MS,
  SLOT_DURATION_OPTIONS,
  type SlotDurationMinutes,
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
  const [durationMinutes, setDurationMinutes] = useState<SlotDurationMinutes>(
    () =>
      slot
        ? getSlotDurationMinutes(slot.startAt, slot.endAt)
        : DEFAULT_SLOT_DURATION_MINUTES,
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const minimumDateTime = getMinimumDateTimeLocal();
  const invalidStartPrecision =
    Boolean(form.startAt) && !isWholeMinute(form.startAt);
  const invalidDuration =
    Boolean(form.startAt && form.endAt) &&
    new Date(form.endAt).getTime() - new Date(form.startAt).getTime() !==
      durationMinutes * MINUTE_IN_MS;

  function updateField<K extends keyof SlotFormState>(
    field: K,
    value: SlotFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateStartAt(startAt: string) {
    setForm((current) => ({
      ...current,
      endAt: getSlotEndDateTimeLocal(startAt, durationMinutes),
      startAt,
    }));
  }

  function updateDuration(nextDuration: SlotDurationMinutes) {
    setDurationMinutes(nextDuration);
    setForm((current) => ({
      ...current,
      endAt: getSlotEndDateTimeLocal(current.startAt, nextDuration),
    }));
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
          <Button
            disabled={
              isSubmitting ||
              !form.startAt ||
              !form.endAt ||
              !form.meetLink.trim() ||
              invalidStartPrecision ||
              invalidDuration
            }
            form={formId}
            type="submit"
          >
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
        <p className="m-0 text-sm text-muted">
          Choose a 1-hour or 2-hour-15-minute slot starting at any minute.
        </p>
        <DateTimeInput
          error={
            invalidStartPrecision
              ? "Choose a start time without seconds."
              : undefined
          }
          hint="Choose any date and minute."
          label="Start"
          min={minimumDateTime}
          onChange={(event) => updateStartAt(event.target.value)}
          required
          step={60}
          type="datetime-local"
          value={form.startAt}
        />
        <Select
          label="Duration"
          onChange={(event) =>
            updateDuration(Number(event.target.value) as SlotDurationMinutes)
          }
          value={durationMinutes}
        >
          {SLOT_DURATION_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes === 60 ? "1 hour" : "2 hours 15 minutes"}
            </option>
          ))}
        </Select>
        <TextInput
          error={
            invalidDuration
              ? "End must match the selected duration."
              : undefined
          }
          hint="Calculated automatically"
          icon={<CalendarClock size={16} />}
          label="End"
          readOnly
          type="datetime-local"
          value={form.endAt}
        />
        <TextInput
          label="Google Meet link"
          onChange={(event) => updateField("meetLink", event.target.value)}
          placeholder="https://meet.google.com/abc-defg-hij"
          required
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

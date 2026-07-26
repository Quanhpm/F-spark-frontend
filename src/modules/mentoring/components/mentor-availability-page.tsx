"use client";

import type { CSSProperties, FormEvent } from "react";
import { useId, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import {
  ApiError,
  cn,
  getMinimumDateTimeLocal,
  toDateTimeLocalValue,
} from "@/shared/lib";
import type { SlotStatus } from "@/shared/types";

import {
  useCancelSlot,
  useCreateSlot,
  useMyAvailability,
  useUpdateSlot,
} from "../hooks";
import type {
  CreateAvailabilitySlotRequest,
  MentorAvailabilitySlotDto,
  UpdateAvailabilitySlotRequest,
} from "../types";

type SlotFormState = {
  endAt: string;
  meetLink: string;
  note: string;
  startAt: string;
};

type ConfirmAction = {
  confirmLabel: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  title: string;
};

const MEET_LINK_REGEX =
  /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

const EMPTY_SLOT_FORM: SlotFormState = {
  endAt: "",
  meetLink: "",
  note: "",
  startAt: "",
};

const DAY_COUNT = 7;
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 22;
const HOUR_HEIGHT = 68;
const MINUTE_IN_MS = 60_000;

const pageClassName = "grid min-w-0 gap-6";
const toolbarClassName =
  "grid min-w-0 items-end gap-4 border-b border-border pb-5 min-[900px]:grid-cols-[minmax(0,1fr)_240px]";
const errorPanelClassName =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-normal text-red-700";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    timeStyle: "short",
  }).format(new Date(value));
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

function getMinimumEndDateTimeLocal(startAt: string, fallback: string) {
  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) return fallback;

  const minimumEnd = new Date(startDate.getTime() + 60_000);
  const fallbackDate = new Date(fallback);

  return minimumEnd.getTime() > fallbackDate.getTime()
    ? toDateTimeLocalValue(minimumEnd)
    : fallback;
}

function createFormFromSlot(slot: MentorAvailabilitySlotDto): SlotFormState {
  return {
    endAt: toLocalDateTimeInput(slot.endAt),
    meetLink: slot.meetLink,
    note: slot.note ?? "",
    startAt: toLocalDateTimeInput(slot.startAt),
  };
}

function getSlotStatusTone(status: SlotStatus) {
  if (status === "AVAILABLE") return "success";
  if (status === "BOOKED") return "warning";
  return "danger";
}

function startOfWeek(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const dayOffset = (date.getDay() + 6) % DAY_COUNT;
  date.setDate(date.getDate() - dayOffset);
  return date;
}

function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function getDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(left: Date, right: Date) {
  return getDateKey(left) === getDateKey(right);
}

function getMinutesFromStartOfDay(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, DAY_COUNT - 1);
  const startLabel = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(weekStart);
  const endLabel = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(weekEnd);

  return `${startLabel} – ${endLabel}`;
}

function formatDayName(value: Date, format: "long" | "short" = "short") {
  return new Intl.DateTimeFormat("en", { weekday: format }).format(value);
}

function formatDayMonth(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(value);
}

function getTimelineBounds(slots: MentorAvailabilitySlotDto[]) {
  if (slots.length === 0) {
    return { endHour: DEFAULT_END_HOUR, startHour: DEFAULT_START_HOUR };
  }

  const earliestStart = Math.min(
    ...slots.map((slot) => getMinutesFromStartOfDay(slot.startAt)),
  );
  const latestEnd = Math.max(
    ...slots.map((slot) => getMinutesFromStartOfDay(slot.endAt)),
  );

  return {
    endHour: Math.min(
      24,
      Math.max(DEFAULT_END_HOUR, Math.ceil(latestEnd / 60)),
    ),
    startHour: Math.max(
      0,
      Math.min(DEFAULT_START_HOUR, Math.floor(earliestStart / 60)),
    ),
  };
}

function getSlotCardClassName(status: SlotStatus) {
  if (status === "AVAILABLE") {
    return "border-brand-primary/35 bg-surface-warm/65 text-foreground hover:border-brand-primary hover:shadow-card-interactive";
  }

  if (status === "BOOKED") {
    return "border-brand-secondary/45 bg-brand-secondary/10 text-foreground hover:border-brand-secondary hover:shadow-card-interactive";
  }

  return "border-red-200 bg-red-50/85 text-red-800 hover:border-red-300 hover:shadow-card-interactive";
}

type PositionedSlot = {
  lane: number;
  laneCount: number;
  slot: MentorAvailabilitySlotDto;
};

function positionOverlappingSlots(
  slots: MentorAvailabilitySlotDto[],
): PositionedSlot[] {
  const sortedSlots = [...slots].sort(
    (left, right) =>
      new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
  );
  const positionedSlots: PositionedSlot[] = [];
  let cluster: MentorAvailabilitySlotDto[] = [];
  let clusterEnd = 0;

  function flushCluster() {
    if (cluster.length === 0) return;

    const laneEnds: number[] = [];
    const lanes = cluster.map((slot) => {
      const startAt = new Date(slot.startAt).getTime();
      const endAt = new Date(slot.endAt).getTime();
      const availableLane = laneEnds.findIndex((laneEnd) => laneEnd <= startAt);
      const lane = availableLane === -1 ? laneEnds.length : availableLane;
      laneEnds[lane] = endAt;
      return { lane, slot };
    });

    positionedSlots.push(
      ...lanes.map(({ lane, slot }) => ({
        lane,
        laneCount: laneEnds.length,
        slot,
      })),
    );
    cluster = [];
    clusterEnd = 0;
  }

  sortedSlots.forEach((slot) => {
    const startAt = new Date(slot.startAt).getTime();
    const endAt = new Date(slot.endAt).getTime();

    if (cluster.length > 0 && startAt >= clusterEnd) {
      flushCluster();
    }

    cluster.push(slot);
    clusterEnd = Math.max(clusterEnd, endAt);
  });

  flushCluster();
  return positionedSlots;
}

function validateSlotForm(form: SlotFormState) {
  if (!form.startAt || !form.endAt) {
    return "Start and end time are required.";
  }

  const startAt = new Date(form.startAt).getTime();
  const endAt = new Date(form.endAt).getTime();

  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) {
    return "Please choose valid start and end times.";
  }

  if (startAt <= Date.now()) {
    return "Start time must be in the future.";
  }

  if (endAt <= Date.now()) {
    return "End time must be in the future.";
  }

  if (endAt <= startAt) {
    return "End time must be after start time.";
  }

  if (!MEET_LINK_REGEX.test(form.meetLink.trim())) {
    return "Meet link must match https://meet.google.com/abc-defg-hij.";
  }

  return null;
}

function createSlotPayload(form: SlotFormState): CreateAvailabilitySlotRequest {
  return {
    endAt: toIsoDateTime(form.endAt),
    meetLink: form.meetLink.trim(),
    note: optional(form.note),
    startAt: toIsoDateTime(form.startAt),
  };
}

function updateSlotPayload(form: SlotFormState): UpdateAvailabilitySlotRequest {
  return createSlotPayload(form);
}

function ConfirmDialog({
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
      closeOnBackdrop={false}
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

function SlotFormModal({
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
      closeOnBackdrop={false}
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
            icon={<CalendarClock size={16} />}
            hint="Future date and time"
            label="Start"
            onChange={(event) => updateField("startAt", event.target.value)}
            min={minimumDateTime}
            type="datetime-local"
            value={form.startAt}
          />
          <TextInput
            icon={<CalendarClock size={16} />}
            hint="Future date and time"
            label="End"
            onChange={(event) => updateField("endAt", event.target.value)}
            min={getMinimumEndDateTimeLocal(form.startAt, minimumDateTime)}
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

function SlotDetailsDialog({
  onCancel,
  onClose,
  onDuplicate,
  onEdit,
  slot,
}: {
  onCancel: () => void;
  onClose: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  slot: MentorAvailabilitySlotDto;
}) {
  const isAvailable = slot.status === "AVAILABLE";

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[560px]"
      closeLabel="Close slot details"
      description={formatDate(slot.startAt)}
      footer={
        isAvailable ? (
          <>
            <Button
              icon={<Trash2 size={16} />}
              onClick={onCancel}
              variant="danger"
            >
              Cancel slot
            </Button>
            <Button
              icon={<Copy size={16} />}
              onClick={onDuplicate}
              variant="secondary"
            >
              Duplicate
            </Button>
            <Button icon={<Pencil size={16} />} onClick={onEdit}>
              Edit slot
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        )
      }
      onClose={onClose}
      title="Availability details"
    >
      <div className="grid gap-4">
        <div className="grid gap-3 rounded-xl border border-border bg-background p-4 min-[481px]:grid-cols-[minmax(0,1fr)_auto] min-[481px]:items-start">
          <div className="grid gap-1.5">
            <span className="flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-muted uppercase">
              <Clock3 aria-hidden="true" size={15} />
              Time
            </span>
            <strong className="text-lg text-foreground">
              {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
            </strong>
          </div>
          <Badge tone={getSlotStatusTone(slot.status)}>{slot.status}</Badge>
        </div>

        <div className="grid gap-1.5">
          <span className="text-xs font-bold tracking-[0.08em] text-muted uppercase">
            Note
          </span>
          <p className="m-0 rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground">
            {slot.note ?? "No note was added for this slot."}
          </p>
        </div>

        <a
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-center text-sm font-medium !text-white transition-[background,box-shadow,transform] duration-[160ms] hover:bg-brand-primary-hover focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)] active:scale-[0.98]"
          href={slot.meetLink}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" size={16} />
          Open Google Meet
        </a>
      </div>
    </ResponsiveDialog>
  );
}

function getSlotPositionStyle(
  positionedSlot: PositionedSlot,
  startHour: number,
): CSSProperties {
  const { lane, laneCount, slot } = positionedSlot;
  const slotStart = getMinutesFromStartOfDay(slot.startAt);
  const duration = Math.max(
    15,
    (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) /
      MINUTE_IN_MS,
  );
  const top = ((slotStart - startHour * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max(38, (duration / 60) * HOUR_HEIGHT - 4);
  const laneWidth = 100 / laneCount;

  return {
    height,
    left: `calc(${lane * laneWidth}% + 4px)`,
    top: top + 2,
    width: `calc(${laneWidth}% - 8px)`,
  };
}

function TimelineSlotCard({
  compact = false,
  onSelect,
  positionedSlot,
  startHour,
}: {
  compact?: boolean;
  onSelect: (slot: MentorAvailabilitySlotDto) => void;
  positionedSlot: PositionedSlot;
  startHour: number;
}) {
  const { slot } = positionedSlot;

  return (
    <button
      aria-label={`${slot.status} slot, ${formatDateTime(slot.startAt)} to ${formatTime(slot.endAt)}. Open details.`}
      className={cn(
        "absolute z-10 grid min-h-9 min-w-0 cursor-pointer content-start gap-0.5 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-card transition-[border-color,box-shadow,transform] duration-[160ms] focus-visible:z-20 focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)] active:scale-[0.99]",
        getSlotCardClassName(slot.status),
      )}
      onClick={() => onSelect(slot)}
      style={getSlotPositionStyle(positionedSlot, startHour)}
      title="Open slot details"
      type="button"
    >
      <span className="truncate text-[11px] leading-tight font-bold">
        {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
      </span>
      {!compact && (
        <span className="truncate text-[10px] leading-tight opacity-75">
          {slot.note || slot.status}
        </span>
      )}
    </button>
  );
}

function TimeGutter({ endHour, startHour }: { endHour: number; startHour: number }) {
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, index) => startHour + index,
  );

  return (
    <div aria-hidden="true" className="relative border-r border-border bg-surface">
      {hours.map((hour, index) => (
        <span
          className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-muted"
          key={hour}
          style={{ top: index * HOUR_HEIGHT }}
        >
          {String(hour).padStart(2, "0")}:00
        </span>
      ))}
    </div>
  );
}

function TimelineDayCanvas({
  compact = false,
  date,
  endHour,
  onSelectSlot,
  slots,
  startHour,
}: {
  compact?: boolean;
  date: Date;
  endHour: number;
  onSelectSlot: (slot: MentorAvailabilitySlotDto) => void;
  slots: MentorAvailabilitySlotDto[];
  startHour: number;
}) {
  const positionedSlots = positionOverlappingSlots(slots);
  const hourCount = endHour - startHour;
  const now = new Date();
  const nowMinutes = getMinutesFromStartOfDay(now);
  const showCurrentTime =
    isSameDay(date, now) &&
    nowMinutes >= startHour * 60 &&
    nowMinutes <= endHour * 60;

  return (
    <div
      className={cn(
        "relative min-w-0 bg-surface",
        isSameDay(date, now) && "bg-surface-warm/35",
      )}
      style={{ height: hourCount * HOUR_HEIGHT }}
    >
      {Array.from({ length: hourCount + 1 }, (_, index) => (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 border-t border-border/80"
          key={index}
          style={{ top: index * HOUR_HEIGHT }}
        />
      ))}

      {showCurrentTime && (
        <div
          aria-label="Current time"
          className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-brand-primary"
          style={{
            top: ((nowMinutes - startHour * 60) / 60) * HOUR_HEIGHT,
          }}
        >
          <span className="absolute -top-1.5 -left-1 size-3 rounded-full bg-brand-primary" />
        </div>
      )}

      {positionedSlots.map((positionedSlot) => (
        <TimelineSlotCard
          compact={compact}
          key={positionedSlot.slot.id}
          onSelect={onSelectSlot}
          positionedSlot={positionedSlot}
          startHour={startHour}
        />
      ))}
    </div>
  );
}

function AvailabilityWeekTimeline({
  onSelectDate,
  onSelectSlot,
  selectedDateKey,
  slots,
  weekStart,
}: {
  onSelectDate: (date: Date) => void;
  onSelectSlot: (slot: MentorAvailabilitySlotDto) => void;
  selectedDateKey: string;
  slots: MentorAvailabilitySlotDto[];
  weekStart: Date;
}) {
  const weekDays = Array.from({ length: DAY_COUNT }, (_, index) =>
    addDays(weekStart, index),
  );
  const weekEnd = addDays(weekStart, DAY_COUNT);
  const weekSlots = slots.filter((slot) => {
    const startAt = new Date(slot.startAt);
    return startAt >= weekStart && startAt < weekEnd;
  });
  const slotsByDay = weekDays.map((date) =>
    weekSlots.filter((slot) => getDateKey(slot.startAt) === getDateKey(date)),
  );
  const { endHour, startHour } = getTimelineBounds(weekSlots);
  const selectedDayIndex = Math.max(
    0,
    weekDays.findIndex((date) => getDateKey(date) === selectedDateKey),
  );
  const selectedDay = weekDays[selectedDayIndex];
  const hourCount = endHour - startHour;

  return (
    <div className="grid min-w-0 gap-4">
      {weekSlots.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-border-warm bg-surface-warm/55 px-4 py-3.5 text-sm text-foreground">
          <CalendarDays
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-brand-primary"
            size={18}
          />
          <p className="m-0 leading-relaxed">
            No slots in this week. Move to another week or create a new slot.
          </p>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5 min-[1100px]:hidden">
        {weekDays.map((date, index) => {
          const isSelected = getDateKey(date) === selectedDateKey;
          const isToday = isSameDay(date, new Date());

          return (
            <button
              aria-label={`${formatDayName(date, "long")}, ${formatDayMonth(date)}, ${slotsByDay[index].length} slots`}
              aria-pressed={isSelected}
              className={cn(
                "grid min-h-14 min-w-0 place-items-center gap-0.5 rounded-xl border px-1 py-2 text-center transition-[background,border-color,color,box-shadow] duration-[160ms] focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]",
                isSelected
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-border bg-surface text-muted hover:border-border-warm hover:bg-background",
              )}
              key={getDateKey(date)}
              onClick={() => onSelectDate(date)}
              type="button"
            >
              <span className="text-[10px] leading-none font-bold tracking-wide uppercase">
                {formatDayName(date).slice(0, 2)}
              </span>
              <span className="text-sm leading-none font-bold">
                {date.getDate()}
              </span>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  slotsByDay[index].length > 0
                    ? isSelected
                      ? "bg-white"
                      : "bg-brand-primary"
                    : "bg-transparent",
                  isToday && !isSelected && "ring-2 ring-brand-secondary",
                )}
              />
            </button>
          );
        })}
      </div>

      <section className="grid min-w-0 gap-3 min-[1100px]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="m-0 text-base font-bold text-foreground">
              {formatDayName(selectedDay, "long")}
            </h3>
            <p className="m-0 mt-0.5 text-xs text-muted">
              {formatDayMonth(selectedDay)} · {slotsByDay[selectedDayIndex].length}{" "}
              slots
            </p>
          </div>
          {isSameDay(selectedDay, new Date()) && (
            <Badge tone="brand">Today</Badge>
          )}
        </div>
        <div className="grid min-w-0 grid-cols-[60px_minmax(0,1fr)] overflow-hidden rounded-xl border border-border">
          <TimeGutter endHour={endHour} startHour={startHour} />
          <TimelineDayCanvas
            date={selectedDay}
            endHour={endHour}
            onSelectSlot={onSelectSlot}
            slots={slotsByDay[selectedDayIndex]}
            startHour={startHour}
          />
        </div>
      </section>

      <section className="hidden min-w-0 overflow-hidden rounded-xl border border-border min-[1100px]:block">
        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-border bg-background">
          <div className="flex items-center justify-center border-r border-border text-[10px] font-bold tracking-[0.08em] text-muted uppercase">
            Time
          </div>
          {weekDays.map((date, index) => {
            const isToday = isSameDay(date, new Date());

            return (
              <button
                aria-label={`${formatDayName(date, "long")}, ${formatDayMonth(date)}, ${slotsByDay[index].length} slots`}
                className={cn(
                  "grid min-h-[76px] min-w-0 place-items-center content-center gap-1 border-r border-border px-2 py-3 text-center transition-colors last:border-r-0 hover:bg-surface-warm/50 focus-visible:z-10 focus-visible:outline-0 focus-visible:shadow-[inset_0_0_0_2px_var(--brand-secondary)]",
                  isToday && "bg-surface-warm/60",
                )}
                key={getDateKey(date)}
                onClick={() => onSelectDate(date)}
                type="button"
              >
                <span className="text-[11px] font-bold tracking-[0.08em] text-muted uppercase">
                  {formatDayName(date)}
                </span>
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-sm font-bold text-foreground",
                    isToday && "bg-brand-primary text-white",
                  )}
                >
                  {date.getDate()}
                </span>
                <span className="text-[10px] text-muted">
                  {slotsByDay[index].length} slots
                </span>
              </button>
            );
          })}
        </div>
        <div
          className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]"
          style={{ height: hourCount * HOUR_HEIGHT }}
        >
          <TimeGutter endHour={endHour} startHour={startHour} />
          {weekDays.map((date, index) => (
            <div className="min-w-0 border-r border-border last:border-r-0" key={getDateKey(date)}>
              <TimelineDayCanvas
                compact
                date={date}
                endHour={endHour}
                onSelectSlot={onSelectSlot}
                slots={slotsByDay[index]}
                startHour={startHour}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function MentorAvailabilityPage() {
  const [statusFilter, setStatusFilter] = useState<"" | SlotStatus>("");
  const [modal, setModal] = useState<
    "create" | "details" | "duplicate" | "edit" | null
  >(null);
  const [selectedSlot, setSelectedSlot] =
    useState<MentorAvailabilitySlotDto | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    getDateKey(new Date()),
  );

  const availabilityQuery = useMyAvailability();
  const createSlotMutation = useCreateSlot();
  const updateSlotMutation = useUpdateSlot();
  const cancelSlotMutation = useCancelSlot();

  const availableSlots = useMemo(
    () =>
      (availabilityQuery.data?.data ?? []).filter(
        (slot) => slot.status === "AVAILABLE",
      ),
    [availabilityQuery.data?.data],
  );

  const filteredSlots = useMemo(() => {
      const slots = availabilityQuery.data?.data ?? [];
      const visibleSlots = statusFilter
        ? slots.filter((slot) => slot.status === statusFilter)
        : slots;

      return [...visibleSlots].sort(
        (left, right) =>
          new Date(right.startAt).getTime() - new Date(left.startAt).getTime(),
      );
    }, [availabilityQuery.data?.data, statusFilter]);

  async function handleCreateSlot(form: SlotFormState) {
    await createSlotMutation.mutateAsync(createSlotPayload(form));
  }

  async function handleUpdateSlot(form: SlotFormState) {
    if (!selectedSlot) return;

    await updateSlotMutation.mutateAsync({
      payload: updateSlotPayload(form),
      slotId: selectedSlot.id,
    });
  }

  function requestCancelSlot(slot: MentorAvailabilitySlotDto) {
    setConfirmAction({
      confirmLabel: "Cancel slot",
      description: `Cancel the availability slot starting ${formatDateTime(
        slot.startAt,
      )}.`,
      onConfirm: () => cancelSlotMutation.mutateAsync(slot.id),
      title: "Cancel availability slot",
    });
  }

  function requestCancelAvailableSlots() {
    setConfirmAction({
      confirmLabel: "Cancel available slots",
      description: `Cancel all ${availableSlots.length} currently available slots?`,
      onConfirm: () =>
        Promise.all(
          availableSlots.map((slot) => cancelSlotMutation.mutateAsync(slot.id)),
        ),
      title: "Cancel available slots",
    });
  }

  function moveWeek(direction: -1 | 1) {
    setWeekStart((currentWeek) => addDays(currentWeek, direction * DAY_COUNT));
    setSelectedDateKey((currentDateKey) => {
      const currentDate = new Date(`${currentDateKey}T12:00:00`);
      return getDateKey(addDays(currentDate, direction * DAY_COUNT));
    });
  }

  function showCurrentWeek() {
    const today = new Date();
    setWeekStart(startOfWeek(today));
    setSelectedDateKey(getDateKey(today));
  }

  return (
    <div className={pageClassName}>
      <PageHeader
        actions={
          <>
            {availableSlots.length > 0 && (
              <Button
                icon={<Trash2 size={16} />}
                onClick={requestCancelAvailableSlots}
                variant="secondary"
              >
                Cancel available
              </Button>
            )}
            <Button
              icon={<Plus size={16} />}
              onClick={() => {
                setSelectedSlot(null);
                setModal("create");
              }}
            >
              Create slot
            </Button>
          </>
        }
        description="Create, update, and cancel availability slots that assigned groups can book."
        eyebrow="Mentor"
        title="Availability"
      />

      <Card>
        <CardHeader
          description="Review your availability across the week and select a slot to manage it."
          title="Weekly schedule"
        />
        <CardContent>
          <div className={toolbarClassName}>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface p-1">
                <Button
                  aria-label="Previous week"
                  className="size-10 px-0"
                  icon={<ChevronLeft size={18} />}
                  onClick={() => moveWeek(-1)}
                  size="sm"
                  variant="ghost"
                >
                  <span className="sr-only">Previous week</span>
                </Button>
                <Button
                  aria-label="Next week"
                  className="size-10 px-0"
                  icon={<ChevronRight size={18} />}
                  onClick={() => moveWeek(1)}
                  size="sm"
                  variant="ghost"
                >
                  <span className="sr-only">Next week</span>
                </Button>
              </div>
              <div className="min-w-[150px] flex-1 px-1">
                <span className="block text-[11px] font-bold tracking-[0.08em] text-muted uppercase">
                  Week
                </span>
                <strong className="block truncate text-sm text-foreground min-[481px]:text-base">
                  {formatWeekRange(weekStart)}
                </strong>
              </div>
              <Button
                icon={<CalendarDays size={16} />}
                onClick={showCurrentWeek}
                size="sm"
                variant="secondary"
              >
                Today
              </Button>
            </div>
            <Select
              label="Status"
              onChange={(event) =>
                setStatusFilter(event.target.value as "" | SlotStatus)
              }
              value={statusFilter}
            >
              <option value="">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
              <option value="CANCELED">Canceled</option>
            </Select>
          </div>
        </CardContent>

        {availabilityQuery.isLoading ? (
          <CardContent>
            <LoadingState title="Loading availability" />
          </CardContent>
        ) : availabilityQuery.isError ? (
          <CardContent>
            <div className={errorPanelClassName}>
              {getErrorMessage(availabilityQuery.error)}
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <AvailabilityWeekTimeline
              onSelectDate={(date) => setSelectedDateKey(getDateKey(date))}
              onSelectSlot={(slot) => {
                setSelectedSlot(slot);
                setModal("details");
              }}
              selectedDateKey={selectedDateKey}
              slots={filteredSlots}
              weekStart={weekStart}
            />
          </CardContent>
        )}
      </Card>

      {modal === "details" && selectedSlot && (
        <SlotDetailsDialog
          onCancel={() => {
            setModal(null);
            requestCancelSlot(selectedSlot);
          }}
          onClose={() => {
            setModal(null);
            setSelectedSlot(null);
          }}
          onDuplicate={() => setModal("duplicate")}
          onEdit={() => setModal("edit")}
          slot={selectedSlot}
        />
      )}

      {modal === "create" && (
        <SlotFormModal
          mode="create"
          onClose={() => setModal(null)}
          onSubmit={handleCreateSlot}
        />
      )}

      {modal === "duplicate" && selectedSlot && (
        <SlotFormModal
          mode="duplicate"
          onClose={() => {
            setModal(null);
            setSelectedSlot(null);
          }}
          onSubmit={handleCreateSlot}
          slot={selectedSlot}
        />
      )}

      {modal === "edit" && selectedSlot && (
        <SlotFormModal
          mode="edit"
          onClose={() => {
            setModal(null);
            setSelectedSlot(null);
          }}
          onSubmit={handleUpdateSlot}
          slot={selectedSlot}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

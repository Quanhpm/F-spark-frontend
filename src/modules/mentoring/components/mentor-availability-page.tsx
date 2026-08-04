"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";
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
import type { MeetingStatus, SlotStatus } from "@/shared/types";

import {
  useCancelSlot,
  useConfirmMeeting,
  useCreateSlot,
  useMyAvailability,
  useMyMeetings,
  useUpdateSlot,
} from "../hooks";
import type {
  CreateAvailabilitySlotRequest,
  MentorAvailabilitySlotDto,
  MentorMeetingDto,
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

type CalendarEventStatus = "AVAILABLE" | MeetingStatus;
type CalendarStatusFilter = "" | CalendarEventStatus;
type CalendarView = "DAY" | "WEEK";

type SlotCalendarEvent = {
  endAt: string;
  id: string;
  kind: "SLOT";
  slot: MentorAvailabilitySlotDto;
  startAt: string;
  status: CalendarEventStatus;
};

type MeetingCalendarEvent = {
  endAt: string;
  id: string;
  kind: "MEETING";
  meeting: MentorMeetingDto;
  startAt: string;
  status: MeetingStatus;
};

type AvailabilityCalendarEvent = SlotCalendarEvent | MeetingCalendarEvent;

const MEET_LINK_REGEX =
  /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

const EMPTY_SLOT_FORM: SlotFormState = {
  endAt: "",
  meetLink: "",
  note: "",
  startAt: "",
};

const DAY_COUNT = 7;
const DEFAULT_START_HOUR = 0;
const DEFAULT_END_HOUR = 24;
const HOUR_HEIGHT = 40;
const MINUTE_IN_MS = 60_000;

const pageClassName = "grid min-w-0 gap-6";
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

function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function startOfWeek(value: Date) {
  const date = new Date(value);
  const dayOffset = (date.getDay() + 6) % DAY_COUNT;
  date.setDate(date.getDate() - dayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(value: Date) {
  const date = new Date(value);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addMonths(value: Date, amount: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + amount);
  return date;
}

function getMonthCalendarDays(month: Date) {
  const monthStart = startOfMonth(month);
  const firstDayOffset = (monthStart.getDay() + 6) % DAY_COUNT;
  const calendarStart = addDays(monthStart, -firstDayOffset);

  return Array.from({ length: 42 }, (_, index) =>
    addDays(calendarStart, index),
  );
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

function formatDayName(value: Date, format: "long" | "short" = "short") {
  return new Intl.DateTimeFormat("en", { weekday: format }).format(value);
}

function formatDayMonth(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(value);
}

function formatCalendarHeading(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatMonthYear(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(value);
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

function getTimelineBounds(events: AvailabilityCalendarEvent[]) {
  if (events.length === 0) {
    return { endHour: DEFAULT_END_HOUR, startHour: DEFAULT_START_HOUR };
  }

  const earliestStart = Math.min(
    ...events.map((event) => getMinutesFromStartOfDay(event.startAt)),
  );
  const latestEnd = Math.max(
    ...events.map((event) => getMinutesFromStartOfDay(event.endAt)),
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

function getCalendarEventStatusTone(status: CalendarEventStatus) {
  if (status === "AVAILABLE") return "brand";
  if (status === "COMPLETED") return "success";
  if (status === "CANCELED") return "danger";
  return "warning";
}

function getCalendarEventCardClassName(status: CalendarEventStatus) {
  if (status === "AVAILABLE") {
    return "border-amber-300/70 bg-amber-500/10 text-amber-950 hover:border-amber-400 hover:bg-amber-500/15 hover:shadow-card-interactive";
  }

  if (status === "SCHEDULED") {
    return "border-blue-300/70 bg-blue-500/10 text-blue-950 hover:border-blue-400 hover:bg-blue-500/15 hover:shadow-card-interactive";
  }

  if (status === "COMPLETED") {
    return "border-emerald-300/70 bg-emerald-500/10 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-500/15 hover:shadow-card-interactive";
  }

  return "border-red-300/70 bg-red-500/10 text-red-950 hover:border-red-400 hover:bg-red-500/15 hover:shadow-card-interactive";
}

function createCalendarEvents(
  slots: MentorAvailabilitySlotDto[],
  meetings: MentorMeetingDto[],
) {
  const meetingsBySlotId = new Map(
    meetings.map((meeting) => [meeting.slotId, meeting]),
  );
  const slotIds = new Set(slots.map((slot) => slot.id));
  const events: AvailabilityCalendarEvent[] = slots.map((slot) => {
    const meeting = meetingsBySlotId.get(slot.id);

    if (meeting) {
      return {
        endAt: meeting.endAt,
        id: `meeting-${meeting.id}`,
        kind: "MEETING",
        meeting,
        startAt: meeting.startAt,
        status: meeting.status,
      };
    }

    return {
      endAt: slot.endAt,
      id: `slot-${slot.id}`,
      kind: "SLOT",
      slot,
      startAt: slot.startAt,
      status: slot.status === "BOOKED" ? "SCHEDULED" : slot.status,
    };
  });

  meetings.forEach((meeting) => {
    if (slotIds.has(meeting.slotId)) return;

    events.push({
      endAt: meeting.endAt,
      id: `meeting-${meeting.id}`,
      kind: "MEETING",
      meeting,
      startAt: meeting.startAt,
      status: meeting.status,
    });
  });

  return events.sort(
    (left, right) =>
      new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
  );
}

type PositionedCalendarEvent = {
  event: AvailabilityCalendarEvent;
  lane: number;
  laneCount: number;
};

function positionOverlappingEvents(
  events: AvailabilityCalendarEvent[],
): PositionedCalendarEvent[] {
  const sortedEvents = [...events].sort(
    (left, right) =>
      new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
  );
  const positionedEvents: PositionedCalendarEvent[] = [];
  let cluster: AvailabilityCalendarEvent[] = [];
  let clusterEnd = 0;

  function flushCluster() {
    if (cluster.length === 0) return;

    const laneEnds: number[] = [];
    const lanes = cluster.map((event) => {
      const startAt = new Date(event.startAt).getTime();
      const endAt = new Date(event.endAt).getTime();
      const availableLane = laneEnds.findIndex((laneEnd) => laneEnd <= startAt);
      const lane = availableLane === -1 ? laneEnds.length : availableLane;
      laneEnds[lane] = endAt;
      return { event, lane };
    });

    positionedEvents.push(
      ...lanes.map(({ event, lane }) => ({
        event,
        lane,
        laneCount: laneEnds.length,
      })),
    );
    cluster = [];
    clusterEnd = 0;
  }

  sortedEvents.forEach((event) => {
    const startAt = new Date(event.startAt).getTime();
    const endAt = new Date(event.endAt).getTime();

    if (cluster.length > 0 && startAt >= clusterEnd) {
      flushCluster();
    }

    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, endAt);
  });

  flushCluster();
  return positionedEvents;
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

function getCalendarEventPositionStyle(
  positionedEvent: PositionedCalendarEvent,
  startHour: number,
): CSSProperties {
  const { event, lane, laneCount } = positionedEvent;
  const eventStart = getMinutesFromStartOfDay(event.startAt);
  const duration = Math.max(
    15,
    (new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) /
      MINUTE_IN_MS,
  );
  const top = ((eventStart - startHour * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max(38, (duration / 60) * HOUR_HEIGHT - 4);
  const laneWidth = 100 / laneCount;

  return {
    height,
    left: `calc(${lane * laneWidth}% + 4px)`,
    top: top + 2,
    width: `calc(${laneWidth}% - 8px)`,
  };
}

function TimelineEventCard({
  onSelect,
  positionedEvent,
  startHour,
}: {
  onSelect: (event: AvailabilityCalendarEvent) => void;
  positionedEvent: PositionedCalendarEvent;
  startHour: number;
}) {
  const { event } = positionedEvent;
  const eventTitle =
    event.kind === "MEETING"
      ? `${event.meeting.groupNo} · ${event.meeting.groupName}`
      : event.slot.note || "Availability slot";

  return (
    <button
      aria-label={`${event.status}, ${eventTitle}, ${formatDateTime(event.startAt)} to ${formatTime(event.endAt)}. Open details.`}
      className={cn(
        "absolute z-10 grid min-h-9 min-w-0 cursor-pointer content-start gap-0.5 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-card transition-[border-color,box-shadow,transform] duration-[160ms] focus-visible:z-20 focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)] active:scale-[0.99]",
        getCalendarEventCardClassName(event.status),
      )}
      onClick={() => onSelect(event)}
      style={getCalendarEventPositionStyle(positionedEvent, startHour)}
      title="Open event details"
      type="button"
    >
      <span className="truncate text-[11px] leading-tight font-bold">
        {formatTime(event.startAt)} – {formatTime(event.endAt)}
      </span>
      <span className="truncate text-[11px] leading-tight font-medium">
        {eventTitle}
      </span>
      <span className="truncate text-[10px] leading-tight opacity-75">
        {event.status}
      </span>
    </button>
  );
}

function TimeGutter({ endHour, startHour }: { endHour: number; startHour: number }) {
  const hours = Array.from(
    { length: endHour - startHour },
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
  date,
  endHour,
  events,
  onSelectEvent,
  startHour,
}: {
  date: Date;
  endHour: number;
  events: AvailabilityCalendarEvent[];
  onSelectEvent: (event: AvailabilityCalendarEvent) => void;
  startHour: number;
}) {
  const positionedEvents = positionOverlappingEvents(events);
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

      {positionedEvents.map((positionedEvent) => (
        <TimelineEventCard
          key={positionedEvent.event.id}
          onSelect={onSelectEvent}
          positionedEvent={positionedEvent}
          startHour={startHour}
        />
      ))}
    </div>
  );
}

function AvailabilityDayTimeline({
  date,
  events,
  onSelectEvent,
}: {
  date: Date;
  events: AvailabilityCalendarEvent[];
  onSelectEvent: (event: AvailabilityCalendarEvent) => void;
}) {
  const dayEvents = events.filter(
    (event) => getDateKey(event.startAt) === getDateKey(date),
  );
  const { endHour, startHour } = getTimelineBounds(dayEvents);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="m-0 text-base font-bold text-foreground">
            {formatDayName(date, "long")}
          </h2>
          <p className="m-0 mt-0.5 text-xs text-muted">
            {formatDayMonth(date)} · {dayEvents.length} calendar events
          </p>
        </div>
        {isSameDay(date, new Date()) && <Badge tone="brand">Today</Badge>}
      </div>

      {dayEvents.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-border-warm bg-surface-warm/55 px-4 py-3.5 text-sm text-foreground">
          <CalendarDays
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-brand-primary"
            size={18}
          />
          <p className="m-0 leading-relaxed">
            No slots for this day. Choose another date or add a new event.
          </p>
        </div>
      )}

      <div className="h-[calc(100dvh-260px)] min-h-[360px] min-w-0 shrink-0 max-h-[720px] overflow-x-hidden overflow-y-auto rounded-xl border border-border">
        <div className="grid min-w-[420px] grid-cols-[60px_minmax(0,1fr)]">
          <TimeGutter endHour={endHour} startHour={startHour} />
          <TimelineDayCanvas
            date={date}
            endHour={endHour}
            events={dayEvents}
            onSelectEvent={onSelectEvent}
            startHour={startHour}
          />
        </div>
      </div>
    </section>
  );
}

function AvailabilityWeekTimeline({
  onSelectDate,
  events,
  onSelectEvent,
  weekStart,
}: {
  onSelectDate: (date: Date) => void;
  events: AvailabilityCalendarEvent[];
  onSelectEvent: (event: AvailabilityCalendarEvent) => void;
  weekStart: Date;
}) {
  const days = Array.from({ length: DAY_COUNT }, (_, index) =>
    addDays(weekStart, index),
  );
  const { endHour, startHour } = getTimelineBounds(events);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="m-0 text-base font-bold text-foreground">
            Week view
          </h2>
          <p className="m-0 mt-0.5 text-xs text-muted">
            {formatWeekRange(weekStart)} · {events.length} calendar events
          </p>
        </div>
        <Badge tone="brand">7 days</Badge>
      </div>

      {events.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-border-warm bg-surface-warm/55 px-4 py-3.5 text-sm text-foreground">
          <CalendarDays
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-brand-primary"
            size={18}
          />
          <p className="m-0 leading-relaxed">
            No slots for this week. Choose another week or add a new event.
          </p>
        </div>
      )}

      <div className="h-[calc(100dvh-260px)] min-h-[360px] min-w-0 shrink-0 max-h-[720px] overflow-x-hidden overflow-y-auto rounded-xl border border-border">
        <div className="grid min-w-0 grid-cols-[48px_repeat(7,minmax(0,1fr))] grid-rows-[auto_auto]">
          <div className="sticky top-0 z-30 border-r border-b border-border bg-surface" />
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());

            return (
              <button
                aria-label={`Select ${formatDayName(day, "long")}, ${formatDayMonth(day)}`}
                className={cn(
                  "sticky top-0 z-30 min-w-0 border-b border-border bg-surface px-1 py-2 text-center transition-colors hover:bg-background focus-visible:z-40 focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]",
                  isToday && "bg-surface-warm/75",
                )}
                key={getDateKey(day)}
                onClick={() => onSelectDate(day)}
                type="button"
              >
                <span
                  className={cn(
                    "block truncate text-[10px] font-bold tracking-[0.06em] text-muted uppercase",
                    isToday && "text-brand-primary",
                  )}
                >
                  {formatDayName(day)}
                </span>
                <span
                  className={cn(
                    "mx-auto mt-1 grid size-7 place-items-center rounded-full text-sm font-bold text-foreground",
                    isToday && "bg-brand-primary text-white",
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}

          <TimeGutter endHour={endHour} startHour={startHour} />
          {days.map((day) => (
            <TimelineDayCanvas
              date={day}
              endHour={endHour}
              events={events.filter(
                (event) => getDateKey(event.startAt) === getDateKey(day),
              )}
              key={getDateKey(day)}
              onSelectEvent={onSelectEvent}
              startHour={startHour}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniMonthCalendar({
  calendarMonth,
  events,
  onMoveMonth,
  onSelectDate,
  selectedDateKey,
}: {
  calendarMonth: Date;
  events: AvailabilityCalendarEvent[];
  onMoveMonth: (direction: -1 | 1) => void;
  onSelectDate: (date: Date) => void;
  selectedDateKey: string;
}) {
  const calendarDays = getMonthCalendarDays(calendarMonth);
  const eventDateKeys = new Set(
    events.map((event) => getDateKey(event.startAt)),
  );
  const monthKey = calendarMonth.getMonth();

  return (
    <section className="grid min-w-0 gap-4 border-b border-border p-4 min-[761px]:p-5">
      <div className="flex items-center justify-between gap-3">
        <Button
          aria-label="Previous month"
          className="size-9 px-0"
          icon={<ChevronLeft size={16} />}
          onClick={() => onMoveMonth(-1)}
          size="sm"
          variant="ghost"
        >
          <span className="sr-only">Previous month</span>
        </Button>
        <h2 className="m-0 text-sm font-bold text-foreground">
          {formatMonthYear(calendarMonth)}
        </h2>
        <Button
          aria-label="Next month"
          className="size-9 px-0"
          icon={<ChevronRight size={16} />}
          onClick={() => onMoveMonth(1)}
          size="sm"
          variant="ghost"
        >
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <span
            className="text-[10px] font-bold tracking-[0.06em] text-muted uppercase"
            key={day}
          >
            {day}
          </span>
        ))}
        {calendarDays.map((date) => {
          const dateKey = getDateKey(date);
          const isSelected = dateKey === selectedDateKey;
          const isToday = isSameDay(date, new Date());
          const isCurrentMonth = date.getMonth() === monthKey;
          const hasEvents = eventDateKeys.has(dateKey);

          return (
            <button
              aria-label={`${formatDayName(date, "long")}, ${formatDayMonth(date)}${hasEvents ? ", has calendar events" : ""}`}
              aria-pressed={isSelected}
              className={cn(
                "relative mx-auto grid size-8 place-items-center rounded-full text-xs transition-[background,color,box-shadow] duration-[160ms] focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]",
                isSelected
                  ? "bg-foreground font-bold text-white"
                  : isCurrentMonth
                    ? "text-foreground hover:bg-background"
                    : "text-muted/45 hover:bg-background",
                isToday && !isSelected && "ring-2 ring-brand-secondary",
              )}
              key={dateKey}
              onClick={() => onSelectDate(date)}
              type="button"
            >
              {date.getDate()}
              {hasEvents && (
                <span
                  className={cn(
                    "absolute -bottom-0.5 size-1 rounded-full",
                    isSelected ? "bg-white" : "bg-brand-primary",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SelectedEventPanel({
  confirmError,
  event,
  isConfirming,
  onConfirmMeeting,
  onViewSlotDetails,
}: {
  confirmError?: string;
  event: AvailabilityCalendarEvent | null;
  isConfirming: boolean;
  onConfirmMeeting: () => void;
  onViewSlotDetails: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!event) {
    return (
      <section className="grid min-w-0 gap-4 p-4 min-[761px]:p-5">
        <div className="grid gap-2 py-2 text-sm text-muted">
          <CalendarClock className="text-brand-primary" size={20} />
          <strong className="text-foreground">No event selected</strong>
          <p className="m-0 leading-relaxed">
            Select an availability slot or booked meeting to see its details.
          </p>
        </div>
      </section>
    );
  }

  if (event.kind === "MEETING") {
    const { meeting } = event;
    const hasStarted = new Date(meeting.startAt).getTime() <= now;
    const mentorConfirmed = meeting.mentorConfirmedAt !== null;
    const leaderConfirmed = meeting.leaderConfirmedAt !== null;
    const canConfirm =
      meeting.status === "SCHEDULED" && hasStarted && !mentorConfirmed;

    return (
      <section className="grid min-w-0 gap-4 p-4 min-[761px]:p-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <span className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">
              Booked meeting
            </span>
            <h2 className="m-0 break-words text-base font-bold text-foreground">
              {meeting.groupName}
            </h2>
            <span className="text-xs text-muted">{meeting.groupNo}</span>
          </div>
          <Badge tone={getCalendarEventStatusTone(meeting.status)}>
            {meeting.status}
          </Badge>
        </div>

        <div className="grid gap-2 text-sm text-muted">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 shrink-0" size={16} />
            <span>{formatDate(meeting.startAt)}</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 shrink-0" size={16} />
            <span>
              {formatTime(meeting.startAt)} – {formatTime(meeting.endAt)}
            </span>
          </div>
          <p className="m-0 text-sm text-muted">
            Booked by{" "}
            <strong className="font-medium text-foreground">
              {meeting.bookedByStudentName}
            </strong>{" "}
            ({meeting.bookedByStudentCode})
          </p>
        </div>

        <div className="grid gap-2 rounded-xl border border-border bg-background p-3.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted">Group leader</span>
            <Badge tone={leaderConfirmed ? "success" : "neutral"}>
              {leaderConfirmed ? "Confirmed" : "Pending"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted">Mentor</span>
            <Badge tone={mentorConfirmed ? "success" : "neutral"}>
              {mentorConfirmed ? "Confirmed" : "Pending"}
            </Badge>
          </div>
        </div>

        <a
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium !text-brand-primary transition-colors hover:bg-background hover:!text-brand-primary-hover"
          href={meeting.meetLink}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" size={15} />
          Open Google Meet
        </a>

        {confirmError && <div className={errorPanelClassName}>{confirmError}</div>}

        {meeting.status === "SCHEDULED" && (
          <div className="grid gap-2">
            <Button
              disabled={!canConfirm || isConfirming}
              onClick={onConfirmMeeting}
              size="sm"
            >
              {isConfirming
                ? "Confirming..."
                : mentorConfirmed
                  ? "Mentor confirmed"
                  : "Confirm meeting"}
            </Button>
          </div>
        )}
      </section>
    );
  }

  const { slot } = event;

  return (
    <section className="grid min-w-0 gap-4 p-4 min-[761px]:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">
            Availability slot
          </span>
          <h2 className="m-0 break-words text-base font-bold text-foreground">
            {slot.note || "Availability slot"}
          </h2>
        </div>
        <Badge tone={getSlotStatusTone(slot.status)}>{slot.status}</Badge>
      </div>

      <div className="grid gap-2 text-sm text-muted">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 shrink-0" size={16} />
          <span>{formatDate(slot.startAt)}</span>
        </div>
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 shrink-0" size={16} />
          <span>
            {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
          </span>
        </div>
      </div>

      {slot.note && (
        <p className="m-0 rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed text-foreground">
          {slot.note}
        </p>
      )}

      <Button onClick={onViewSlotDetails} size="sm" variant="secondary">
        Open details
      </Button>
    </section>
  );
}

export function MentorAvailabilityPage() {
  const [statusFilter, setStatusFilter] =
    useState<CalendarStatusFilter>("");
  const [modal, setModal] = useState<
    "create" | "details" | "duplicate" | "edit" | null
  >(null);
  const [selectedEvent, setSelectedEvent] =
    useState<AvailabilityCalendarEvent | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("WEEK");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    getDateKey(new Date()),
  );

  const availabilityQuery = useMyAvailability();
  const meetingsQuery = useMyMeetings();
  const createSlotMutation = useCreateSlot();
  const updateSlotMutation = useUpdateSlot();
  const cancelSlotMutation = useCancelSlot();
  const confirmMeetingMutation = useConfirmMeeting();
  const selectedSlot =
    selectedEvent?.kind === "SLOT" ? selectedEvent.slot : null;

  const availableSlots = useMemo(
    () =>
      (availabilityQuery.data?.data ?? []).filter(
        (slot) => slot.status === "AVAILABLE",
      ),
    [availabilityQuery.data?.data],
  );

  const calendarEvents = useMemo(
    () =>
      createCalendarEvents(
        availabilityQuery.data?.data ?? [],
        meetingsQuery.data?.data ?? [],
      ),
    [availabilityQuery.data?.data, meetingsQuery.data?.data],
  );

  const filteredEvents = useMemo(() => {
    return statusFilter
      ? calendarEvents.filter((event) => event.status === statusFilter)
      : calendarEvents;
  }, [calendarEvents, statusFilter]);

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

  async function handleConfirmSelectedMeeting() {
    if (selectedEvent?.kind !== "MEETING") return;

    try {
      const response = await confirmMeetingMutation.mutateAsync({
        groupId: selectedEvent.meeting.groupId,
        meetingId: selectedEvent.meeting.id,
      });
      const meeting = response.data;

      setSelectedEvent({
        endAt: meeting.endAt,
        id: `meeting-${meeting.id}`,
        kind: "MEETING",
        meeting,
        startAt: meeting.startAt,
        status: meeting.status,
      });
    } catch {
      // React Query exposes the error in the selected-event panel.
    }
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

  function selectCalendarDate(date: Date) {
    setSelectedDateKey(getDateKey(date));
    setWeekStart(startOfWeek(date));
    setCalendarMonth(startOfMonth(date));
    setSelectedEvent(null);
    confirmMeetingMutation.reset();
  }

  function moveWeek(direction: -1 | 1) {
    const currentSelectedDate = new Date(`${selectedDateKey}T12:00:00`);
    const nextWeekStart = addDays(weekStart, direction * DAY_COUNT);

    setWeekStart(nextWeekStart);
    setSelectedDateKey(
      getDateKey(addDays(currentSelectedDate, direction * DAY_COUNT)),
    );
    setCalendarMonth(startOfMonth(nextWeekStart));
    setSelectedEvent(null);
    confirmMeetingMutation.reset();
  }

  function moveDay(direction: -1 | 1) {
    const currentDate = new Date(`${selectedDateKey}T12:00:00`);
    selectCalendarDate(addDays(currentDate, direction));
  }

  function showToday() {
    const today = new Date();
    selectCalendarDate(today);
  }

  function moveMonth(direction: -1 | 1) {
    setCalendarMonth((currentMonth) => addMonths(currentMonth, direction));
  }

  const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
  const isWeekView = calendarView === "WEEK";

  return (
    <div className={pageClassName}>
      <PageHeader
        actions={
          availableSlots.length > 0 ? (
            <Button
              icon={<Trash2 size={16} />}
              onClick={requestCancelAvailableSlots}
              variant="secondary"
            >
              Cancel available
            </Button>
          ) : undefined
        }
        description="Create, update, and cancel availability slots that assigned groups can book."
        eyebrow="Mentor"
        title="Availability"
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-border p-4 min-[761px]:p-5">
          <div className="grid min-w-0 gap-0.5">
            <span className="text-[10px] font-bold tracking-[0.08em] text-muted uppercase">
              {isWeekView ? "Week view" : "Day view"}
            </span>
            <strong className="truncate text-base text-foreground min-[481px]:text-lg">
              {isWeekView
                ? formatWeekRange(weekStart)
                : formatCalendarHeading(selectedDate)}
            </strong>
          </div>

          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
            <div
              aria-label="Calendar view"
              className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface p-1"
              role="group"
            >
              {(["WEEK", "DAY"] as const).map((view) => (
                <Button
                  aria-pressed={calendarView === view}
                  className="min-w-14 px-2"
                  key={view}
                  onClick={() => setCalendarView(view)}
                  size="sm"
                  variant={calendarView === view ? "secondary" : "ghost"}
                >
                  {view === "WEEK" ? "Week" : "Day"}
                </Button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface p-1">
              <Button
                aria-label={`Previous ${isWeekView ? "week" : "day"}`}
                className="size-9 px-0"
                icon={<ChevronLeft size={17} />}
                onClick={() => (isWeekView ? moveWeek(-1) : moveDay(-1))}
                size="sm"
                variant="ghost"
              >
                <span className="sr-only">
                  Previous {isWeekView ? "week" : "day"}
                </span>
              </Button>
              <Button
                aria-label={`Next ${isWeekView ? "week" : "day"}`}
                className="size-9 px-0"
                icon={<ChevronRight size={17} />}
                onClick={() => (isWeekView ? moveWeek(1) : moveDay(1))}
                size="sm"
                variant="ghost"
              >
                <span className="sr-only">
                  Next {isWeekView ? "week" : "day"}
                </span>
              </Button>
            </div>
            <Button
              icon={<CalendarDays size={16} />}
              onClick={showToday}
              size="sm"
              variant="secondary"
            >
              Today
            </Button>
            <Select
              aria-label="Filter availability by status"
              fieldClassName="w-[150px]"
              shellClassName="h-10"
              value={statusFilter}
              onChange={(event) => {
                setSelectedEvent(null);
                confirmMeetingMutation.reset();
                setStatusFilter(event.target.value as CalendarStatusFilter);
              }}
            >
              <option value="">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
            </Select>
            <Button
              icon={<Plus size={16} />}
              onClick={() => {
                setSelectedEvent(null);
                setModal("create");
              }}
              size="sm"
            >
              Add event
            </Button>
          </div>
        </div>

        {availabilityQuery.isLoading || meetingsQuery.isLoading ? (
          <CardContent>
            <LoadingState title="Loading calendar" />
          </CardContent>
        ) : availabilityQuery.isError || meetingsQuery.isError ? (
          <CardContent>
            <div className={errorPanelClassName}>
              {getErrorMessage(
                availabilityQuery.error ?? meetingsQuery.error,
              )}
            </div>
          </CardContent>
        ) : (
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-h-0 min-w-0 flex-col p-4 min-[761px]:p-6">
              {isWeekView ? (
                <AvailabilityWeekTimeline
                  events={filteredEvents}
                  onSelectDate={selectCalendarDate}
                  onSelectEvent={(event) => {
                    selectCalendarDate(new Date(event.startAt));
                    setSelectedEvent(event);
                    setModal(event.kind === "SLOT" ? "details" : null);
                  }}
                  weekStart={weekStart}
                />
              ) : (
                <AvailabilityDayTimeline
                  date={selectedDate}
                  events={filteredEvents}
                  onSelectEvent={(event) => {
                    setSelectedEvent(event);
                    setModal(event.kind === "SLOT" ? "details" : null);
                  }}
                />
              )}
            </div>
            <aside className="min-w-0 border-t border-border lg:border-t-0 lg:border-l">
              <MiniMonthCalendar
                calendarMonth={calendarMonth}
                events={filteredEvents}
                onMoveMonth={moveMonth}
                onSelectDate={selectCalendarDate}
                selectedDateKey={selectedDateKey}
              />
              <SelectedEventPanel
                confirmError={
                  confirmMeetingMutation.error
                    ? getErrorMessage(confirmMeetingMutation.error)
                    : undefined
                }
                event={selectedEvent}
                isConfirming={confirmMeetingMutation.isPending}
                onConfirmMeeting={handleConfirmSelectedMeeting}
                onViewSlotDetails={() => setModal("details")}
              />
            </aside>
          </div>
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
            setSelectedEvent(null);
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
            setSelectedEvent(null);
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
            setSelectedEvent(null);
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

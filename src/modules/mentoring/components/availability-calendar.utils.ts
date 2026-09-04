import type { CSSProperties } from "react";
import { ApiError, toDateTimeLocalValue } from "@/shared/lib";
import type { SlotStatus } from "@/shared/types";
import type {
  CreateAvailabilitySlotRequest,
  MentorAvailabilitySlotDto,
  MentorMeetingDto,
  UpdateAvailabilitySlotRequest,
} from "../types";
import type {
  AvailabilityCalendarEvent,
  CalendarEventStatus,
  PositionedCalendarEvent,
  SlotFormState,
} from "./availability-calendar.types";

export const MEET_LINK_REGEX =
  /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

export const EMPTY_SLOT_FORM: SlotFormState = {
  endAt: "",
  meetLink: "",
  note: "",
  startAt: "",
};

export const DAY_COUNT = 7;
export const DEFAULT_START_HOUR = 0;
export const DEFAULT_END_HOUR = 24;
export const HOUR_HEIGHT = 40;
export const MINUTE_IN_MS = 60_000;
export const MIN_SLOT_DURATION_MS = 60 * MINUTE_IN_MS;
export const MAX_SLOT_DURATION_MS = 12 * 60 * MINUTE_IN_MS;
export const BUSINESS_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const pageClassName = "grid min-w-0 gap-6";
export const errorPanelClassName =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-normal text-red-700";

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

export function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
  }).format(new Date(value));
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    timeStyle: "short",
  }).format(new Date(value));
}

export function toLocalDateTimeInput(value: string): string {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function toIsoDateTime(value: string): string {
  return new Date(value).toISOString();
}

export function getMinimumEndDateTimeLocal(
  startAt: string,
  fallback: string,
): string {
  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) return fallback;

  const minimumEnd = new Date(startDate.getTime() + 60_000);
  const fallbackDate = new Date(fallback);

  return minimumEnd.getTime() > fallbackDate.getTime()
    ? toDateTimeLocalValue(minimumEnd)
    : fallback;
}

export function createFormFromSlot(
  slot: MentorAvailabilitySlotDto,
): SlotFormState {
  return {
    endAt: toLocalDateTimeInput(slot.endAt),
    meetLink: slot.meetLink,
    note: slot.note ?? "",
    startAt: toLocalDateTimeInput(slot.startAt),
  };
}

export function getSlotStatusTone(status: SlotStatus) {
  if (status === "AVAILABLE") return "success";
  if (status === "BOOKED") return "warning";
  return "danger";
}

export function addDays(value: Date, amount: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function startOfWeek(value: Date): Date {
  const date = new Date(value);
  const dayOffset = (date.getDay() + 6) % DAY_COUNT;
  date.setDate(date.getDate() - dayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfMonth(value: Date): Date {
  const date = new Date(value);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addMonths(value: Date, amount: number): Date {
  const date = new Date(value);
  date.setMonth(date.getMonth() + amount);
  return date;
}

export function getMonthCalendarDays(month: Date): Date[] {
  const monthStart = startOfMonth(month);
  const firstDayOffset = (monthStart.getDay() + 6) % DAY_COUNT;
  const calendarStart = addDays(monthStart, -firstDayOffset);

  return Array.from({ length: 42 }, (_, index) =>
    addDays(calendarStart, index),
  );
}

export function getDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getBusinessDateKey(value: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
  }).format(value instanceof Date ? value : new Date(value));
}

export function isSameDay(left: Date, right: Date): boolean {
  return getDateKey(left) === getDateKey(right);
}

export function getMinutesFromStartOfDay(value: Date | string): number {
  const date = value instanceof Date ? value : new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

export function formatDayName(
  value: Date,
  format: "long" | "short" = "short",
): string {
  return new Intl.DateTimeFormat("en", { weekday: format }).format(value);
}

export function formatDayMonth(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(value);
}

export function formatCalendarHeading(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatMonthYear(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatWeekRange(weekStart: Date): string {
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

export function getTimelineBounds(events: AvailabilityCalendarEvent[]): {
  endHour: number;
  startHour: number;
} {
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

export function getCalendarEventStatusTone(status: CalendarEventStatus) {
  if (status === "AVAILABLE") return "brand";
  if (status === "COMPLETED") return "success";
  if (status === "CANCELED") return "danger";
  return "warning";
}

export function getCalendarEventCardClassName(status: CalendarEventStatus): string {
  if (status === "AVAILABLE") {
    return "border-brand-secondary/60 bg-brand-secondary/10 text-foreground hover:border-brand-secondary hover:bg-brand-secondary/15 hover:shadow-card-interactive";
  }

  if (status === "SCHEDULED") {
    return "border-brand-primary/40 bg-brand-primary/5 text-foreground hover:border-brand-primary/70 hover:bg-brand-primary/10 hover:shadow-card-interactive";
  }

  if (status === "COMPLETED") {
    return "border-border-warm bg-surface-warm text-foreground hover:border-brand-secondary/70 hover:bg-surface-warm/80 hover:shadow-card-interactive";
  }

  return "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 hover:shadow-card-interactive";
}

export function createCalendarEvents(
  slots: MentorAvailabilitySlotDto[],
  meetings: MentorMeetingDto[],
): AvailabilityCalendarEvent[] {
  const visibleSlots = slots.filter((slot) => slot.status !== "CANCELED");
  const visibleMeetings = meetings.filter(
    (meeting) => meeting.status !== "CANCELED",
  );
  const meetingsBySlotId = new Map(
    visibleMeetings.map((meeting) => [meeting.slotId, meeting]),
  );
  const slotIds = new Set(visibleSlots.map((slot) => slot.id));
  const events: AvailabilityCalendarEvent[] = visibleSlots.map((slot) => {
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

  visibleMeetings.forEach((meeting) => {
    if (meeting.slotId !== null && slotIds.has(meeting.slotId)) return;

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

export function positionOverlappingEvents(
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

export function validateSlotForm(form: SlotFormState): string | null {
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

  if (endAt - startAt < MIN_SLOT_DURATION_MS) {
    return "Availability slots must be at least 1 hour long.";
  }

  if (endAt - startAt > MAX_SLOT_DURATION_MS) {
    return "Availability slots cannot be longer than 12 hours.";
  }

  if (
    getBusinessDateKey(new Date(startAt)) !==
    getBusinessDateKey(new Date(endAt))
  ) {
    return "Availability slots must start and end on the same day (Asia/Ho_Chi_Minh).";
  }

  if (!MEET_LINK_REGEX.test(form.meetLink.trim())) {
    return "Meet link must match https://meet.google.com/abc-defg-hij.";
  }

  return null;
}

export function createSlotPayload(
  form: SlotFormState,
): CreateAvailabilitySlotRequest {
  return {
    endAt: toIsoDateTime(form.endAt),
    meetLink: form.meetLink.trim(),
    note: optional(form.note),
    startAt: toIsoDateTime(form.startAt),
  };
}

export function updateSlotPayload(
  form: SlotFormState,
): UpdateAvailabilitySlotRequest {
  return createSlotPayload(form);
}

export function getCalendarEventPositionStyle(
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
  const durationWithinDay = Math.min(duration, 24 * 60 - eventStart);
  const height = Math.max(38, (durationWithinDay / 60) * HOUR_HEIGHT - 4);
  const overlapOffset = laneCount > 1 ? lane * 10 : 0;
  const horizontalInset = 8 + (laneCount > 1 ? (laneCount - 1) * 10 : 0);

  return {
    height,
    left: `${4 + overlapOffset}px`,
    top: top + 2,
    width: `calc(100% - ${horizontalInset}px)`,
    zIndex: 10 + lane,
  };
}

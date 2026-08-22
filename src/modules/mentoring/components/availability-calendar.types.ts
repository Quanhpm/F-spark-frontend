import type { MeetingStatus } from "@/shared/types";
import type { MentorAvailabilitySlotDto, MentorMeetingDto } from "../types";

export type SlotFormState = {
  endAt: string;
  meetLink: string;
  note: string;
  startAt: string;
};

export type ConfirmAction = {
  confirmLabel: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  title: string;
};

export type CalendarEventStatus = "AVAILABLE" | MeetingStatus;
export type CalendarStatusFilter = "" | CalendarEventStatus;
export type CalendarView = "DAY" | "WEEK";

export type SlotCalendarEvent = {
  endAt: string;
  id: string;
  kind: "SLOT";
  slot: MentorAvailabilitySlotDto;
  startAt: string;
  status: CalendarEventStatus;
};

export type MeetingCalendarEvent = {
  endAt: string;
  id: string;
  kind: "MEETING";
  meeting: MentorMeetingDto;
  startAt: string;
  status: MeetingStatus;
};

export type AvailabilityCalendarEvent =
  | SlotCalendarEvent
  | MeetingCalendarEvent;

export type PositionedCalendarEvent = {
  event: AvailabilityCalendarEvent;
  lane: number;
  laneCount: number;
};

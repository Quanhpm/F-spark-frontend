"use client";

import { cn } from "@/shared/lib";
import type {
  AvailabilityCalendarEvent,
  PositionedCalendarEvent,
} from "./availability-calendar.types";
import {
  HOUR_HEIGHT,
  MINUTE_IN_MS,
  formatDateTime,
  formatTime,
  formatTimelineTime,
  getCalendarEventCardClassName,
  getCalendarEventPositionStyle,
  getMinutesFromStartOfDay,
  isSameDay,
  positionOverlappingEvents,
} from "./availability-calendar.utils";

export function TimelineEventCard({
  onSelect,
  positionedEvent,
  startHour,
}: {
  onSelect: (event: AvailabilityCalendarEvent) => void;
  positionedEvent: PositionedCalendarEvent;
  startHour: number;
}) {
  const { event } = positionedEvent;
  const durationMinutes =
    (new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) /
    MINUTE_IN_MS;
  const isCompact = durationMinutes < 45;
  const eventTitle =
    event.kind === "MEETING"
      ? `${event.meeting.groupNo} · ${event.meeting.groupName}`
      : event.slot.note || "Availability slot";

  return (
    <button
      aria-label={`${event.status}, ${eventTitle}, ${formatDateTime(event.startAt)} to ${formatTime(event.endAt)}. Open details.`}
      className={cn(
        "absolute min-h-9 min-w-0 cursor-pointer overflow-hidden rounded-lg border text-left shadow-card transition-[border-color,box-shadow,transform] duration-[160ms] hover:z-30 hover:shadow-card-interactive focus-visible:z-40 focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)] active:scale-[0.99]",
        isCompact
          ? "block px-2 py-1.5"
          : "grid content-center gap-1 px-2 py-1.5",
        getCalendarEventCardClassName(event.status),
      )}
      onClick={() => onSelect(event)}
      style={getCalendarEventPositionStyle(positionedEvent, startHour)}
      title={`${eventTitle} · ${formatDateTime(event.startAt)} to ${formatTime(event.endAt)}`}
      type="button"
    >
      <span className="truncate text-[11px] leading-tight font-bold">
        {formatTimelineTime(event.startAt)}–{formatTimelineTime(event.endAt)}
      </span>
      {!isCompact && (
        <>
          <span className="truncate text-[11px] leading-tight font-medium">
            {eventTitle}
          </span>
        </>
      )}
    </button>
  );
}

export function TimeGutter({
  endHour,
  startHour,
}: {
  endHour: number;
  startHour: number;
}) {
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

export function TimelineDayCanvas({
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
      {Array.from({ length: hourCount * 2 + 1 }, (_, index) => (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 border-t",
            index % 2 === 0
              ? "border-border/80"
              : "border-dashed border-border/45",
          )}
          key={index}
          style={{ top: index * (HOUR_HEIGHT / 2) }}
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

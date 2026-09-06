"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { Badge } from "@/shared/components";
import type { AvailabilityCalendarEvent } from "./availability-calendar.types";
import {
  formatDayMonth,
  formatDayName,
  getDateKey,
  getTimelineBounds,
  isSameDay,
} from "./availability-calendar.utils";
import { TimeGutter, TimelineDayCanvas } from "./timeline-day-canvas";

export function AvailabilityDayTimeline({
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            icon={<Clock3 aria-hidden="true" size={13} />}
            size="sm"
            tone="neutral"
          >
            {String(startHour).padStart(2, "0")}:00–
            {String(endHour).padStart(2, "0")}:00
          </Badge>
          {isSameDay(date, new Date()) && <Badge tone="brand">Today</Badge>}
        </div>
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

      <div className="min-h-[360px] min-w-0 max-h-[calc(100dvh-260px)] overflow-x-hidden overflow-y-auto rounded-xl border border-border lg:max-h-[720px]">
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

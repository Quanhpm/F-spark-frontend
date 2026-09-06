"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { Badge } from "@/shared/components";
import { cn } from "@/shared/lib";
import type { AvailabilityCalendarEvent } from "./availability-calendar.types";
import {
  DAY_COUNT,
  addDays,
  formatDayMonth,
  formatDayName,
  formatWeekRange,
  getDateKey,
  getTimelineBounds,
  isSameDay,
} from "./availability-calendar.utils";
import { TimeGutter, TimelineDayCanvas } from "./timeline-day-canvas";

export function AvailabilityWeekTimeline({
  events,
  onSelectDate,
  onSelectEvent,
  weekStart,
}: {
  events: AvailabilityCalendarEvent[];
  onSelectDate: (date: Date) => void;
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            icon={<Clock3 aria-hidden="true" size={13} />}
            size="sm"
            tone="neutral"
          >
            {String(startHour).padStart(2, "0")}:00–
            {String(endHour).padStart(2, "0")}:00
          </Badge>
          <Badge tone="brand">7 days</Badge>
        </div>
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

      <div className="min-h-[360px] min-w-0 max-h-[calc(100dvh-260px)] overflow-x-hidden overflow-y-auto rounded-xl border border-border lg:max-h-[720px]">
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

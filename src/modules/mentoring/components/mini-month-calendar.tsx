"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components";
import { cn } from "@/shared/lib";
import type { AvailabilityCalendarEvent } from "./availability-calendar.types";
import {
  formatDayMonth,
  formatDayName,
  formatMonthYear,
  getDateKey,
  getMonthCalendarDays,
  isSameDay,
} from "./availability-calendar.utils";

export function MiniMonthCalendar({
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

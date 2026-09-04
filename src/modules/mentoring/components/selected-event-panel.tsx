"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  Clock3,
  ExternalLink,
} from "lucide-react";
import { Badge, Button } from "@/shared/components";
import type { AvailabilityCalendarEvent } from "./availability-calendar.types";
import {
  errorPanelClassName,
  formatDate,
  formatTime,
  getCalendarEventStatusTone,
  getSlotStatusTone,
} from "./availability-calendar.utils";

export function SelectedEventPanel({
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

        {meeting.meetLink && <a
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium !text-brand-primary transition-colors hover:bg-background hover:!text-brand-primary-hover"
          href={meeting.meetLink}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" size={15} />
          Open Google Meet
        </a>}

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

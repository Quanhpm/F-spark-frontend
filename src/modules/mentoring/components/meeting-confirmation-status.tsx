import { CheckCircle2, Clock3 } from "lucide-react";

import type { MentorMeetingDto } from "../types";
import { formatMentorIdentity } from "./availability-calendar.utils";

function formatConfirmationTime(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function PendingIcon() {
  return <Clock3 aria-hidden="true" className="mt-0.5 shrink-0 text-amber-600" size={17} />;
}

function ConfirmedIcon() {
  return <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-green-700" size={17} />;
}

export function MeetingConfirmationStatus({
  compact = false,
  meeting,
}: {
  compact?: boolean;
  meeting: MentorMeetingDto;
}) {
  const studentConfirmed = Boolean(
    meeting.evidenceImageUrl?.trim() || meeting.evidenceSubmittedAt,
  );
  const mentorConfirmed = Boolean(meeting.mentorConfirmedAt);
  const legacyCompleted = meeting.status === "COMPLETED";
  const studentTime = formatConfirmationTime(meeting.evidenceSubmittedAt);
  const mentorTime = formatConfirmationTime(meeting.mentorConfirmedAt);

  return (
    <section
      aria-label="Meeting confirmation status"
      className={
        compact
          ? "grid min-w-44 gap-2 text-xs"
          : "grid gap-2 rounded-xl border border-border bg-background/70 p-3 sm:grid-cols-2"
      }
    >
      <div className="flex min-w-0 items-start gap-2">
        {studentConfirmed ? <ConfirmedIcon /> : <PendingIcon />}
        <div className="min-w-0">
          <strong className="block text-xs text-foreground">Student side</strong>
          <span className="block break-words text-muted">
            {studentConfirmed
              ? `Evidence submitted by ${meeting.evidenceSubmittedByStudentName?.trim() || "a group member"}`
              : legacyCompleted
                ? "Confirmation not recorded (legacy meeting)"
                : "Evidence not submitted yet"}
          </span>
          {studentTime && <span className="block text-[11px] text-muted">{studentTime}</span>}
        </div>
      </div>

      <div className="flex min-w-0 items-start gap-2">
        {mentorConfirmed ? <ConfirmedIcon /> : <PendingIcon />}
        <div className="min-w-0">
          <strong className="block text-xs text-foreground">Mentor side</strong>
          <span className="block break-words text-muted">
            {mentorConfirmed
              ? `Confirmed by ${formatMentorIdentity(meeting)}`
              : legacyCompleted
                ? "Confirmation not recorded (legacy meeting)"
                : `Awaiting ${formatMentorIdentity(meeting)}`}
          </span>
          {mentorTime && <span className="block text-[11px] text-muted">{mentorTime}</span>}
        </div>
      </div>
    </section>
  );
}

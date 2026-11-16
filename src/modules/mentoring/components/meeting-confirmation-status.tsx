"use client";

import { CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { useState } from "react";

import { useFeatureEnabled } from "@/modules/features";

import type { MentorMeetingDto } from "../types";
import { formatMentorIdentity } from "./availability-calendar.utils";
import { MeetingAttendanceDialog } from "./meeting-attendance-dialog";
import { formatAttendanceSummary } from "./meeting-attendance.utils";

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
  adminAttendance = false,
  compact = false,
  meeting,
}: {
  /** Open the attendance dialog in admin correction mode. */
  adminAttendance?: boolean;
  compact?: boolean;
  meeting: MentorMeetingDto;
}) {
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const attendanceText = formatAttendanceSummary(meeting.attendanceSummary);
  const { enabled: attendanceOn } = useFeatureEnabled("MEETING_ATTENDANCE");
  const showAttendance = (attendanceOn || adminAttendance) && meeting.status !== "CANCELED"
    && (Boolean(meeting.mentorConfirmedAt) || Boolean(attendanceText) || adminAttendance);
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

      {showAttendance && (
        <div className={compact ? "flex min-w-0 items-start gap-2" : "flex min-w-0 items-start gap-2 sm:col-span-2"}>
          <ClipboardList aria-hidden="true" className="mt-0.5 shrink-0 text-muted" size={17} />
          <div className="min-w-0">
            <strong className="block text-xs text-foreground">Attendance</strong>
            <span className="block break-words text-muted">
              {attendanceText ?? "Not recorded"}
            </span>
            {!compact && (
              <button
                className="mt-1 text-xs font-semibold text-brand-primary hover:underline"
                onClick={() => setAttendanceOpen(true)}
                type="button"
              >
                View attendance
              </button>
            )}
          </div>
        </div>
      )}
      {attendanceOpen && (
        <MeetingAttendanceDialog
          admin={adminAttendance}
          meeting={meeting}
          onClose={() => setAttendanceOpen(false)}
        />
      )}
    </section>
  );
}

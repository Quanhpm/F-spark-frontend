import type {
  MeetingAttendanceEventAction,
  MeetingAttendanceStatus,
  MeetingAttendanceSummaryDto,
} from "../types";

export const ATTENDANCE_STATUSES: MeetingAttendanceStatus[] = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "EXCUSED",
];

export const ATTENDANCE_LABELS: Record<MeetingAttendanceStatus, string> = {
  ABSENT: "Absent",
  EXCUSED: "Excused",
  LATE: "Late",
  PRESENT: "Present",
};

export type AttendanceTone = "success" | "warning" | "danger" | "neutral";

export const ATTENDANCE_TONES: Record<MeetingAttendanceStatus, AttendanceTone> = {
  ABSENT: "danger",
  EXCUSED: "neutral",
  LATE: "warning",
  PRESENT: "success",
};

export const ATTENDANCE_EVENT_LABELS: Record<MeetingAttendanceEventAction, string> = {
  ADMIN_OVERRIDE: "Admin override",
  MARK: "Marked",
  ROSTER_ADD: "Added to sheet",
  ROSTER_REMOVE: "Removed from sheet",
  UPDATE: "Updated",
};

export function formatAttendanceSummary(summary: MeetingAttendanceSummaryDto | undefined) {
  if (!summary || summary.total === 0) return null;
  const parts = [`${summary.present} present`];
  if (summary.late) parts.push(`${summary.late} late`);
  if (summary.absent) parts.push(`${summary.absent} absent`);
  if (summary.excused) parts.push(`${summary.excused} excused`);
  return `${parts.join(" · ")} (of ${summary.total})`;
}

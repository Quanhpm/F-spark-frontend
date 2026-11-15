"use client";

import { cn } from "@/shared/lib";

import type { MeetingAttendanceStatus } from "../types";
import { ATTENDANCE_LABELS, ATTENDANCE_STATUSES } from "./meeting-attendance.utils";

const selectedClassNames: Record<MeetingAttendanceStatus, string> = {
  ABSENT: "border-red-300 bg-red-50 text-red-700",
  EXCUSED: "border-slate-300 bg-slate-100 text-slate-700",
  LATE: "border-yellow-300 bg-yellow-50 text-yellow-800",
  PRESENT: "border-green-300 bg-green-50 text-green-800",
};

export function AttendanceStatusPicker({
  disabled = false,
  label,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (status: MeetingAttendanceStatus) => void;
  value: MeetingAttendanceStatus | null;
}) {
  return (
    <div aria-label={label} className="flex flex-wrap gap-1.5" role="radiogroup">
      {ATTENDANCE_STATUSES.map((status) => {
        const selected = value === status;
        return (
          <button
            aria-checked={selected}
            className={cn(
              "min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? selectedClassNames[status]
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
            disabled={disabled}
            key={status}
            onClick={() => onChange(status)}
            role="radio"
            type="button"
          >
            {ATTENDANCE_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}

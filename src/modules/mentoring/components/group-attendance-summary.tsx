"use client";

import { useFeatureEnabled } from "@/modules/features";
import { EmptyState, LoadingState } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useGroupAttendanceSummary } from "../hooks";

/** Per-student attendance totals across a group's meetings (instructor, mentor and members). */
export function GroupAttendanceSummary({ groupId }: { groupId: number }) {
  const { enabled: attendanceOn } = useFeatureEnabled("MEETING_ATTENDANCE");
  const summaryQuery = useGroupAttendanceSummary(groupId, attendanceOn);
  const rows = summaryQuery.data?.data ?? [];

  if (!attendanceOn) return null;
  if (summaryQuery.isLoading) return <LoadingState title="Loading attendance" />;
  if (summaryQuery.isError) {
    return (
      <EmptyState
        description={summaryQuery.error instanceof ApiError
          ? summaryQuery.error.message
          : "Unable to load attendance."}
        title="Unable to load attendance"
      />
    );
  }
  if (rows.length === 0) {
    return <p className="m-0 text-sm text-muted">No meeting attendance has been recorded yet.</p>;
  }

  return (
    <>
      {/* Mobile: one card per student so every count is visible without horizontal scrolling. */}
      <ul aria-label="Attendance by student" className="m-0 grid list-none gap-2 p-0 min-[761px]:hidden">
        {rows.map((row) => (
          <li className="grid gap-2 rounded-lg border border-border bg-surface p-3 text-sm" key={`${row.groupId}-${row.studentCode}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 break-words text-foreground">
                <strong>{row.studentName}</strong>
                <span className="block text-xs text-muted">{row.studentCode}</span>
              </span>
              <strong className="shrink-0 text-foreground">{row.attendanceRate}%</strong>
            </div>
            <dl className="m-0 grid grid-cols-5 gap-1 text-center text-xs">
              {[
                ["Meetings", row.totalMeetings],
                ["Present", row.presentCount],
                ["Late", row.lateCount],
                ["Absent", row.absentCount],
                ["Excused", row.excusedCount],
              ].map(([label, value]) => (
                <div className="grid gap-0.5" key={label}>
                  <dt className="text-muted">{label}</dt>
                  <dd className={label === "Absent" && Number(value) > 0 ? "m-0 font-semibold text-red-700" : "m-0 text-foreground"}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden w-full overflow-x-auto min-[761px]:block">
        <table aria-label="Attendance by student" className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead className="text-xs tracking-[0.04em] text-muted uppercase">
            <tr>
              <th className="px-3 py-2 font-bold">Student</th>
              <th className="px-3 py-2 font-bold">Meetings</th>
              <th className="px-3 py-2 font-bold">Present</th>
              <th className="px-3 py-2 font-bold">Late</th>
              <th className="px-3 py-2 font-bold">Absent</th>
              <th className="px-3 py-2 font-bold">Excused</th>
              <th className="px-3 py-2 font-bold">Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-border" key={`${row.groupId}-${row.studentCode}`}>
                <td className="px-3 py-2 text-foreground">
                  <strong>{row.studentName}</strong>
                  <span className="block text-xs text-muted">{row.studentCode}</span>
                </td>
                <td className="px-3 py-2">{row.totalMeetings}</td>
                <td className="px-3 py-2">{row.presentCount}</td>
                <td className="px-3 py-2">{row.lateCount}</td>
                <td className={row.absentCount > 0 ? "px-3 py-2 font-semibold text-red-700" : "px-3 py-2"}>
                  {row.absentCount}
                </td>
                <td className="px-3 py-2">{row.excusedCount}</td>
                <td className="px-3 py-2">{row.attendanceRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

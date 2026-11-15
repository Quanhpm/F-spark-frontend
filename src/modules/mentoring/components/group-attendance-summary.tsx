"use client";

import { EmptyState, LoadingState } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useGroupAttendanceSummary } from "../hooks";

/** Per-student attendance totals across a group's meetings (instructor, mentor and members). */
export function GroupAttendanceSummary({ groupId }: { groupId: number }) {
  const summaryQuery = useGroupAttendanceSummary(groupId);
  const rows = summaryQuery.data?.data ?? [];

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
    <div className="w-full overflow-x-auto">
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
  );
}

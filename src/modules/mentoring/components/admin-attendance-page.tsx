"use client";

import { ChevronLeft, ChevronRight, ClipboardList, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { useAdminFeatures } from "@/modules/features";
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  PageHeader,
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useAdminAttendanceSummaries } from "../hooks";

const PAGE_SIZE = 20;

export function AdminAttendancePage() {
  const featuresQuery = useAdminFeatures();
  const attendanceHidden = featuresQuery.data?.data.some(
    (feature) => feature.key === "MEETING_ATTENDANCE" && !feature.enabled,
  ) ?? false;
  const [searchInput, setSearchInput] = useState("");
  const [termInput, setTermInput] = useState("");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);

  const query = useMemo(
    () => ({ page, search: search || undefined, size: PAGE_SIZE, term: term || undefined }),
    [page, search, term],
  );
  const summariesQuery = useAdminAttendanceSummaries(query);
  const result = summariesQuery.data?.data;
  const rows = result?.content ?? [];

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setTerm(termInput.trim());
    setPage(0);
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Attendance totals per student and group across mentor meetings. Use Meeting evidence to correct a specific meeting."
        eyebrow="Admin"
        title="Meeting attendance"
      />

      {attendanceHidden && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm leading-normal text-yellow-800">
          Meeting attendance is currently hidden from mentors, students and instructors. You can still test it here.{" "}
          <Link className="font-semibold underline" href="/admin/features">Manage feature toggles</Link>
        </div>
      )}

      <Card>
        <CardContent>
          <form
            className="grid grid-cols-[minmax(220px,1fr)_minmax(140px,200px)_auto] items-end gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]"
            onSubmit={apply}
          >
            <TextInput
              icon={<Search size={16} />}
              label="Search"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Student code, name, group"
              value={searchInput}
            />
            <TextInput
              label="Term"
              onChange={(event) => setTermInput(event.target.value)}
              placeholder="e.g. SU26"
              value={termInput}
            />
            <Button icon={<Search size={16} />} type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {summariesQuery.isLoading ? (
        <Card isPadded><LoadingState title="Loading attendance" /></Card>
      ) : summariesQuery.isError ? (
        <Card isPadded>
          <EmptyState
            actions={<Button onClick={() => void summariesQuery.refetch()} variant="secondary">Try again</Button>}
            description={summariesQuery.error instanceof ApiError
              ? summariesQuery.error.message
              : "Unable to load attendance."}
            title="Unable to load attendance"
          />
        </Card>
      ) : rows.length === 0 ? (
        <Card isPadded>
          <EmptyState
            description="No recorded attendance matches these filters."
            icon={<ClipboardList size={22} />}
            title="No attendance found"
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-background text-xs tracking-[0.04em] text-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Student</th>
                  <th className="px-5 py-3 font-bold">Group</th>
                  <th className="px-5 py-3 font-bold">Term</th>
                  <th className="px-5 py-3 font-bold">Meetings</th>
                  <th className="px-5 py-3 font-bold">Present</th>
                  <th className="px-5 py-3 font-bold">Late</th>
                  <th className="px-5 py-3 font-bold">Absent</th>
                  <th className="px-5 py-3 font-bold">Excused</th>
                  <th className="px-5 py-3 font-bold">Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-t border-border" key={`${row.groupId}-${row.studentCode}`}>
                    <td className="px-5 py-3">
                      <strong className="text-foreground">{row.studentName}</strong>
                      <span className="block text-xs text-muted">{row.studentCode}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        className="font-medium text-brand-primary hover:underline"
                        href={`/admin/meeting-evidence?groupId=${row.groupId}`}
                      >
                        {row.groupNo} · {row.groupName}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{row.term}</td>
                    <td className="px-5 py-3">{row.totalMeetings}</td>
                    <td className="px-5 py-3">{row.presentCount}</td>
                    <td className="px-5 py-3">{row.lateCount}</td>
                    <td className={row.absentCount > 0 ? "px-5 py-3 font-semibold text-red-700" : "px-5 py-3"}>
                      {row.absentCount}
                    </td>
                    <td className="px-5 py-3">{row.excusedCount}</td>
                    <td className="px-5 py-3">{row.attendanceRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {result && result.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">
            Page {result.number + 1} of {result.totalPages} · {result.totalElements} rows
          </span>
          <div className="flex gap-2">
            <Button
              disabled={!result.hasPrevious}
              icon={<ChevronLeft size={16} />}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              size="sm"
              variant="secondary"
            >
              Previous
            </Button>
            <Button
              disabled={!result.hasNext}
              icon={<ChevronRight size={16} />}
              onClick={() => setPage((value) => value + 1)}
              size="sm"
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import {
  Activity,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useAdminMentorActivity } from "../hooks";
import type {
  AdminMentorActivityDto,
  AdminMentorMeetingActivityFilter,
  AdminMentorSlotActivityFilter,
} from "../types";

const PAGE_SIZE = 20;
const REPORT_TIME_ZONE = "Asia/Ho_Chi_Minh";

type DateRange = {
  fromDate?: string;
  toDate?: string;
};

function formatDateKeyInReportZone(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getDefaultMentorActivityRange(now = new Date()) {
  const toDate = formatDateKeyInReportZone(now);
  const from = new Date(`${toDate}T00:00:00.000Z`);
  from.setUTCDate(from.getUTCDate() - 29);
  return { fromDate: from.toISOString().slice(0, 10), toDate };
}

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: REPORT_TIME_ZONE,
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load mentor activity. Please try again.";
}

function MentorActivityBadges({
  mentor,
  allTime,
}: {
  mentor: AdminMentorActivityDto;
  allTime: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {mentor.slotCount === 0 && (
        <Badge tone="danger">
          {allTime ? "Never created a slot" : "No slots in range"}
        </Badge>
      )}
      {mentor.meetingCount === 0 && (
        <Badge tone="warning">No meetings in range</Badge>
      )}
      {mentor.slotCount > 0 && mentor.meetingCount > 0 && (
        <Badge tone="success">Activity recorded</Badge>
      )}
      {mentor.assignedGroupCount === 0 && (
        <Badge tone="neutral">No active groups</Badge>
      )}
    </div>
  );
}

function SlotSummary({ mentor }: { mentor: AdminMentorActivityDto }) {
  return (
    <div className="grid gap-1">
      <strong className="text-foreground">{mentor.slotCount} total</strong>
      <span className="text-xs text-muted">
        {mentor.availableSlotCount} available · {mentor.bookedSlotCount} booked ·{" "}
        {mentor.canceledSlotCount} canceled
      </span>
      <span className="text-xs text-muted">
        Latest: {formatDateTime(mentor.latestSlotStartAt)}
      </span>
    </div>
  );
}

function MeetingSummary({ mentor }: { mentor: AdminMentorActivityDto }) {
  return (
    <div className="grid gap-1">
      <strong className="text-foreground">{mentor.meetingCount} not canceled</strong>
      <span className="text-xs text-muted">
        {mentor.scheduledMeetingCount} scheduled · {mentor.completedMeetingCount} completed ·{" "}
        {mentor.canceledMeetingCount} canceled
      </span>
      <span className="text-xs text-muted">
        Latest: {formatDateTime(mentor.latestMeetingStartAt)}
      </span>
    </div>
  );
}

function MentorActivityCard({
  mentor,
  allTime,
}: {
  mentor: AdminMentorActivityDto;
  allTime: boolean;
}) {
  return (
    <article className="grid gap-4 rounded-xl border border-border bg-surface p-4 min-[761px]:hidden">
      <div className="grid min-w-0 gap-1">
        <strong className="break-words text-base text-foreground">
          {mentor.mentorName}
        </strong>
        <span className="text-sm text-muted">{mentor.mentorCode}</span>
        <span className="break-all text-xs text-muted">{mentor.email}</span>
        {mentor.company && (
          <span className="break-words text-xs text-muted">{mentor.company}</span>
        )}
      </div>
      <MentorActivityBadges allTime={allTime} mentor={mentor} />
      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="mb-1 text-xs font-bold tracking-[0.04em] text-muted uppercase">
            Active groups
          </dt>
          <dd className="m-0 text-foreground">{mentor.assignedGroupCount}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-bold tracking-[0.04em] text-muted uppercase">
            Availability slots
          </dt>
          <dd className="m-0"><SlotSummary mentor={mentor} /></dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-bold tracking-[0.04em] text-muted uppercase">
            Meetings
          </dt>
          <dd className="m-0"><MeetingSummary mentor={mentor} /></dd>
        </div>
      </dl>
    </article>
  );
}

export function AdminMentorActivityPage() {
  const initialRange = useMemo(() => getDefaultMentorActivityRange(), []);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateInputs, setDateInputs] = useState<DateRange>(initialRange);
  const [dateRange, setDateRange] = useState<DateRange>(initialRange);
  const [dateError, setDateError] = useState<string | null>(null);
  const [meetingActivity, setMeetingActivity] =
    useState<AdminMentorMeetingActivityFilter>("ALL");
  const [slotActivity, setSlotActivity] =
    useState<AdminMentorSlotActivityFilter>("ALL");
  const [page, setPage] = useState(0);

  const allTime = !dateRange.fromDate && !dateRange.toDate;
  const query = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      search: search || undefined,
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate,
      meetingActivity,
      slotActivity,
    }),
    [dateRange, meetingActivity, page, search, slotActivity],
  );
  const activityQuery = useAdminMentorActivity(query);
  const result = activityQuery.data?.data;
  const mentors = result?.content ?? [];

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasFromDate = Boolean(dateInputs.fromDate);
    const hasToDate = Boolean(dateInputs.toDate);
    if (hasFromDate !== hasToDate) {
      setDateError("Choose both dates, or use the All time preset.");
      return;
    }
    if (
      dateInputs.fromDate &&
      dateInputs.toDate &&
      dateInputs.fromDate > dateInputs.toDate
    ) {
      setDateError("From date must be on or before to date.");
      return;
    }
    setDateError(null);
    setSearch(searchInput.trim());
    setDateRange(dateInputs);
    setPage(0);
  }

  function useLastThirtyDays() {
    const nextRange = getDefaultMentorActivityRange();
    setDateInputs(nextRange);
    setDateRange(nextRange);
    setDateError(null);
    setPage(0);
  }

  function useAllTime() {
    const nextRange = {};
    setDateInputs(nextRange);
    setDateRange(nextRange);
    setDateError(null);
    setPage(0);
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Find active mentors who open availability and hold student meetings. Activity is measured by scheduled start time in Vietnam time."
        eyebrow="Admin"
        title="Mentor activity"
      />

      <Card>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<CalendarRange size={15} />}
              onClick={useLastThirtyDays}
              size="sm"
              variant={!allTime ? "primary" : "secondary"}
            >
              Last 30 days
            </Button>
            <Button
              icon={<Activity size={15} />}
              onClick={useAllTime}
              size="sm"
              variant={allTime ? "primary" : "secondary"}
            >
              All time
            </Button>
          </div>

          <form className="grid gap-3" onSubmit={applyFilters}>
            <div className="grid grid-cols-[minmax(220px,1fr)_minmax(150px,190px)_minmax(150px,190px)] items-end gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]">
              <TextInput
                icon={<Search size={16} />}
                label="Search mentors"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, code, email, or company"
                value={searchInput}
              />
              <TextInput
                error={dateError ?? undefined}
                label="From date"
                onChange={(event) =>
                  setDateInputs((value) => ({ ...value, fromDate: event.target.value || undefined }))
                }
                type="date"
                value={dateInputs.fromDate ?? ""}
              />
              <TextInput
                label="To date"
                onChange={(event) =>
                  setDateInputs((value) => ({ ...value, toDate: event.target.value || undefined }))
                }
                type="date"
                value={dateInputs.toDate ?? ""}
              />
            </div>
            <div className="grid grid-cols-[minmax(180px,240px)_minmax(180px,240px)_auto] items-end gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]">
              <Select
                label="Meeting activity"
                onChange={(event) => {
                  setMeetingActivity(event.target.value as AdminMentorMeetingActivityFilter);
                  setPage(0);
                }}
                value={meetingActivity}
              >
                <option value="ALL">All mentors</option>
                <option value="HAS_MEETINGS">Has meetings</option>
                <option value="NO_MEETINGS">No meetings</option>
              </Select>
              <Select
                label="Slot activity"
                onChange={(event) => {
                  setSlotActivity(event.target.value as AdminMentorSlotActivityFilter);
                  setPage(0);
                }}
                value={slotActivity}
              >
                <option value="ALL">All mentors</option>
                <option value="HAS_SLOTS">Has slots</option>
                <option value="NO_SLOTS">No slots</option>
              </Select>
              <Button icon={<Search size={16} />} type="submit">Apply filters</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {activityQuery.isLoading ? (
        <Card isPadded><LoadingState title="Loading mentor activity" /></Card>
      ) : activityQuery.isError ? (
        <Card isPadded>
          <EmptyState
            actions={(
              <Button onClick={() => void activityQuery.refetch()} variant="secondary">
                Try again
              </Button>
            )}
            description={getErrorMessage(activityQuery.error)}
            title="Unable to load mentor activity"
          />
        </Card>
      ) : mentors.length === 0 ? (
        <Card isPadded>
          <EmptyState
            description="Try changing the search, date range, or activity filters."
            icon={<Users size={22} />}
            title="No mentors found"
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden w-full overflow-x-auto min-[761px]:block">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="bg-background text-xs tracking-[0.04em] text-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Mentor</th>
                  <th className="px-5 py-3 font-bold">Active groups</th>
                  <th className="px-5 py-3 font-bold">Availability slots</th>
                  <th className="px-5 py-3 font-bold">Meetings</th>
                  <th className="px-5 py-3 font-bold">Attention</th>
                </tr>
              </thead>
              <tbody>
                {mentors.map((mentor) => (
                  <tr className="border-t border-border align-top" key={mentor.mentorId}>
                    <td className="px-5 py-4">
                      <div className="grid max-w-64 gap-1">
                        <strong className="break-words text-foreground">{mentor.mentorName}</strong>
                        <span className="text-xs text-muted">{mentor.mentorCode}</span>
                        <span className="break-all text-xs text-muted">{mentor.email}</span>
                        {mentor.company && <span className="break-words text-xs text-muted">{mentor.company}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">{mentor.assignedGroupCount}</td>
                    <td className="px-5 py-4"><SlotSummary mentor={mentor} /></td>
                    <td className="px-5 py-4"><MeetingSummary mentor={mentor} /></td>
                    <td className="px-5 py-4"><MentorActivityBadges allTime={allTime} mentor={mentor} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-4 min-[761px]:hidden">
            {mentors.map((mentor) => (
              <MentorActivityCard allTime={allTime} key={mentor.mentorId} mentor={mentor} />
            ))}
          </div>
        </Card>
      )}

      {result && result.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">
            Page {result.number + 1} of {result.totalPages} · {result.totalElements} mentors
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

      <span aria-live="polite" className="sr-only">
        {activityQuery.isFetching && !activityQuery.isLoading ? "Refreshing mentor activity" : ""}
      </span>
    </div>
  );
}

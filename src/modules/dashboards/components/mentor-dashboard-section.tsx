"use client";

import { useState } from "react";
import { CalendarClock, Users } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  Select,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useMentorDashboardMeetings } from "../hooks";
import type { DashboardMeetingDto } from "../types";
import type { MeetingStatus } from "@/shared/types";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load mentor meetings.";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getMeetingStatusTone(status: MeetingStatus) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELED") return "danger";
  return "warning";
}

function MeetingCard({ meeting }: { meeting: DashboardMeetingDto }) {
  return (
    <article className="grid gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h3 className="m-0 break-words text-sm leading-snug font-bold text-foreground">
            {meeting.groupName}
          </h3>
          <p className="m-0 break-words text-xs text-muted">
            {meeting.groupNo} - {meeting.mentorName}
          </p>
        </div>
        <Badge tone={getMeetingStatusTone(meeting.status)}>
          {meeting.status}
        </Badge>
      </div>
      <span className="break-words text-sm text-muted">
        {formatDateTime(meeting.startAt)} - {formatDateTime(meeting.endAt)}
      </span>
      {meeting.meetLink && (
        <a
          className="inline-flex min-h-11 items-center break-words text-sm font-medium text-brand-primary hover:text-brand-primary-hover"
          href={meeting.meetLink}
          rel="noreferrer"
          target="_blank"
        >
          Open meeting link
        </a>
      )}
    </article>
  );
}

export function MentorUpcomingMeetingsSection() {
  const meetingsQuery = useMentorDashboardMeetings();
  const [meetingStatusFilter, setMeetingStatusFilter] = useState<
    MeetingStatus | "ALL"
  >("SCHEDULED");

  const meetings = meetingsQuery.data?.data ?? [];
  const filteredMeetings =
    meetingStatusFilter === "ALL"
      ? meetings
      : meetings.filter((meeting) => meeting.status === meetingStatusFilter);
  return (
    <Card>
      <CardHeader
        actions={
          <Select
            aria-label="Filter upcoming meetings by status"
            fieldClassName="w-full min-[761px]:w-[190px]"
            id="mentor-meeting-status-filter"
            onChange={(event) =>
              setMeetingStatusFilter(
                event.target.value as MeetingStatus | "ALL",
              )
            }
            value={meetingStatusFilter}
          >
            <option value="ALL">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CANCELED">Canceled</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        }
        description="Scheduled meetings are shown by default. Use the filter to view other statuses."
        title="Upcoming meetings"
      />
      <CardContent>
        {meetingsQuery.isLoading ? (
          <LoadingState className="min-h-40" title="Loading meetings" />
        ) : meetingsQuery.error ? (
          <EmptyState
            className="min-h-40 border-red-200 bg-red-50"
            description={getErrorMessage(meetingsQuery.error)}
            icon={<CalendarClock size={22} />}
            title="Meetings unavailable"
          />
        ) : filteredMeetings.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3">
            {filteredMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="min-h-40"
            icon={<Users size={22} />}
            title={
              meetingStatusFilter === "ALL"
                ? "No upcoming meetings"
                : `No ${meetingStatusFilter.toLowerCase()} meetings`
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

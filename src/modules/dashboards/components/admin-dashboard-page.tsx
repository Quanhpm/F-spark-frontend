"use client";

import {
  CalendarClock,
  CheckCircle2,
  CircleGauge,
  ExternalLink,
  FolderKanban,
  Users,
  UserRoundCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";

import { useAdminDashboard } from "../hooks";
import { AdminOverviewSection } from "./admin-overview-section";
import type {
  AdminDashboardExecutionStatusDto,
  AdminDashboardGroupProgressDto,
  AdminDashboardMeetingDto,
  AdminDashboardMentorDto,
  AdminDashboardProjectDto,
  DashboardRecord,
} from "../types";

type BadgeTone = "neutral" | "brand" | "warning" | "success" | "danger";

type OverviewCardProps = {
  description: string;
  icon: ReactNode;
  label: string;
  tone?: BadgeTone;
  value: ReactNode;
};

const pageClassName = "grid min-w-0 gap-6";
const overviewGridClassName =
  "grid grid-cols-4 gap-4 max-[1280px]:grid-cols-2 max-[720px]:grid-cols-[minmax(0,1fr)]";
const overviewCardClassName =
  "grid min-w-0 gap-4 rounded-xl border border-border bg-surface p-5 shadow-card max-[480px]:p-4";
const overviewIconClassName =
  "grid size-11 place-items-center rounded-xl bg-surface-warm text-brand-primary";
const overviewValueClassName =
  "min-w-0 text-[30px] leading-none font-bold text-foreground";
const overviewDescriptionClassName = "text-[13px] leading-normal text-muted";
const twoColumnClassName =
  "grid grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] gap-6 max-[1180px]:grid-cols-[minmax(0,1fr)]";
const tableWrapClassName = "w-full overflow-x-auto max-[760px]:hidden";
const mobileListClassName = "hidden min-w-0 gap-3 max-[760px]:grid";
const mobileCardClassName =
  "grid min-w-0 gap-3 rounded-xl border border-border bg-background p-4";
const mobileCardHeaderClassName =
  "flex min-w-0 flex-wrap items-start justify-between gap-2";
const mobileCardTitleClassName =
  "min-w-0 flex-1 break-words text-sm font-bold text-foreground";
const mobileMetadataClassName =
  "grid min-w-0 grid-cols-2 gap-3 max-[480px]:grid-cols-1";
const mobileMetadataItemClassName = "grid min-w-0 gap-1";
const mobileMetadataLabelClassName =
  "text-[11px] font-bold tracking-[0.04em] text-muted uppercase";
const mobileMetadataValueClassName =
  "min-w-0 break-words text-sm text-foreground";
const tableClassName =
  "w-full min-w-[760px] border-collapse [&_tbody_tr:last-child_td]:border-b-0";
const compactTableClassName =
  "w-full min-w-[620px] border-collapse [&_tbody_tr:last-child_td]:border-b-0";
const tableHeadCellClassName =
  "border-b border-border px-4 py-3 text-left align-middle text-xs font-bold text-muted uppercase";
const tableCellClassName =
  "border-b border-border px-4 py-3 text-left align-middle text-sm text-foreground";
const mutedCellClassName = cn(tableCellClassName, "text-muted");
const itemTitleClassName =
  "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-bold text-foreground";
const itemMetaClassName =
  "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-muted";
const errorPanelClassName =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-normal text-red-700";
const progressTrackClassName =
  "h-2 w-full min-w-[96px] overflow-hidden rounded-full bg-surface-warm";
const progressFillClassName = "h-full rounded-full bg-brand-primary";
const linkClassName =
  "inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-brand-primary hover:text-brand-primary-hover";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function isRecord(value: unknown): value is DashboardRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRecordValue(record: DashboardRecord, keys: string[]) {
  return keys.map((key) => record[key]).find((value) => value != null);
}

function getString(record: DashboardRecord, keys: string[], fallback = "-") {
  const value = getRecordValue(record, keys);

  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function getNumber(record: DashboardRecord, keys: string[]) {
  const value = getRecordValue(record, keys);

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function sumBy(items: DashboardRecord[], keys: string[]) {
  return items.reduce((total, item) => total + (getNumber(item, keys) ?? 0), 0);
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en").format(value ?? 0);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${Math.round(value)}%`;
}

function clampPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return Math.min(100, Math.max(0, value));
}

function getStatusTone(status: string | null | undefined): BadgeTone {
  const normalized = status?.toUpperCase();

  if (
    normalized === "ACTIVE" ||
    normalized === "COMPLETED" ||
    normalized === "DONE" ||
    normalized === "SCHEDULED" ||
    normalized === "AVAILABLE"
  ) {
    return "success";
  }

  if (
    normalized === "FAILED" ||
    normalized === "CANCELED" ||
    normalized === "REJECTED" ||
    normalized === "LOCKED" ||
    normalized === "OVERDUE"
  ) {
    return "danger";
  }

  if (
    normalized === "PENDING" ||
    normalized === "IN_PROGRESS" ||
    normalized === "BOOKED" ||
    normalized === "REVIEW"
  ) {
    return "warning";
  }

  return "neutral";
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <Badge tone="neutral">Unknown</Badge>;
  return <Badge tone={getStatusTone(status)}>{status}</Badge>;
}

function ProgressValue({ value }: { value: number | null | undefined }) {
  return (
    <div className="grid min-w-0 gap-1.5 min-[761px]:min-w-[132px]">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted">
        <span>Progress</span>
        <span>{formatPercent(value)}</span>
      </div>
      <div className={progressTrackClassName}>
        <div
          className={progressFillClassName}
          style={{ width: `${clampPercent(value)}%` }}
        />
      </div>
    </div>
  );
}

function OverviewCard({
  description,
  icon,
  label,
  tone = "neutral",
  value,
}: OverviewCardProps) {
  return (
    <section className={overviewCardClassName}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className={overviewIconClassName}>{icon}</span>
        <Badge tone={tone}>{label}</Badge>
      </div>
      <div className="grid min-w-0 gap-1.5">
        <span className={overviewValueClassName}>{value}</span>
        <span className={overviewDescriptionClassName}>{description}</span>
      </div>
    </section>
  );
}

function DashboardErrorPanel({
  errors,
}: {
  errors: Array<{ label: string; message: string }>;
}) {
  if (errors.length === 0) return null;

  return (
    <div className={errorPanelClassName}>
      <div className="grid gap-1">
        <span className="font-bold">Some dashboard data could not be loaded.</span>
        {errors.map((error) => (
          <span key={error.label}>
            {error.label}: {error.message}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimelineTable({ items }: { items: AdminDashboardMeetingDto[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        description="No scheduled timeline items were returned by the dashboard API."
        icon={<CalendarClock size={22} />}
        title="No timeline items"
      />
    );
  }

  return (
    <>
      <div className={tableWrapClassName}>
        <table className={tableClassName}>
        <thead>
          <tr>
            <th className={tableHeadCellClassName}>When</th>
            <th className={tableHeadCellClassName}>Group</th>
            <th className={tableHeadCellClassName}>Mentor</th>
            <th className={tableHeadCellClassName}>Status</th>
            <th className={tableHeadCellClassName}>Meeting</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const record = item as DashboardRecord;
            const startAt = getString(record, ["startAt", "startedAt"], "");
            const endAt = getString(record, ["endAt", "finishedAt"], "");
            const meetLink = getString(record, ["meetLink", "meetingLink"], "");
            const status = getString(record, ["status"], "");

            return (
              <tr key={`${item.id ?? item.meetingId ?? item.slotId ?? index}`}>
                <td className={tableCellClassName}>
                  <div className="grid min-w-0 gap-1">
                    <span className={itemTitleClassName}>
                      {formatDateTime(startAt)}
                    </span>
                    <span className={itemMetaClassName}>
                      Ends {formatDateTime(endAt)}
                    </span>
                  </div>
                </td>
                <td className={tableCellClassName}>
                  <div className="grid min-w-0 gap-1">
                    <span className={itemTitleClassName}>
                      {getString(record, ["groupName", "name"], "Unnamed group")}
                    </span>
                    <span className={itemMetaClassName}>
                      {getString(record, ["groupNo", "courseCode"], "-")}
                    </span>
                  </div>
                </td>
                <td className={mutedCellClassName}>
                  {getString(record, ["mentorName", "fullName"], "-")}
                </td>
                <td className={tableCellClassName}>
                  <StatusBadge status={status} />
                </td>
                <td className={tableCellClassName}>
                  {meetLink ? (
                    <a
                      className={linkClassName}
                      href={meetLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      <div className={mobileListClassName}>
        {items.map((item, index) => {
          const record = item as DashboardRecord;
          const startAt = getString(record, ["startAt", "startedAt"], "");
          const endAt = getString(record, ["endAt", "finishedAt"], "");
          const meetLink = getString(record, ["meetLink", "meetingLink"], "");
          const status = getString(record, ["status"], "");

          return (
            <article
              className={mobileCardClassName}
              key={`${item.id ?? item.meetingId ?? item.slotId ?? index}`}
            >
              <div className={mobileCardHeaderClassName}>
                <h3 className={mobileCardTitleClassName}>
                  {getString(record, ["groupName", "name"], "Unnamed group")}
                </h3>
                <StatusBadge status={status} />
              </div>
              <div className={mobileMetadataClassName}>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Starts</span>
                  <span className={mobileMetadataValueClassName}>
                    {formatDateTime(startAt)}
                  </span>
                </div>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Ends</span>
                  <span className={mobileMetadataValueClassName}>
                    {formatDateTime(endAt)}
                  </span>
                </div>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Group</span>
                  <span className={mobileMetadataValueClassName}>
                    {getString(record, ["groupNo", "courseCode"], "-")}
                  </span>
                </div>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Mentor</span>
                  <span className={mobileMetadataValueClassName}>
                    {getString(record, ["mentorName", "fullName"], "-")}
                  </span>
                </div>
              </div>
              {meetLink && (
                <a
                  className={cn(linkClassName, "min-h-11 justify-self-start")}
                  href={meetLink}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open meeting <ExternalLink size={14} />
                </a>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function ProjectsTable({ items }: { items: AdminDashboardProjectDto[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        description="No projects were returned by the dashboard API."
        icon={<FolderKanban size={22} />}
        title="No projects"
      />
    );
  }

  const visibleItems = items.slice(0, 8);

  return (
    <>
      <div className={tableWrapClassName}>
        <table className={compactTableClassName}>
        <thead>
          <tr>
            <th className={tableHeadCellClassName}>Project</th>
            <th className={tableHeadCellClassName}>Group</th>
            <th className={tableHeadCellClassName}>Progress</th>
            <th className={tableHeadCellClassName}>Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleItems.map((item, index) => {
            const record = item as DashboardRecord;
            const progress = getNumber(record, [
              "progressPercent",
              "completionPercent",
              "progress",
            ]);
            const status = getString(record, ["status"], "");

            return (
              <tr key={`${item.id ?? item.projectId ?? index}`}>
                <td className={tableCellClassName}>
                  <div className="grid min-w-0 gap-1">
                    <span className={itemTitleClassName}>
                      {getString(
                        record,
                        ["projectName", "title", "name"],
                        "Untitled project",
                      )}
                    </span>
                    <span className={itemMetaClassName}>
                      {formatNumber(
                        getNumber(record, ["completedTaskCount", "doneTasks"]),
                      )}{" "}
                      /{" "}
                      {formatNumber(
                        getNumber(record, ["totalTaskCount", "totalTasks"]),
                      )}{" "}
                      tasks
                    </span>
                  </div>
                </td>
                <td className={mutedCellClassName}>
                  {getString(record, ["groupName", "groupNo"], "-")}
                </td>
                <td className={tableCellClassName}>
                  <ProgressValue value={progress} />
                </td>
                <td className={tableCellClassName}>
                  <StatusBadge status={status} />
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      <div className={mobileListClassName}>
        {visibleItems.map((item, index) => {
          const record = item as DashboardRecord;
          const progress = getNumber(record, [
            "progressPercent",
            "completionPercent",
            "progress",
          ]);
          const status = getString(record, ["status"], "");

          return (
            <article
              className={mobileCardClassName}
              key={`${item.id ?? item.projectId ?? index}`}
            >
              <div className={mobileCardHeaderClassName}>
                <h3 className={mobileCardTitleClassName}>
                  {getString(
                    record,
                    ["projectName", "title", "name"],
                    "Untitled project",
                  )}
                </h3>
                <StatusBadge status={status} />
              </div>
              <div className={mobileMetadataClassName}>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Group</span>
                  <span className={mobileMetadataValueClassName}>
                    {getString(record, ["groupName", "groupNo"], "-")}
                  </span>
                </div>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Tasks</span>
                  <span className={mobileMetadataValueClassName}>
                    {formatNumber(
                      getNumber(record, ["completedTaskCount", "doneTasks"]),
                    )}{" "}
                    /{" "}
                    {formatNumber(
                      getNumber(record, ["totalTaskCount", "totalTasks"]),
                    )}
                  </span>
                </div>
              </div>
              <ProgressValue value={progress} />
            </article>
          );
        })}
      </div>
    </>
  );
}

function MentorsTable({ items }: { items: AdminDashboardMentorDto[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        description="No mentor records were returned by the dashboard API."
        icon={<UserRoundCheck size={22} />}
        title="No mentors"
      />
    );
  }

  const visibleItems = items.slice(0, 8);

  return (
    <>
      <div className={tableWrapClassName}>
        <table className={compactTableClassName}>
        <thead>
          <tr>
            <th className={tableHeadCellClassName}>Mentor</th>
            <th className={tableHeadCellClassName}>Groups</th>
            <th className={tableHeadCellClassName}>Meetings</th>
            <th className={tableHeadCellClassName}>Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleItems.map((item, index) => {
            const record = item as DashboardRecord;
            const status = getString(record, ["status"], "");

            return (
              <tr key={`${item.id ?? item.mentorId ?? index}`}>
                <td className={tableCellClassName}>
                  <div className="grid min-w-0 gap-1">
                    <span className={itemTitleClassName}>
                      {getString(
                        record,
                        ["mentorName", "fullName", "name"],
                        "Unnamed mentor",
                      )}
                    </span>
                    <span className={itemMetaClassName}>
                      {getString(record, ["mentorCode", "email"], "-")}
                    </span>
                  </div>
                </td>
                <td className={mutedCellClassName}>
                  {formatNumber(
                    getNumber(record, ["assignedGroupCount", "groupCount"]),
                  )}
                </td>
                <td className={mutedCellClassName}>
                  {formatNumber(
                    getNumber(record, ["scheduledMeetingCount", "meetingCount"]),
                  )}
                </td>
                <td className={tableCellClassName}>
                  <StatusBadge status={status} />
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      <div className={mobileListClassName}>
        {visibleItems.map((item, index) => {
          const record = item as DashboardRecord;
          const status = getString(record, ["status"], "");

          return (
            <article
              className={mobileCardClassName}
              key={`${item.id ?? item.mentorId ?? index}`}
            >
              <div className={mobileCardHeaderClassName}>
                <h3 className={mobileCardTitleClassName}>
                  {getString(
                    record,
                    ["mentorName", "fullName", "name"],
                    "Unnamed mentor",
                  )}
                </h3>
                <StatusBadge status={status} />
              </div>
              <p className="m-0 break-all text-[13px] text-muted">
                {getString(record, ["mentorCode", "email"], "-")}
              </p>
              <div className={mobileMetadataClassName}>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Groups</span>
                  <span className={mobileMetadataValueClassName}>
                    {formatNumber(
                      getNumber(record, ["assignedGroupCount", "groupCount"]),
                    )}
                  </span>
                </div>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Meetings</span>
                  <span className={mobileMetadataValueClassName}>
                    {formatNumber(
                      getNumber(record, [
                        "scheduledMeetingCount",
                        "meetingCount",
                      ]),
                    )}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function GroupsTable({ items }: { items: AdminDashboardGroupProgressDto[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        description="No groups were returned by the dashboard API."
        icon={<Users size={22} />}
        title="No groups"
      />
    );
  }

  const visibleItems = items.slice(0, 8);

  return (
    <>
      <div className={tableWrapClassName}>
        <table className={compactTableClassName}>
        <thead>
          <tr>
            <th className={tableHeadCellClassName}>Group</th>
            <th className={tableHeadCellClassName}>Mentor</th>
            <th className={tableHeadCellClassName}>Progress</th>
            <th className={tableHeadCellClassName}>Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleItems.map((item, index) => {
            const record = item as DashboardRecord;
            const progress = getNumber(record, [
              "progressPercent",
              "completionPercent",
              "progress",
            ]);
            const status = getString(record, ["status"], "");

            return (
              <tr key={`${item.id ?? item.groupId ?? index}`}>
                <td className={tableCellClassName}>
                  <div className="grid min-w-0 gap-1">
                    <span className={itemTitleClassName}>
                      {getString(
                        record,
                        ["groupName", "name", "groupNo"],
                        "Unnamed group",
                      )}
                    </span>
                    <span className={itemMetaClassName}>
                      {getString(record, ["projectName", "courseCode", "term"], "-")}
                    </span>
                  </div>
                </td>
                <td className={mutedCellClassName}>
                  {getString(record, ["mentorName"], "-")}
                </td>
                <td className={tableCellClassName}>
                  <ProgressValue value={progress} />
                </td>
                <td className={tableCellClassName}>
                  <StatusBadge status={status} />
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      <div className={mobileListClassName}>
        {visibleItems.map((item, index) => {
          const record = item as DashboardRecord;
          const progress = getNumber(record, [
            "progressPercent",
            "completionPercent",
            "progress",
          ]);
          const status = getString(record, ["status"], "");

          return (
            <article
              className={mobileCardClassName}
              key={`${item.id ?? item.groupId ?? index}`}
            >
              <div className={mobileCardHeaderClassName}>
                <h3 className={mobileCardTitleClassName}>
                  {getString(
                    record,
                    ["groupName", "name", "groupNo"],
                    "Unnamed group",
                  )}
                </h3>
                <StatusBadge status={status} />
              </div>
              <div className={mobileMetadataClassName}>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Project</span>
                  <span className={mobileMetadataValueClassName}>
                    {getString(
                      record,
                      ["projectName", "courseCode", "term"],
                      "-",
                    )}
                  </span>
                </div>
                <div className={mobileMetadataItemClassName}>
                  <span className={mobileMetadataLabelClassName}>Mentor</span>
                  <span className={mobileMetadataValueClassName}>
                    {getString(record, ["mentorName"], "-")}
                  </span>
                </div>
              </div>
              <ProgressValue value={progress} />
            </article>
          );
        })}
      </div>
    </>
  );
}

function DataCard({
  children,
  description,
  error,
  isLoading,
  title,
}: {
  children: ReactNode;
  description: string;
  error: unknown;
  isLoading: boolean;
  title: string;
}) {
  return (
    <Card>
      <CardHeader description={description} title={title} />
      <CardContent>
        {isLoading ? (
          <LoadingState className="min-h-56" title={`Loading ${title}`} />
        ) : error ? (
          <div className={errorPanelClassName}>{getErrorMessage(error)}</div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  const {
    executionStatusQuery,
    groupsQuery,
    mentorsQuery,
    projectsQuery,
    timelineQuery,
  } = useAdminDashboard();

  const projects = getArray(projectsQuery.data?.data);
  const mentors = getArray(mentorsQuery.data?.data);
  const groups = getArray(groupsQuery.data?.data);
  const timeline = getArray(timelineQuery.data?.data);
  const executionStatus = isRecord(executionStatusQuery.data?.data)
    ? (executionStatusQuery.data.data as AdminDashboardExecutionStatusDto)
    : null;
  const isInitialLoading = [
    executionStatusQuery,
    groupsQuery,
    mentorsQuery,
    projectsQuery,
    timelineQuery,
  ].every((query) => query.isLoading);
  const errors = [
    { label: "Execution status", query: executionStatusQuery },
    { label: "Projects", query: projectsQuery },
    { label: "Mentors", query: mentorsQuery },
    { label: "Groups", query: groupsQuery },
    { label: "Timeline", query: timelineQuery },
  ]
    .filter(({ query }) => query.isError)
    .map(({ label, query }) => ({
      label,
      message: getErrorMessage(query.error),
    }));
  const executionRecord: DashboardRecord = executionStatus ?? {};
  const totalProjects =
    getNumber(executionRecord, ["totalProjects", "projectCount"]) ??
    projects.length;
  const totalMentors =
    getNumber(executionRecord, ["totalMentors", "mentorCount"]) ??
    mentors.length;
  const totalGroups =
    getNumber(executionRecord, ["totalGroups", "groupCount"]) ?? groups.length;
  const progress =
    getNumber(executionRecord, [
      "completionPercent",
      "progressPercent",
      "executionPercent",
    ]) ??
    (projects.length > 0
      ? Math.round(
          sumBy(projects as DashboardRecord[], [
            "progressPercent",
            "completionPercent",
            "progress",
          ]) / projects.length,
        )
      : null);
  const activeProjects = getNumber(executionRecord, [
    "activeProjects",
    "activeProjectCount",
  ]);
  const activeGroups = getNumber(executionRecord, [
    "activeGroups",
    "activeGroupCount",
  ]);
  const scheduledMeetings =
    getNumber(executionRecord, ["scheduledMeetings", "meetingCount"]) ??
    timeline.length;

  return (
    <div className={pageClassName}>
      <PageHeader
        description="Monitor project execution, mentor coverage, group progress, and upcoming meeting timeline."
        eyebrow="Admin"
        title="Dashboard"
      />

      <AdminOverviewSection />

      {isInitialLoading ? (
        <LoadingState
          description="Loading projects, mentors, groups, execution status, and timeline data."
          title="Loading admin dashboard"
        />
      ) : (
        <>
          <DashboardErrorPanel errors={errors} />

          <div className={overviewGridClassName}>
            <OverviewCard
              description={
                activeProjects === null
                  ? "Projects returned by the dashboard API."
                  : `${formatNumber(activeProjects)} active projects`
              }
              icon={<FolderKanban size={21} />}
              label="Projects"
              tone="brand"
              value={formatNumber(totalProjects)}
            />
            <OverviewCard
              description="Mentors currently visible in admin monitoring."
              icon={<UserRoundCheck size={21} />}
              label="Mentors"
              tone="warning"
              value={formatNumber(totalMentors)}
            />
            <OverviewCard
              description={
                activeGroups === null
                  ? "Groups returned by the dashboard API."
                  : `${formatNumber(activeGroups)} active groups`
              }
              icon={<Users size={21} />}
              label="Groups"
              value={formatNumber(totalGroups)}
            />
            <OverviewCard
              description={`${formatNumber(scheduledMeetings)} timeline items loaded`}
              icon={
                progress === null ? (
                  <CircleGauge size={21} />
                ) : (
                  <CheckCircle2 size={21} />
                )
              }
              label="Execution"
              tone={progress === null ? "neutral" : "success"}
              value={progress === null ? "Ready" : formatPercent(progress)}
            />
          </div>

          <div className={twoColumnClassName}>
            <DataCard
              description="Upcoming and recent admin-visible meetings."
              error={timelineQuery.error}
              isLoading={timelineQuery.isLoading}
              title="Timeline"
            >
              <TimelineTable items={timeline} />
            </DataCard>

            <DataCard
              description="Execution status snapshot from the backend."
              error={executionStatusQuery.error}
              isLoading={executionStatusQuery.isLoading}
              title="Execution status"
            >
              <div className="grid gap-4">
                <ProgressValue value={progress} />
                <div className="grid grid-cols-2 gap-3 max-[620px]:grid-cols-[minmax(0,1fr)]">
                  {[
                    ["Completed projects", "completedProjects"],
                    ["Overdue tasks", "overdueTaskCount"],
                    ["Canceled meetings", "canceledMeetings"],
                    ["Status", "status"],
                  ].map(([label, key]) => {
                    const value = executionRecord[key];

                    return (
                      <div
                        className="grid gap-1 rounded-xl border border-border bg-background p-3"
                        key={key}
                      >
                        <span className="text-xs font-bold text-muted uppercase">
                          {label}
                        </span>
                        <span className="min-w-0 break-words text-sm font-bold text-foreground">
                          {typeof value === "number"
                            ? formatNumber(value)
                            : typeof value === "string" && value.trim()
                              ? value
                              : "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DataCard>
          </div>

          <div className="grid min-w-0 gap-6">
            <DataCard
              description="Project progress overview. Shows the first records returned by the API."
              error={projectsQuery.error}
              isLoading={projectsQuery.isLoading}
              title="Projects"
            >
              <ProjectsTable items={projects} />
            </DataCard>

            <div className={twoColumnClassName}>
              <DataCard
                description="Mentor workload and meeting coverage."
                error={mentorsQuery.error}
                isLoading={mentorsQuery.isLoading}
                title="Mentors"
              >
                <MentorsTable items={mentors} />
              </DataCard>

              <DataCard
                description="Group progress and mentor assignment."
                error={groupsQuery.error}
                isLoading={groupsQuery.isLoading}
                title="Groups"
              >
                <GroupsTable items={groups} />
              </DataCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

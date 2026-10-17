"use client";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileImage,
  History,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import type { MeetingStatus } from "@/shared/types";

import { useAdminMeetings } from "../hooks";
import type {
  AdminMeetingEvidenceFilter,
  MentorMeetingDto,
} from "../types";
import { MeetingReopenHistoryDialog } from "./meeting-reopen-history-dialog";
import { ReopenMeetingDialog } from "./reopen-meeting-dialog";
import { getMeetingDisplayStatus } from "./availability-calendar.utils";
import { MeetingConfirmationStatus } from "./meeting-confirmation-status";

const PAGE_SIZE = 20;

function parseGroupId(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const groupId = Number(value);
  return Number.isSafeInteger(groupId) && groupId > 0 ? groupId : undefined;
}

export function isSafeEvidenceUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function getStatusTone(status: MeetingStatus) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "CANCELED") return "danger" as const;
  return "warning" as const;
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load meeting evidence. Please try again.";
}

function EvidenceDetails({ meeting }: { meeting: MentorMeetingDto }) {
  const hasEvidenceValue = Boolean(meeting.evidenceImageUrl?.trim());
  const canOpenEvidence = isSafeEvidenceUrl(meeting.evidenceImageUrl);

  if (!hasEvidenceValue) {
    return <span className="text-sm text-muted">No evidence submitted</span>;
  }

  return (
    <div className="grid min-w-0 gap-1.5">
      <span className="text-sm font-medium text-foreground">
        {meeting.evidenceSubmittedByStudentName ?? "Unknown student"}
      </span>
      <span className="text-xs text-muted">
        Submitted {formatDateTime(meeting.evidenceSubmittedAt)}
      </span>
      {canOpenEvidence ? (
        <a
          className="inline-flex min-h-11 w-fit max-w-full items-center gap-1.5 break-all text-sm font-semibold text-brand-primary hover:underline min-[761px]:min-h-0"
          href={meeting.evidenceImageUrl ?? undefined}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink size={14} /> View evidence
        </a>
      ) : (
        <span className="text-xs font-medium text-red-700">
          Evidence URL cannot be opened safely
        </span>
      )}
    </div>
  );
}

function MeetingCard({
  meeting,
  onHistory,
  onReopen,
}: {
  meeting: MentorMeetingDto;
  onHistory: () => void;
  onReopen: () => void;
}) {
  return (
    <article className="grid gap-4 rounded-xl border border-border bg-surface p-4 min-[761px]:hidden">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <strong className="break-words text-base text-foreground">
            {meeting.groupName}
          </strong>
          <span className="text-xs text-muted">Group {meeting.groupNo}</span>
        </div>
        <Badge tone={getStatusTone(meeting.status)}>{getMeetingDisplayStatus(meeting)}</Badge>
      </div>
      <dl className="grid gap-3 text-sm">
        <div className="grid gap-0.5">
          <dt className="text-xs font-bold tracking-[0.04em] text-muted uppercase">Mentor</dt>
          <dd className="m-0 text-foreground">{meeting.mentorName} · {meeting.mentorCode}</dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-xs font-bold tracking-[0.04em] text-muted uppercase">Schedule</dt>
          <dd className="m-0 text-foreground">{formatDateTime(meeting.startAt)} – {formatDateTime(meeting.endAt)}</dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-xs font-bold tracking-[0.04em] text-muted uppercase">Booked by</dt>
          <dd className="m-0 text-foreground">
            {meeting.bookedByStudentName ?? "Recorded externally by mentor"}
          </dd>
        </div>
      </dl>
      <MeetingConfirmationStatus meeting={meeting} />
      <div className="border-t border-border pt-3">
        <EvidenceDetails meeting={meeting} />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {meeting.status === "COMPLETED" && (
          <Button icon={<RotateCcw size={14} />} onClick={onReopen} size="sm" variant="secondary">
            Reopen
          </Button>
        )}
        <Button icon={<History size={14} />} onClick={onHistory} size="sm" variant="ghost">
          Reopen history
        </Button>
      </div>
    </article>
  );
}

export function AdminMeetingEvidencePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groupId = parseGroupId(searchParams.get("groupId"));
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MeetingStatus | "ALL">("ALL");
  const [evidence, setEvidence] = useState<AdminMeetingEvidenceFilter>("ALL");
  const [page, setPage] = useState(0);
  const [reopening, setReopening] = useState<MentorMeetingDto | null>(null);
  const [historyMeeting, setHistoryMeeting] = useState<MentorMeetingDto | null>(null);

  const query = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      search: search || undefined,
      status,
      evidence,
      groupId,
    }),
    [evidence, groupId, page, search, status],
  );
  const meetingsQuery = useAdminMeetings(query);
  const result = meetingsQuery.data?.data;
  const meetings = result?.content ?? [];

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  }

  function clearGroupFilter() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("groupId");
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    setPage(0);
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Review mentor meetings and the evidence submitted by student groups."
        eyebrow="Admin"
        title="Meeting evidence"
      />

      <Card>
        <CardContent className="grid gap-4">
          <form
            className="grid grid-cols-[minmax(220px,1fr)_minmax(160px,220px)_minmax(160px,220px)_auto] items-end gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]"
            onSubmit={applySearch}
          >
            <TextInput
              icon={<Search size={16} />}
              label="Search meetings"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Group, term, course, mentor, or student"
              value={searchInput}
            />
            <Select
              label="Meeting status"
              onChange={(event) => {
                setStatus(event.target.value as MeetingStatus | "ALL");
                setPage(0);
              }}
              value={status}
            >
              <option value="ALL">All statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
            </Select>
            <Select
              label="Evidence status"
              onChange={(event) => {
                setEvidence(event.target.value as AdminMeetingEvidenceFilter);
                setPage(0);
              }}
              value={evidence}
            >
              <option value="ALL">All evidence states</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="MISSING">Missing</option>
            </Select>
            <Button icon={<Search size={16} />} type="submit">Search</Button>
          </form>

          {groupId !== undefined && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge icon={<FileImage size={13} />} tone="brand">
                Filtered to group #{groupId}
              </Badge>
              <Button
                icon={<X size={14} />}
                onClick={clearGroupFilter}
                size="sm"
                variant="ghost"
              >
                Clear group filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {meetingsQuery.isLoading ? (
        <Card isPadded><LoadingState title="Loading meeting evidence" /></Card>
      ) : meetingsQuery.isError ? (
        <Card isPadded>
          <EmptyState
            actions={(
              <Button
                onClick={() => void meetingsQuery.refetch()}
                variant="secondary"
              >
                Try again
              </Button>
            )}
            description={getErrorMessage(meetingsQuery.error)}
            title="Unable to load meeting evidence"
          />
        </Card>
      ) : meetings.length === 0 ? (
        <Card isPadded>
          <EmptyState
            description="Try changing the search or filters."
            icon={<FileImage size={22} />}
            title="No meetings found"
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden w-full overflow-x-auto min-[761px]:block">
            <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
              <thead className="bg-background text-xs tracking-[0.04em] text-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Group</th>
                  <th className="px-5 py-3 font-bold">Mentor</th>
                  <th className="px-5 py-3 font-bold">Schedule</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Confirmations</th>
                  <th className="px-5 py-3 font-bold">Booked by</th>
                  <th className="px-5 py-3 font-bold">Evidence</th>
                  <th className="px-5 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => (
                  <tr className="border-t border-border align-top" key={meeting.id}>
                    <td className="px-5 py-4">
                      <div className="grid gap-1">
                        <strong className="max-w-52 break-words text-foreground">{meeting.groupName}</strong>
                        <span className="text-xs text-muted">Group {meeting.groupNo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="grid gap-1">
                        <span className="font-medium text-foreground">{meeting.mentorName}</span>
                        <span className="text-xs text-muted">{meeting.mentorCode}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="grid gap-1">
                        <span className="text-foreground">{formatDateTime(meeting.startAt)}</span>
                        <span className="text-xs text-muted">Ends {formatDateTime(meeting.endAt)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><Badge tone={getStatusTone(meeting.status)}>{getMeetingDisplayStatus(meeting)}</Badge></td>
                    <td className="px-5 py-4"><MeetingConfirmationStatus compact meeting={meeting} /></td>
                    <td className="px-5 py-4 text-foreground">
                      {meeting.bookedByStudentName ?? "Recorded externally by mentor"}
                    </td>
                    <td className="px-5 py-4"><EvidenceDetails meeting={meeting} /></td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-40 flex-col items-start gap-2">
                        {meeting.status === "COMPLETED" && (
                          <Button icon={<RotateCcw size={14} />} onClick={() => setReopening(meeting)} size="sm" variant="secondary">
                            Reopen
                          </Button>
                        )}
                        <Button icon={<History size={14} />} onClick={() => setHistoryMeeting(meeting)} size="sm" variant="ghost">
                          Reopen history
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-4 min-[761px]:hidden">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onHistory={() => setHistoryMeeting(meeting)}
                onReopen={() => setReopening(meeting)}
              />
            ))}
          </div>
        </Card>
      )}

      {result && result.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">
            Page {result.number + 1} of {result.totalPages} · {result.totalElements} meetings
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

      <span className="sr-only" aria-live="polite">
        {meetingsQuery.isFetching && !meetingsQuery.isLoading ? "Refreshing meetings" : ""}
      </span>
      {reopening && <ReopenMeetingDialog meeting={reopening} onClose={() => setReopening(null)} />}
      {historyMeeting && (
        <MeetingReopenHistoryDialog meeting={historyMeeting} onClose={() => setHistoryMeeting(null)} />
      )}
    </div>
  );
}

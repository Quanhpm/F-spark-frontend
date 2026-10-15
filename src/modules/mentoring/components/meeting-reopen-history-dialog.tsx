"use client";

import { ExternalLink, History } from "lucide-react";

import { Button, EmptyState, LoadingState, ResponsiveDialog } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useMeetingReopenHistory } from "../hooks";
import type { MentorMeetingDto } from "../types";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function isSafeUrl(value: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function MeetingReopenHistoryDialog({
  meeting,
  onClose,
}: {
  meeting: MentorMeetingDto;
  onClose: () => void;
}) {
  const historyQuery = useMeetingReopenHistory(meeting.id);
  const events = historyQuery.data?.data ?? [];

  return (
    <ResponsiveDialog
      description={`Group ${meeting.groupNo} · ${meeting.groupName}`}
      footer={<Button onClick={onClose} variant="secondary">Close</Button>}
      onClose={onClose}
      title="Reopen history"
    >
      {historyQuery.isLoading ? (
        <LoadingState title="Loading reopen history" />
      ) : historyQuery.isError ? (
        <EmptyState
          actions={<Button onClick={() => void historyQuery.refetch()} variant="secondary">Try again</Button>}
          description={historyQuery.error instanceof ApiError
            ? historyQuery.error.message
            : "Unable to load reopen history."}
          title="Unable to load history"
        />
      ) : events.length === 0 ? (
        <EmptyState
          description="This meeting has never been reopened."
          icon={<History size={22} />}
          title="No reopen history"
        />
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <article className="grid gap-3 rounded-xl border border-border bg-background p-4" key={event.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="grid gap-0.5">
                  <strong className="text-sm text-foreground">{event.reopenedByEmail}</strong>
                  <span className="text-xs text-muted">{event.reopenedByRole}</span>
                </div>
                <time className="text-xs text-muted">{formatDateTime(event.reopenedAt)}</time>
              </div>

              <div className="grid gap-1">
                <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">Reason</span>
                <p className="m-0 whitespace-pre-wrap break-words text-sm text-foreground">{event.reason}</p>
              </div>

              <div className="grid gap-1 text-sm">
                <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">Previous evidence</span>
                <span className="text-foreground">
                  {event.previousEvidenceSubmittedByStudentName ?? "Unknown student"}
                  {event.previousEvidenceSubmittedByStudentCode
                    ? ` · ${event.previousEvidenceSubmittedByStudentCode}`
                    : ""}
                </span>
                <span className="text-xs text-muted">
                  Submitted {formatDateTime(event.previousEvidenceSubmittedAt)} · Completed {formatDateTime(event.previousCompletedAt)}
                </span>
                {isSafeUrl(event.previousEvidenceImageUrl) ? (
                  <a
                    className="inline-flex min-h-11 w-fit items-center gap-1.5 break-all text-sm font-semibold text-brand-primary hover:underline min-[761px]:min-h-0"
                    href={event.previousEvidenceImageUrl ?? undefined}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink size={14} /> View archived evidence
                  </a>
                ) : event.previousEvidenceImageUrl ? (
                  <span className="text-xs font-medium text-red-700">Archived evidence URL cannot be opened safely</span>
                ) : (
                  <span className="text-xs text-muted">No evidence URL was stored</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </ResponsiveDialog>
  );
}

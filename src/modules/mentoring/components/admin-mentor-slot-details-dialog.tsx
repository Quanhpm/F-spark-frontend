"use client";

import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
  ResponsiveDialog,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { MeetingStatus, SlotStatus } from "@/shared/types";

import { useAdminMentorSlots } from "../hooks";
import type { AdminMentorActivityDto, AdminMentorSlotDetailDto } from "../types";

const PAGE_SIZE = 10;
const REPORT_TIME_ZONE = "Asia/Ho_Chi_Minh";

type AdminMentorSlotDetailsDialogProps = {
  fromDate?: string;
  mentor: AdminMentorActivityDto;
  onClose: () => void;
  toDate?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: REPORT_TIME_ZONE,
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: REPORT_TIME_ZONE,
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: REPORT_TIME_ZONE,
  }).format(new Date(value));
}

function formatDateRange(fromDate?: string, toDate?: string) {
  if (!fromDate || !toDate) return "All time";
  return `${formatDate(`${fromDate}T00:00:00+07:00`)} – ${formatDate(`${toDate}T00:00:00+07:00`)}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load mentor slots. Please try again.";
}

function slotTone(status: SlotStatus) {
  if (status === "AVAILABLE") return "success" as const;
  if (status === "BOOKED") return "brand" as const;
  return "danger" as const;
}

function meetingTone(status: MeetingStatus) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "CANCELED") return "danger" as const;
  return "warning" as const;
}

function SlotDetailCard({ slot }: { slot: AdminMentorSlotDetailDto }) {
  const groupLabel = [slot.groupName, slot.groupNo].filter(Boolean).join(" · ");
  const studentLabel = [slot.bookedByStudentName, slot.bookedByStudentCode]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="grid min-w-0 gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <strong className="text-base text-foreground">
            {formatDate(slot.startAt)}
          </strong>
          <span className="text-sm text-muted">
            {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
          </span>
        </div>
        <Badge tone={slotTone(slot.status)}>{slot.status}</Badge>
      </div>

      <dl className="grid min-w-0 gap-3 text-sm">
        <div className="grid gap-1">
          <dt className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
            Created
          </dt>
          <dd className="m-0 text-foreground">{formatDateTime(slot.createdAt)}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
            Note
          </dt>
          <dd className="m-0 break-words text-foreground">
            {slot.note || "No note"}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
            Meeting link
          </dt>
          <dd className="m-0 min-w-0">
            <a
              className="inline-flex min-h-11 max-w-full items-center gap-1.5 break-all text-brand-primary underline-offset-4 hover:underline"
              href={slot.meetLink}
              rel="noreferrer"
              target="_blank"
            >
              <span className="min-w-0 break-all">{slot.meetLink}</span>
              <ExternalLink aria-hidden="true" className="shrink-0" size={14} />
            </a>
          </dd>
        </div>
      </dl>

      {slot.meetingId && slot.meetingStatus ? (
        <div className="grid gap-2 rounded-xl border border-border-warm bg-surface-warm p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm text-foreground">Booking details</strong>
            <Badge size="sm" tone={meetingTone(slot.meetingStatus)}>
              {slot.meetingStatus}
            </Badge>
          </div>
          <div className="grid gap-1 text-sm">
            <span className="break-words text-foreground">
              Group: {groupLabel || "Unknown group"}
            </span>
            <span className="break-words text-muted">
              Booked by: {studentLabel || "Unknown student"}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-muted">
          This slot has no linked booking.
        </div>
      )}
    </article>
  );
}

export function AdminMentorSlotDetailsDialog({
  fromDate,
  mentor,
  onClose,
  toDate,
}: AdminMentorSlotDetailsDialogProps) {
  const [page, setPage] = useState(0);
  const slotQuery = useAdminMentorSlots(mentor.mentorId, {
    page,
    size: PAGE_SIZE,
    fromDate,
    toDate,
  });
  const result = slotQuery.data?.data;
  const slots = result?.content ?? [];

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[680px]"
      description={(
        <>
          {mentor.mentorCode} · {formatDateRange(fromDate, toDate)}
        </>
      )}
      desktopMode="drawer"
      footer={(
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      )}
      mobileMode="fullscreen"
      onClose={onClose}
      title={`Availability slots — ${mentor.mentorName}`}
    >
      <div className="grid min-w-0 gap-4">
        {slotQuery.isLoading ? (
          <LoadingState title="Loading mentor slots" />
        ) : slotQuery.isError ? (
          <EmptyState
            actions={(
              <Button onClick={() => void slotQuery.refetch()} variant="secondary">
                Try again
              </Button>
            )}
            description={getErrorMessage(slotQuery.error)}
            title="Unable to load mentor slots"
          />
        ) : slots.length === 0 ? (
          <EmptyState
            description="This mentor has no slots in the selected date range."
            icon={<CalendarClock size={22} />}
            title="No slots found"
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
              <span>{result?.totalElements ?? mentor.slotCount} slots</span>
              <span>Newest slot first</span>
            </div>
            <div className="grid gap-3">
              {slots.map((slot) => (
                <SlotDetailCard key={slot.id} slot={slot} />
              ))}
            </div>
          </>
        )}

        {result && result.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-sm text-muted">
              Page {result.number + 1} of {result.totalPages}
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
    </ResponsiveDialog>
  );
}

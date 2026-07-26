"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, LinkIcon, XCircle } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import {
  useBookMeeting,
  useConfirmMeeting,
  useCancelMeeting,
  useGroupMeetings,
  useMentorAvailabilityForGroup,
} from "@/modules/mentoring";
import type {
  MentorAvailabilitySlotDto,
  MentorMeetingDto,
} from "@/modules/mentoring";

import type { GroupDetailDto } from "../../types";
import { ConfirmDialog } from "./confirm-dialog";

type MeetingBookingSectionProps = {
  canBook: boolean;
  group: GroupDetailDto;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function groupSlotsByDate(slots: MentorAvailabilitySlotDto[]) {
  return slots.reduce<Record<string, MentorAvailabilitySlotDto[]>>(
    (groups, slot) => {
      const key = formatDate(slot.startAt);
      return {
        ...groups,
        [key]: [...(groups[key] ?? []), slot],
      };
    },
    {},
  );
}

function getMeetingStatusTone(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "SCHEDULED") return "warning";
  return "danger";
}

function MeetingCard({
  canCancel,
  isCanceling,
  meeting,
  onCancel,
  groupId,
  isLeader,
}: {
  canCancel: boolean;
  isCanceling: boolean;
  meeting: MentorMeetingDto;
  onCancel: (meeting: MentorMeetingDto) => void;
  groupId: number;
  isLeader: boolean;
}) {
  const confirmMeetingMutation = useConfirmMeeting();
  const leaderConfirmed = meeting.leaderConfirmedAt !== null;
  const mentorConfirmed = meeting.mentorConfirmedAt !== null;
  const canConfirm =
    meeting.status === "SCHEDULED" && !leaderConfirmed && isLeader;

  return (
    <article className="grid gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <strong className="break-words text-sm text-foreground">
            {formatDateTime(meeting.startAt)}
          </strong>
          <span className="break-words text-xs text-muted">
            {formatTime(meeting.startAt)} - {formatTime(meeting.endAt)}
          </span>
        </div>
        <Badge tone={getMeetingStatusTone(meeting.status)}>
          {meeting.status}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 max-[480px]:grid">
        {meeting.meetLink && (
          <a
            className="inline-flex min-h-11 min-w-0 items-center gap-1 break-all text-sm font-medium text-brand-primary hover:text-brand-primary-hover"
            href={meeting.meetLink}
            rel="noreferrer"
            target="_blank"
          >
            <LinkIcon size={14} />
            Meeting link
          </a>
        )}
        {canCancel && meeting.status === "SCHEDULED" && (
          <Button
            className="max-[480px]:w-full"
            disabled={isCanceling}
            icon={<XCircle size={15} />}
            onClick={() => onCancel(meeting)}
            size="sm"
            variant="danger"
          >
            Cancel meeting
          </Button>
        )}
      </div>

      {/* Confirmation Status */}
      <div className="mt-2 grid gap-1 border-t border-border/60 pt-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted">Leader confirm:</span>
          <span
            className={
              leaderConfirmed ? "font-bold text-green-700" : "text-muted-foreground"
            }
          >
            {leaderConfirmed ? "✅ Confirmed" : "⏳ Pending"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Mentor confirm:</span>
          <span
            className={
              mentorConfirmed ? "font-bold text-green-700" : "text-muted-foreground"
            }
          >
            {mentorConfirmed ? "✅ Confirmed" : "⏳ Pending"}
          </span>
        </div>
      </div>

      {canConfirm && (
        <Button
          onClick={() =>
            confirmMeetingMutation.mutate({
              groupId,
              meetingId: meeting.id,
            })
          }
          disabled={confirmMeetingMutation.isPending}
          size="sm"
          className="mt-2 w-full"
        >
          {confirmMeetingMutation.isPending ? "Confirming..." : "Confirm Meeting"}
        </Button>
      )}
    </article>
  );
}

export function MeetingBookingSection({
  canBook,
  group,
}: MeetingBookingSectionProps) {
  const availabilityQuery = useMentorAvailabilityForGroup(
    group.mentor ? group.id : null,
  );
  const meetingsQuery = useGroupMeetings(group.id);
  const bookMeetingMutation = useBookMeeting();
  const cancelMeetingMutation = useCancelMeeting();
  const [slotToBook, setSlotToBook] =
    useState<MentorAvailabilitySlotDto | null>(null);
  const [meetingToCancel, setMeetingToCancel] =
    useState<MentorMeetingDto | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const slots = useMemo(
    () => availabilityQuery.data?.data ?? [],
    [availabilityQuery.data?.data],
  );
  const meetings = useMemo(
    () => meetingsQuery.data?.data ?? [],
    [meetingsQuery.data?.data],
  );
  const groupedSlots = useMemo(() => groupSlotsByDate(slots), [slots]);
  const hasData = slots.length > 0 || meetings.length > 0;

  return (
    <Card>
      <CardHeader
        description={
          group.mentor
            ? `Assigned mentor: ${group.mentor.fullName}`
            : "Assign a mentor before booking meetings."
        }
        title="Mentor meetings"
      />
      <CardContent>
        {successMessage && (
          <p className="m-0 mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
            {successMessage}
          </p>
        )}
        {!group.mentor ? (
          <EmptyState
            className="min-h-44"
            icon={<CalendarClock size={22} />}
            title="No mentor assigned"
          />
        ) : availabilityQuery.isLoading || meetingsQuery.isLoading ? (
          <LoadingState className="min-h-44" title="Loading meetings" />
        ) : availabilityQuery.isError || meetingsQuery.isError ? (
          <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(availabilityQuery.error ?? meetingsQuery.error)}
          </p>
        ) : !hasData ? (
          <EmptyState
            className="min-h-44"
            description="Available slots and booked meetings will appear here."
            icon={<CalendarClock size={22} />}
            title="No meeting slots"
          />
        ) : (
          <div className="grid gap-6">
            <section className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CheckCircle2 size={17} />
                Booked meetings
              </div>
              {meetings.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3">
                  {meetings.map((meeting) => (
                    <MeetingCard
                      canCancel={canBook}
                      isCanceling={cancelMeetingMutation.isPending}
                      key={meeting.id}
                      meeting={meeting}
                      onCancel={(selectedMeeting) => {
                        setSuccessMessage("");
                        setMeetingToCancel(selectedMeeting);
                      }}
                      groupId={group.id}
                      isLeader={canBook}
                    />
                  ))}
                </div>
              ) : (
                <p className="m-0 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                  No meetings booked yet.
                </p>
              )}
            </section>

            <section className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CalendarClock size={17} />
                Available slots
              </div>
              {Object.entries(groupedSlots).length > 0 ? (
                <div className="grid gap-4">
                  {Object.entries(groupedSlots).map(([date, daySlots]) => (
                    <div
                      className="grid gap-3 rounded-xl border border-border bg-background p-4"
                      key={date}
                    >
                      <h3 className="m-0 text-sm font-bold text-foreground">
                        {date}
                      </h3>
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(210px,100%),1fr))] gap-3">
                        {daySlots.map((slot) => (
                          <article
                            className="grid gap-2 rounded-xl border border-border bg-surface p-4"
                            key={slot.id}
                          >
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <div className="grid min-w-0 gap-1">
                                <strong className="break-words text-sm text-foreground">
                                  {formatTime(slot.startAt)} -{" "}
                                  {formatTime(slot.endAt)}
                                </strong>
                                <span className="break-words text-xs text-muted">
                                  {slot.note ?? "No note"}
                                </span>
                              </div>
                              <Badge tone="success">{slot.status}</Badge>
                            </div>
                            {canBook && slot.status === "AVAILABLE" && (
                              <Button
                                className="max-[480px]:min-h-11 max-[480px]:w-full"
                                onClick={() => setSlotToBook(slot)}
                                size="sm"
                              >
                                Book slot
                              </Button>
                            )}
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="m-0 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                  No available slots from this mentor.
                </p>
              )}
            </section>
          </div>
        )}
      </CardContent>

      {slotToBook && (
        <ConfirmDialog
          confirmLabel="Book meeting"
          description={`${formatDateTime(slotToBook.startAt)} - ${formatTime(
            slotToBook.endAt,
          )}`}
          onClose={() => setSlotToBook(null)}
          onConfirm={() =>
            bookMeetingMutation.mutateAsync({
              groupId: group.id,
              payload: { slotId: slotToBook.id },
            })
          }
          title="Confirm meeting booking"
        />
      )}

      {meetingToCancel && (
        <ConfirmDialog
          confirmLabel="Cancel meeting"
          description={`Cancel the meeting scheduled for ${formatDateTime(
            meetingToCancel.startAt,
          )}?`}
          onClose={() => setMeetingToCancel(null)}
          onConfirm={async () => {
            await cancelMeetingMutation.mutateAsync({
              groupId: group.id,
              meetingId: meetingToCancel.id,
            });
            setSuccessMessage("Meeting canceled successfully.");
          }}
          title="Cancel mentor meeting"
          tone="danger"
        />
      )}
    </Card>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Clock3,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  type MentorAvailabilitySlotDto,
  useBookMeeting,
  useGroupMeetings,
  useMentorAvailabilityForGroup,
  useSubmitMeetingEvidence,
} from "@/modules/mentoring";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  ResponsiveDialog,
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { GroupDetailDto } from "../../types";

type MeetingBookingSectionProps = {
  canBook: boolean;
  group: GroupDetailDto;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(
    new Date(value),
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(
    new Date(value),
  );
}

function getBookingErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "Unable to book this availability slot.";
  }
  if (/slot.*(not available|past|booked)/i.test(error.message)) {
    return "This slot is no longer available. The schedule has been refreshed.";
  }
  return error.message;
}

export function MeetingBookingSection({
  canBook,
  group,
}: MeetingBookingSectionProps) {
  const meetingsQuery = useGroupMeetings(group.id);
  const availabilityQuery = useMentorAvailabilityForGroup(
    group.mentor ? group.id : null,
  );
  const bookingMutation = useBookMeeting();
  const evidenceMutation = useSubmitMeetingEvidence();
  const [bookingSlot, setBookingSlot] =
    useState<MentorAvailabilitySlotDto | null>(null);
  const [evidenceUrls, setEvidenceUrls] = useState<Record<number, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const meetings = useMemo(
    () => meetingsQuery.data?.data ?? [],
    [meetingsQuery.data?.data],
  );
  const availableSlots = useMemo(
    () =>
      (availabilityQuery.data?.data ?? []).filter(
        (slot) =>
          slot.status === "AVAILABLE" && new Date(slot.startAt).getTime() > now,
      ),
    [availabilityQuery.data?.data, now],
  );
  const activeMeetingCount = meetings.filter(
    (meeting) => meeting.status !== "CANCELED",
  ).length;
  const meetingLimitReached = activeMeetingCount >= 2;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  async function submitEvidence(meetingId: number) {
    const imageUrl = evidenceUrls[meetingId]?.trim();
    if (!imageUrl) return;

    try {
      await evidenceMutation.mutateAsync({
        groupId: group.id,
        imageUrl,
        meetingId,
      });
      toast.success("Meeting evidence submitted. The meeting is now complete.");
      setEvidenceUrls((value) => ({ ...value, [meetingId]: "" }));
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to submit evidence.",
      );
    }
  }

  async function confirmBooking() {
    if (!bookingSlot) return;

    try {
      await bookingMutation.mutateAsync({
        groupId: group.id,
        slotId: bookingSlot.id,
      });
      setBookingSlot(null);
      toast.success("Mentor meeting booked successfully.");
    } catch (error) {
      await Promise.allSettled([
        availabilityQuery.refetch(),
        meetingsQuery.refetch(),
      ]);
      setBookingSlot(null);
      toast.error(getBookingErrorMessage(error));
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          description={
            group.mentor
              ? `Assigned mentor: ${group.mentor.fullName}`
              : "A mentor must be assigned before meetings can be booked."
          }
          title="Mentor meetings"
        />
        <CardContent className="grid min-w-0 gap-6">
          {!group.mentor ? (
            <EmptyState
              icon={<CalendarClock size={22} />}
              title="No mentor assigned"
            />
          ) : (
            <>
              <section className="grid min-w-0 gap-3">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="grid min-w-0 gap-1">
                    <h3 className="m-0 text-base font-bold text-foreground">
                      Upcoming availability
                    </h3>
                    <p className="m-0 text-sm text-muted">
                      Choose a published time from {group.mentor.fullName}.
                    </p>
                  </div>
                  <Badge tone={meetingLimitReached ? "warning" : "neutral"}>
                    {activeMeetingCount}/2 meetings
                  </Badge>
                </div>

                {group.studentReadOnly ? (
                  <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                    This term has ended. Availability is read-only.
                  </div>
                ) : !canBook ? (
                  <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                    Only the group leader can book an availability slot.
                  </div>
                ) : meetingLimitReached ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    This group already has the maximum of two non-canceled
                    mentor meetings.
                  </div>
                ) : null}

                {availabilityQuery.isLoading ? (
                  <LoadingState title="Loading mentor availability" />
                ) : availabilityQuery.isError ? (
                  <EmptyState
                    description="Refresh the page or try again later."
                    title="Unable to load availability"
                  />
                ) : availableSlots.length === 0 ? (
                  <EmptyState
                    description="Your mentor has not published any future slots."
                    title="No available slots"
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {availableSlots.map((slot) => (
                      <article
                        className="grid min-w-0 gap-3 rounded-xl border border-border bg-background p-4"
                        key={slot.id}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand-primary">
                            <Clock3 size={18} />
                          </span>
                          <div className="grid min-w-0 gap-1">
                            <strong className="break-words text-sm text-foreground">
                              {formatDate(slot.startAt)}
                            </strong>
                            <span className="text-sm text-muted">
                              {formatTime(slot.startAt)}–{formatTime(slot.endAt)}
                            </span>
                          </div>
                        </div>
                        {slot.note && (
                          <p className="m-0 break-words text-sm text-muted">
                            {slot.note}
                          </p>
                        )}
                        {canBook && !meetingLimitReached && (
                          <Button
                            disabled={bookingMutation.isPending}
                            onClick={() => setBookingSlot(slot)}
                            size="sm"
                          >
                            Book this slot
                          </Button>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="grid min-w-0 gap-3 border-t border-border pt-5">
                <h3 className="m-0 text-base font-bold text-foreground">
                  Meeting history
                </h3>
                {meetingsQuery.isLoading ? (
                  <LoadingState title="Loading meeting reports" />
                ) : meetingsQuery.isError ? (
                  <EmptyState title="Unable to load meeting reports" />
                ) : meetings.length === 0 ? (
                  <EmptyState
                    description="Booked or mentor-created meetings will appear here."
                    title="No meetings yet"
                  />
                ) : (
                  <div className="grid gap-4">
                    {meetings.map((meeting) => {
                      const canSubmit =
                        meeting.status === "SCHEDULED" &&
                        new Date(meeting.endAt).getTime() <= now;

                      return (
                        <article
                          className="grid gap-3 rounded-xl border border-border bg-background p-4"
                          key={meeting.id}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <strong className="text-foreground">
                                {formatDateTime(meeting.startAt)}–
                                {formatDateTime(meeting.endAt)}
                              </strong>
                              <p className="m-0 mt-1 text-sm text-muted">
                                {meeting.note || "No note"}
                              </p>
                            </div>
                            <Badge
                              tone={
                                meeting.status === "COMPLETED"
                                  ? "success"
                                  : meeting.status === "CANCELED"
                                    ? "danger"
                                    : "warning"
                              }
                            >
                              {meeting.status}
                            </Badge>
                          </div>
                          {meeting.meetLink && (
                            <a
                              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary"
                              href={meeting.meetLink}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <ExternalLink size={14} /> Open meeting link
                            </a>
                          )}
                          {meeting.evidenceImageUrl ? (
                            <div className="grid gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                              <span>
                                Evidence submitted by{" "}
                                {meeting.evidenceSubmittedByStudentName ??
                                  "a group member"}
                                .
                              </span>
                              <a
                                className="inline-flex items-center gap-1 font-semibold"
                                href={meeting.evidenceImageUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <ImageIcon size={14} /> View evidence image
                              </a>
                            </div>
                          ) : canSubmit ? (
                            <div className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                              <TextInput
                                label="Evidence image URL"
                                onChange={(event) =>
                                  setEvidenceUrls((value) => ({
                                    ...value,
                                    [meeting.id]: event.target.value,
                                  }))
                                }
                                placeholder="https://..."
                                type="url"
                                value={evidenceUrls[meeting.id] ?? ""}
                              />
                              <Button
                                className="w-fit"
                                disabled={
                                  !evidenceUrls[meeting.id]?.trim() ||
                                  evidenceMutation.isPending
                                }
                                onClick={() => submitEvidence(meeting.id)}
                                size="sm"
                              >
                                Submit evidence & complete
                              </Button>
                            </div>
                          ) : meeting.status === "SCHEDULED" ? (
                            <p className="m-0 text-xs text-muted">
                              Evidence can be submitted by any active member
                              after the meeting ends.
                            </p>
                          ) : null}
                          {meeting.cancelReason && (
                            <p className="m-0 text-sm text-red-700">
                              Reason: {meeting.cancelReason}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </CardContent>
      </Card>

      {bookingSlot && (
        <ResponsiveDialog
          description={`${formatDate(bookingSlot.startAt)}, ${formatTime(
            bookingSlot.startAt,
          )}–${formatTime(bookingSlot.endAt)}`}
          footer={
            <>
              <Button
                disabled={bookingMutation.isPending}
                onClick={() => setBookingSlot(null)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                disabled={bookingMutation.isPending}
                onClick={confirmBooking}
              >
                {bookingMutation.isPending ? "Booking..." : "Confirm booking"}
              </Button>
            </>
          }
          onClose={() => setBookingSlot(null)}
          title="Book this mentor slot?"
        >
          <p className="m-0 text-sm leading-6 text-muted">
            This availability slot will be reserved for {group.name} and will
            count toward the group&apos;s two-meeting limit.
          </p>
        </ResponsiveDialog>
      )}
    </>
  );
}

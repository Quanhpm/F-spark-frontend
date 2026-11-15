"use client";

import { CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button, EmptyState, LoadingState, ResponsiveDialog } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useConfirmMeeting, useMeetingAttendance } from "../hooks";
import type { MeetingAttendanceStatus, MentorMeetingDto } from "../types";
import { AttendanceStatusPicker } from "./attendance-status-picker";
import { formatMentorIdentity } from "./availability-calendar.utils";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type DraftEntry = { status: MeetingAttendanceStatus | null; note: string };

export function ConfirmMeetingDialog({
  meeting,
  onClose,
}: {
  meeting: MentorMeetingDto;
  onClose: () => void;
}) {
  const confirmMutation = useConfirmMeeting();
  const attendanceQuery = useMeetingAttendance(meeting);
  const roster = useMemo(
    () => (attendanceQuery.data?.data.attendances ?? []).filter((row) => row.studentId !== null),
    [attendanceQuery.data],
  );
  const [draft, setDraft] = useState<Record<number, DraftEntry>>({});

  // Untouched rows fall back to a previous confirmation (after undo), else "Present".
  function entryFor(studentId: number): DraftEntry {
    if (draft[studentId]) return draft[studentId];
    const row = roster.find((item) => item.studentId === studentId);
    return { note: row?.note ?? "", status: row?.status ?? "PRESENT" };
  }

  const missingCount = roster.filter((row) => !entryFor(row.studentId as number).status).length;
  const canSubmit = roster.length > 0 && missingCount === 0 && !confirmMutation.isPending;

  function update(studentId: number, patch: Partial<DraftEntry>) {
    setDraft((current) => ({
      ...current,
      [studentId]: { ...entryFor(studentId), ...patch },
    }));
  }

  function markAllPresent() {
    setDraft(Object.fromEntries(roster.map((row) => [
      row.studentId as number,
      { note: entryFor(row.studentId as number).note, status: "PRESENT" as const },
    ])));
  }

  async function confirm() {
    try {
      const response = await confirmMutation.mutateAsync({
        attendance: {
          attendances: roster.map((row) => {
            const entry = entryFor(row.studentId as number);
            return {
              note: entry?.note.trim() || null,
              status: entry?.status as MeetingAttendanceStatus,
              studentId: row.studentId as number,
            };
          }),
        },
        groupId: meeting.groupId,
        meetingId: meeting.id,
      });
      toast.success(
        response.data.status === "COMPLETED"
          ? "Meeting confirmed and completed."
          : "Meeting confirmed. Waiting for student evidence.",
      );
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to confirm the meeting.",
      );
    }
  }

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[640px]"
      description={`${meeting.groupNo} · ${meeting.groupName} · Mentor: ${formatMentorIdentity(meeting)}`}
      footer={(
        <>
          <Button disabled={confirmMutation.isPending} onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={() => void confirm()}>
            {confirmMutation.isPending ? "Confirming..." : "Confirm meeting"}
          </Button>
        </>
      )}
      onClose={onClose}
      title="Confirm meeting and take attendance"
    >
      <div className="grid gap-4 text-sm leading-6 text-muted">
        <div className="grid gap-1">
          <p className="m-0">
            Meeting time: {formatDateTime(meeting.startAt)}–{formatDateTime(meeting.endAt)}.
          </p>
          <p className="m-0">
            {meeting.evidenceImageUrl
              ? "Student evidence is already available. Confirming will complete this meeting."
              : "Student evidence has not been submitted yet. The meeting will remain open until evidence is received."}
          </p>
        </div>

        {attendanceQuery.isLoading ? (
          <LoadingState title="Loading group members" />
        ) : attendanceQuery.isError ? (
          <EmptyState
            actions={<Button onClick={() => void attendanceQuery.refetch()} variant="secondary">Try again</Button>}
            description={attendanceQuery.error instanceof ApiError
              ? attendanceQuery.error.message
              : "Unable to load group members."}
            title="Unable to load attendance"
          />
        ) : roster.length === 0 ? (
          <EmptyState description="This group has no members to take attendance for." title="No members" />
        ) : (
          <section aria-label="Attendance" className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-foreground">Attendance ({roster.length} students)</strong>
              <Button icon={<CheckCheck size={14} />} onClick={markAllPresent} size="sm" variant="ghost">
                Mark all present
              </Button>
            </div>
            <ul className="m-0 grid list-none gap-2 p-0">
              {roster.map((row) => {
                const studentId = row.studentId as number;
                const entry = entryFor(studentId);
                return (
                  <li className="grid gap-2 rounded-xl border border-border bg-background p-3" key={studentId}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 break-words text-foreground">
                        <strong>{row.studentName}</strong> · {row.studentCode}
                        {!row.stillInGroup && <span className="ml-1 text-xs text-muted">(left group)</span>}
                      </span>
                      <AttendanceStatusPicker
                        disabled={confirmMutation.isPending}
                        label={`Attendance for ${row.studentName}`}
                        onChange={(status) => update(studentId, { status })}
                        value={entry?.status ?? null}
                      />
                    </div>
                    {entry?.status && entry.status !== "PRESENT" && (
                      <input
                        aria-label={`Note for ${row.studentName}`}
                        className="min-h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand-secondary"
                        maxLength={500}
                        onChange={(event) => update(studentId, { note: event.target.value })}
                        placeholder="Optional note (e.g. joined 20 minutes late)"
                        value={entry.note}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </ResponsiveDialog>
  );
}

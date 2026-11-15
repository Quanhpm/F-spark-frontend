"use client";

import { History, Pencil, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge, Button, EmptyState, LoadingState, ResponsiveDialog } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import {
  useMeetingAttendance,
  useMeetingAttendanceHistory,
  useOverrideMeetingAttendance,
  useRemoveMeetingAttendance,
  useUpdateMeetingAttendance,
} from "../hooks";
import type {
  MeetingAttendanceDto,
  MeetingAttendanceStatus,
  MentorMeetingDto,
} from "../types";
import { AttendanceStatusPicker } from "./attendance-status-picker";
import {
  ATTENDANCE_EVENT_LABELS,
  ATTENDANCE_LABELS,
  ATTENDANCE_TONES,
  formatAttendanceSummary,
} from "./meeting-attendance.utils";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

const fieldClassName =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand-secondary";

function StatusBadge({ status }: { status: MeetingAttendanceStatus | null }) {
  if (!status) return <Badge tone="neutral">Not recorded</Badge>;
  return <Badge tone={ATTENDANCE_TONES[status]}>{ATTENDANCE_LABELS[status]}</Badge>;
}

/** Admin-only editor for one row: change status, or remove from the sheet. Reason is mandatory. */
function AdminRowEditor({
  meeting,
  onDone,
  row,
}: {
  meeting: MentorMeetingDto;
  onDone: () => void;
  row: MeetingAttendanceDto;
}) {
  const overrideMutation = useOverrideMeetingAttendance();
  const removeMutation = useRemoveMeetingAttendance();
  const [status, setStatus] = useState<MeetingAttendanceStatus | null>(row.status);
  const [note, setNote] = useState(row.note ?? "");
  const [reason, setReason] = useState("");
  const pending = overrideMutation.isPending || removeMutation.isPending;
  const studentId = row.studentId as number;

  async function save() {
    if (!status) return;
    try {
      await overrideMutation.mutateAsync({
        groupId: meeting.groupId,
        meetingId: meeting.id,
        payload: { note: note.trim() || null, reason: reason.trim(), status },
        studentId,
      });
      toast.success("Attendance updated.");
      onDone();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to update attendance."));
    }
  }

  async function remove() {
    try {
      await removeMutation.mutateAsync({
        groupId: meeting.groupId,
        meetingId: meeting.id,
        reason: reason.trim(),
        studentId,
      });
      toast.success("Student removed from the attendance sheet.");
      onDone();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to remove the student."));
    }
  }

  return (
    <div className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
      <AttendanceStatusPicker
        disabled={pending}
        label={`New attendance for ${row.studentName}`}
        onChange={setStatus}
        value={status}
      />
      <input
        aria-label="Attendance note"
        className={fieldClassName}
        maxLength={500}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Note (optional)"
        value={note}
      />
      <textarea
        aria-label="Reason for this correction"
        className={`${fieldClassName} min-h-16 resize-y`}
        maxLength={500}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason (required, kept in history)"
        value={reason}
      />
      <div className="flex flex-wrap justify-between gap-2">
        {row.id !== null ? (
          <Button
            disabled={pending || !reason.trim()}
            icon={<Trash2 size={14} />}
            onClick={() => void remove()}
            size="sm"
            variant="ghost"
          >
            Remove from sheet
          </Button>
        ) : <span />}
        <div className="flex gap-2">
          <Button disabled={pending} onClick={onDone} size="sm" variant="secondary">Cancel</Button>
          <Button disabled={pending || !status || !reason.trim()} onClick={() => void save()} size="sm">
            {overrideMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AttendanceHistory({ meetingId }: { meetingId: number }) {
  const historyQuery = useMeetingAttendanceHistory(meetingId);
  const events = historyQuery.data?.data ?? [];

  if (historyQuery.isLoading) return <LoadingState title="Loading attendance history" />;
  if (historyQuery.isError) {
    return (
      <EmptyState
        description={errorMessage(historyQuery.error, "Unable to load attendance history.")}
        title="Unable to load history"
      />
    );
  }
  if (events.length === 0) {
    return <EmptyState description="Attendance has not been recorded for this meeting." title="No history" />;
  }
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {events.map((event) => (
        <li className="grid gap-1 rounded-xl border border-border bg-background p-3 text-sm" key={event.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <strong className="text-foreground">
              {event.studentName} · {event.studentCode}
            </strong>
            <time className="text-xs text-muted">{formatDateTime(event.changedAt)}</time>
          </div>
          <span className="text-muted">
            {ATTENDANCE_EVENT_LABELS[event.action]}:{" "}
            {event.previousStatus ? ATTENDANCE_LABELS[event.previousStatus] : "—"} →{" "}
            {event.newStatus ? ATTENDANCE_LABELS[event.newStatus] : "—"}
            {event.newNote ? ` (${event.newNote})` : ""}
          </span>
          <span className="text-xs text-muted">
            By {event.changedByEmail} ({event.changedByRole})
          </span>
          {event.reason && (
            <span className="whitespace-pre-wrap break-words text-xs text-foreground">Reason: {event.reason}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function MeetingAttendanceDialog({
  admin = false,
  meeting,
  onClose,
}: {
  admin?: boolean;
  meeting: MentorMeetingDto;
  onClose: () => void;
}) {
  const attendanceQuery = useMeetingAttendance(meeting, { admin });
  const updateMutation = useUpdateMeetingAttendance();
  const view = attendanceQuery.data?.data;
  const [tab, setTab] = useState<"sheet" | "history">("sheet");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<number, { status: MeetingAttendanceStatus; note: string }>>({});
  const [adminEditingStudent, setAdminEditingStudent] = useState<number | null>(null);

  const recordedRows = (view?.attendances ?? []).filter((row) => row.id !== null && row.studentId !== null);

  function startEditing() {
    setDraft(Object.fromEntries(recordedRows.map((row) => [
      row.studentId as number,
      { note: row.note ?? "", status: row.status as MeetingAttendanceStatus },
    ])));
    setEditing(true);
  }

  async function saveMentorEdits() {
    const changed = recordedRows
      .filter((row) => {
        const entry = draft[row.studentId as number];
        return entry && (entry.status !== row.status || (entry.note.trim() || null) !== row.note);
      })
      .map((row) => {
        const entry = draft[row.studentId as number];
        return { note: entry.note.trim() || null, status: entry.status, studentId: row.studentId as number };
      });
    if (changed.length === 0) {
      setEditing(false);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        attendance: { attendances: changed },
        groupId: meeting.groupId,
        meetingId: meeting.id,
      });
      toast.success("Attendance updated.");
      setEditing(false);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to update attendance."));
    }
  }

  const footer = editing ? (
    <>
      <Button disabled={updateMutation.isPending} onClick={() => setEditing(false)} variant="secondary">
        Cancel
      </Button>
      <Button disabled={updateMutation.isPending} onClick={() => void saveMentorEdits()}>
        {updateMutation.isPending ? "Saving..." : "Save attendance"}
      </Button>
    </>
  ) : (
    <>
      {!admin && view?.canEdit && tab === "sheet" && (
        <Button icon={<Pencil size={14} />} onClick={startEditing} variant="secondary">
          Edit attendance
        </Button>
      )}
      <Button onClick={onClose} variant="secondary">Close</Button>
    </>
  );

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[640px]"
      description={`Group ${meeting.groupNo} · ${meeting.groupName} · ${formatDateTime(meeting.startAt)}`}
      footer={footer}
      onClose={onClose}
      title="Meeting attendance"
    >
      {admin && (
        <div className="mb-3 flex gap-2" role="tablist">
          <Button
            aria-selected={tab === "sheet"}
            icon={<Users size={14} />}
            onClick={() => setTab("sheet")}
            role="tab"
            size="sm"
            variant={tab === "sheet" ? "primary" : "ghost"}
          >
            Attendance
          </Button>
          <Button
            aria-selected={tab === "history"}
            icon={<History size={14} />}
            onClick={() => setTab("history")}
            role="tab"
            size="sm"
            variant={tab === "history" ? "primary" : "ghost"}
          >
            History
          </Button>
        </div>
      )}

      {tab === "history" ? (
        <AttendanceHistory meetingId={meeting.id} />
      ) : attendanceQuery.isLoading ? (
        <LoadingState title="Loading attendance" />
      ) : attendanceQuery.isError || !view ? (
        <EmptyState
          actions={<Button onClick={() => void attendanceQuery.refetch()} variant="secondary">Try again</Button>}
          description={errorMessage(attendanceQuery.error, "Unable to load attendance.")}
          title="Unable to load attendance"
        />
      ) : (
        <div className="grid gap-3 text-sm">
          {!view.recorded ? (
            <p className="m-0 rounded-xl border border-border bg-background px-4 py-3 text-muted">
              Attendance has not been recorded for this meeting yet.
              {admin ? " You can record each student below; a reason is required." : ""}
            </p>
          ) : (
            <p className="m-0 text-muted">
              {formatAttendanceSummary(view.summary)}
              {!admin && view.canEdit && view.mentorEditableUntil
                ? ` · You can edit until ${formatDateTime(view.mentorEditableUntil)}.`
                : ""}
            </p>
          )}

          <ul className="m-0 grid list-none gap-2 p-0">
            {view.attendances.map((row) => {
              const key = row.studentId ?? `code-${row.studentCode}`;
              const mentorEntry = row.studentId !== null ? draft[row.studentId] : undefined;
              const canMentorEditRow = editing && row.id !== null && mentorEntry;
              return (
                <li className="grid gap-2 rounded-xl border border-border bg-background p-3" key={key}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="grid min-w-0 gap-0.5">
                      <span className="break-words text-foreground">
                        <strong>{row.studentName}</strong> · {row.studentCode}
                      </span>
                      {!row.stillInGroup && <span className="text-xs text-muted">No longer in this group</span>}
                      {row.note && !canMentorEditRow && (
                        <span className="break-words text-xs text-muted">Note: {row.note}</span>
                      )}
                    </div>
                    {canMentorEditRow ? (
                      <AttendanceStatusPicker
                        disabled={updateMutation.isPending}
                        label={`Attendance for ${row.studentName}`}
                        onChange={(status) => setDraft((current) => ({
                          ...current,
                          [row.studentId as number]: { ...current[row.studentId as number], status },
                        }))}
                        value={mentorEntry.status}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={row.status} />
                        {admin && row.studentId !== null && adminEditingStudent !== row.studentId && (
                          <Button
                            icon={<Pencil size={13} />}
                            onClick={() => setAdminEditingStudent(row.studentId)}
                            size="sm"
                            variant="ghost"
                          >
                            {row.status ? "Change" : "Record"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {canMentorEditRow && (
                    <input
                      aria-label={`Note for ${row.studentName}`}
                      className={fieldClassName}
                      maxLength={500}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        [row.studentId as number]: { ...current[row.studentId as number], note: event.target.value },
                      }))}
                      placeholder="Note (optional)"
                      value={mentorEntry.note}
                    />
                  )}
                  {editing && row.id === null && (
                    <span className="text-xs text-muted">Not on the attendance sheet. Ask an administrator to add this student.</span>
                  )}
                  {admin && adminEditingStudent === row.studentId && row.studentId !== null && (
                    <AdminRowEditor
                      meeting={meeting}
                      onDone={() => setAdminEditingStudent(null)}
                      row={row}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ResponsiveDialog>
  );
}

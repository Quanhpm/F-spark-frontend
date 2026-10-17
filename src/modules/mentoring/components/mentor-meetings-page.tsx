"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Edit3, ExternalLink, Plus, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/modules/auth";
import { isMeetingOwnedByCurrentMentor } from "@/modules/groups";
import { Badge, Button, Card, CardContent, CardHeader, DateTimeInput, EmptyState, LoadingState, PageHeader, ResponsiveDialog, Select, TextInput } from "@/shared/components";
import { ApiError } from "@/shared/lib";
import {
  useCancelMeeting,
  useCreateMeeting,
  useExportMentorMeetingReport,
  useMentorReportTerms,
  useMyMeetings,
  useUpdateMeeting,
} from "../hooks";
import type { MentorMeetingDto, MentorMeetingReportFilter } from "../types";
import {
  DEFAULT_SLOT_DURATION_MINUTES,
  formatMentorIdentity,
  getMeetingDisplayStatus,
  getBusinessDateKey,
  getSlotEndDateTimeLocal,
  isWholeMinute,
  MINUTE_IN_MS,
  SLOT_DURATION_OPTIONS,
  type SlotDurationMinutes,
} from "./availability-calendar.utils";
import { ReopenMeetingDialog } from "./reopen-meeting-dialog";
import { ConfirmMeetingDialog } from "./confirm-meeting-dialog";
import { MeetingConfirmationStatus } from "./meeting-confirmation-status";
import { UndoMeetingConfirmationDialog } from "./undo-meeting-confirmation-dialog";

function dateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

type FormState = { groupId: string; startAt: string; endAt: string; meetLink: string; note: string; durationMinutes: SlotDurationMinutes };

export function MentorMeetingsPage() {
  const currentUser = useAuthStore((state) => state.session?.user);
  const createMutation = useCreateMeeting();
  const updateMutation = useUpdateMeeting();
  const cancelMutation = useCancelMeeting();
  const reportTermsQuery = useMentorReportTerms();
  const exportReportMutation = useExportMentorMeetingReport();
  const [editing, setEditing] = useState<MentorMeetingDto | null>(null);
  const [reopening, setReopening] = useState<MentorMeetingDto | null>(null);
  const [confirming, setConfirming] = useState<MentorMeetingDto | null>(null);
  const [undoingConfirmation, setUndoingConfirmation] = useState<MentorMeetingDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reportTerm, setReportTerm] = useState("");
  const [meetingFilter, setMeetingFilter] =
    useState<MentorMeetingReportFilter>("ALL");
  const [now, setNow] = useState(() => Date.now());
  const [form, setForm] = useState<FormState>({ groupId: "", startAt: "", endAt: "", meetLink: "", note: "", durationMinutes: DEFAULT_SLOT_DURATION_MINUTES });

  const reportTerms = useMemo(
    () => reportTermsQuery.data?.data ?? [],
    [reportTermsQuery.data?.data],
  );
  const termOptions = reportTerms;
  const selectedReportTerm =
    termOptions.find((term) => term.code === reportTerm)?.code ??
    termOptions[0]?.code ??
    "";
  const meetingsQuery = useMyMeetings({
    filter: meetingFilter,
    term: selectedReportTerm,
  });
  const reportView = meetingsQuery.data?.data;
  const filteredGroups = reportView?.groups ?? [];
  const eligibleGroupOptions = reportView?.recordableGroups ?? [];
  const eligibleGroups = eligibleGroupOptions.map((option) => option.group);
  const recordableCounts = new Map(
    eligibleGroupOptions.map((option) => [option.group.id, option.activeMeetingCount]),
  );
  const invalidStartPrecision = Boolean(form.startAt) && !isWholeMinute(form.startAt);
  const invalidDuration = Boolean(form.startAt && form.endAt) &&
    new Date(form.endAt).getTime() - new Date(form.startAt).getTime() !== form.durationMinutes * MINUTE_IN_MS;
  const crossesBusinessDay = Boolean(form.startAt && form.endAt) &&
    getBusinessDateKey(form.startAt) !== getBusinessDateKey(form.endAt);
  const visibleMeetingCount = reportView?.totalMatchedMeetings ?? 0;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ groupId: eligibleGroups[0]?.id.toString() ?? "", startAt: "", endAt: "", meetLink: "", note: "", durationMinutes: DEFAULT_SLOT_DURATION_MINUTES });
    setShowForm(true);
  }

  function openEdit(meeting: MentorMeetingDto) {
    const startAt = dateTimeLocal(meeting.startAt);
    setEditing(meeting);
    const endAt = getSlotEndDateTimeLocal(startAt, DEFAULT_SLOT_DURATION_MINUTES);
    setForm({ groupId: meeting.groupId.toString(), startAt, endAt, meetLink: meeting.meetLink ?? "", note: meeting.note ?? "", durationMinutes: DEFAULT_SLOT_DURATION_MINUTES });
    setShowForm(true);
  }

  function updateStartAt(startAt: string) {
    setForm((value) => ({
      ...value,
      startAt,
      endAt: getSlotEndDateTimeLocal(startAt, value.durationMinutes),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isWholeMinute(form.startAt) || !form.endAt || invalidDuration || crossesBusinessDay) {
      toast.error(
        crossesBusinessDay
          ? "Meetings must start and end on the same day."
          : invalidDuration
            ? "Meetings must match the selected duration."
            : "Choose a meeting start time without seconds.",
      );
      return;
    }
    const payload = {
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      meetLink: form.meetLink.trim(),
      note: editing ? form.note.trim() : form.note.trim() || undefined,
    };
    try {
      if (editing) await updateMutation.mutateAsync({ groupId: editing.groupId, meetingId: editing.id, payload });
      else await createMutation.mutateAsync({ groupId: Number(form.groupId), payload });
      toast.success(editing ? "Meeting record updated." : "Meeting recorded.");
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to save meeting.");
    }
  }

  async function exportMeetingReport() {
    if (!selectedReportTerm) return;

    try {
      const blob = await exportReportMutation.mutateAsync(selectedReportTerm);
      downloadBlob(blob, `mentor-meeting-report-${selectedReportTerm}.xlsx`);
      toast.success("Meeting report downloaded.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to export the meeting report.",
      );
    }
  }

  async function cancelMeeting(meeting: MentorMeetingDto) {
    try {
      await cancelMutation.mutateAsync({
        groupId: meeting.groupId,
        meetingId: meeting.id,
        reason: "Canceled by mentor",
      });
      toast.success("Meeting canceled.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to cancel the meeting.",
      );
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Mentor" title="Meeting records & reports" description="Record meetings held outside the booking flow so students can submit evidence." actions={
        <>
          <Select
            aria-label="Report term"
            disabled={termOptions.length === 0}
            onChange={(event) => setReportTerm(event.target.value)}
            shellClassName="w-48 max-[480px]:w-full"
            value={selectedReportTerm}
          >
            {termOptions.length === 0 && (
              <option value="">
                {reportTermsQuery.isError
                  ? "Unable to load terms"
                  : reportTermsQuery.isLoading
                    ? "Loading terms..."
                    : "No report terms"}
              </option>
            )}
            {termOptions.map((term) => (
              <option key={term.code} value={term.code}>
                {term.code}{term.status ? ` · ${term.status}` : ""}
              </option>
            ))}
          </Select>
          <Button
            disabled={!selectedReportTerm || exportReportMutation.isPending}
            icon={<Download size={16} />}
            onClick={() => void exportMeetingReport()}
            variant="secondary"
          >
            {exportReportMutation.isPending ? "Exporting..." : "Export report"}
          </Button>
          <Button icon={<Plus size={16} />} disabled={eligibleGroups.length === 0} onClick={openCreate}>Record external meeting</Button>
        </>
      } />

      <Card isPadded>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Select
            aria-label="Meeting status"
            label="Meeting status"
            onChange={(event) =>
              setMeetingFilter(event.target.value as MentorMeetingReportFilter)
            }
            shellClassName="w-64 max-[480px]:w-full"
            value={meetingFilter}
          >
            <option value="ALL">All meetings</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="NEEDS_MY_CONFIRMATION">Needs my confirmation</option>
            <option value="AWAITING_EVIDENCE">Awaiting evidence</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELED">Canceled</option>
          </Select>
          <span className="text-sm text-muted">
            {visibleMeetingCount} {visibleMeetingCount === 1 ? "meeting" : "meetings"}
          </span>
        </div>
      </Card>

      {meetingsQuery.isLoading || reportTermsQuery.isLoading ? <Card isPadded><LoadingState title="Loading meetings" /></Card> :
       meetingsQuery.isError || reportTermsQuery.isError ? <Card isPadded><EmptyState title="Unable to load meetings" /></Card> :
       termOptions.length === 0 ? <Card isPadded><EmptyState title="No assigned teams" description="Teams will appear after an admin assigns them to you." /></Card> :
       reportView?.assignedGroupCount === 0 ? <Card isPadded><EmptyState title={`No assigned groups in ${selectedReportTerm}`} description="You can still export historical meeting data for this term when available." /></Card> : (
        filteredGroups.length === 0 ? (
          <Card isPadded>
            <EmptyState
              actions={
                <Button onClick={() => setMeetingFilter("ALL")} variant="secondary">
                  Show all meetings
                </Button>
              }
              description="Try another status or show all meetings."
              title="No meetings match this filter"
            />
          </Card>
        ) : <div className="grid gap-5">
          {filteredGroups.map(({ group, meetings: groupMeetings, activeMeetingCount }) => {
            const used = activeMeetingCount;
            return <Card key={group.id}>
              <CardHeader title={`${group.groupNo} · ${group.name}`} description={`${group.term} / ${group.courseCode}`} actions={<Badge tone={used >= 2 ? "warning" : "neutral"}>{used}/2 slots</Badge>} />
              <CardContent className="grid gap-3">
                {groupMeetings.length === 0 ? <EmptyState title="No meetings reported" /> : groupMeetings.map((meeting) => {
                  const isOwner = isMeetingOwnedByCurrentMentor(
                    group,
                    meeting.mentorId,
                    currentUser?.id,
                    currentUser?.email,
                  );
                  const canConfirm = isOwner && meeting.status === "SCHEDULED"
                    && !meeting.mentorConfirmedAt
                    && new Date(meeting.endAt).getTime() <= now;
                  const displayStatus = getMeetingDisplayStatus(meeting, now);

                  return (
                  <article className="grid gap-3 rounded-xl border border-border bg-background p-4" key={meeting.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0"><strong className="break-words">{formatDateTime(meeting.startAt)} – {formatDateTime(meeting.endAt)}</strong><p className="m-0 mt-1 break-words text-sm text-muted">Mentor: {formatMentorIdentity(meeting)}</p><p className="m-0 mt-1 break-words text-sm text-muted">{meeting.note || "No note"}</p></div>
                      <Badge tone={meeting.status === "COMPLETED" ? "success" : meeting.status === "CANCELED" ? "danger" : "warning"}>{displayStatus}</Badge>
                    </div>
                    <MeetingConfirmationStatus meeting={meeting} />
                    {meeting.evidenceImageUrl && <a className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary" href={meeting.evidenceImageUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View meeting evidence</a>}
                    {isOwner && meeting.status === "COMPLETED" && <div className="flex flex-wrap gap-2">
                      {meeting.mentorConfirmedAt && <Button size="sm" variant="secondary" icon={<RotateCcw size={14} />} onClick={() => setUndoingConfirmation(meeting)}>Undo confirmation</Button>}
                      <Button size="sm" variant="secondary" icon={<RotateCcw size={14} />} onClick={() => setReopening(meeting)}>Undo completion</Button>
                    </div>}
                    {isOwner && meeting.status === "SCHEDULED" && <div className="flex flex-wrap gap-2">
                      {canConfirm && <Button size="sm" icon={<CheckCircle2 size={14} />} onClick={() => setConfirming(meeting)}>Confirm meeting</Button>}
                      {meeting.mentorConfirmedAt && <Button size="sm" variant="secondary" icon={<RotateCcw size={14} />} onClick={() => setUndoingConfirmation(meeting)}>Undo confirmation</Button>}
                      {!meeting.evidenceImageUrl && <Button size="sm" variant="secondary" icon={<Edit3 size={14} />} onClick={() => openEdit(meeting)}>Edit</Button>}
                      <Button size="sm" variant="danger" icon={<XCircle size={14} />} disabled={cancelMutation.isPending} onClick={() => void cancelMeeting(meeting)}>Cancel</Button>
                    </div>}
                  </article>
                  );
                })}
              </CardContent>
            </Card>;
          })}
        </div>
      )}

      {showForm && <ResponsiveDialog title={editing ? "Edit meeting record" : "Record external meeting"} description={editing ? `Mentor: ${formatMentorIdentity(editing)}` : "Record a meeting arranged outside the booking flow. Students can submit evidence after the recorded end time."} onClose={() => setShowForm(false)} footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="mentor-meeting-form" type="submit" disabled={createMutation.isPending || updateMutation.isPending || !form.startAt || !form.endAt || !form.meetLink.trim() || invalidStartPrecision || invalidDuration || crossesBusinessDay}>Save record</Button></>}>
        <form id="mentor-meeting-form" className="grid gap-4" onSubmit={submit}>
          <Select label="Team" value={form.groupId} disabled={Boolean(editing)} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))} required>
            {eligibleGroups.map((group) => <option key={group.id} value={group.id}>{group.groupNo} · {group.name} ({recordableCounts.get(group.id) ?? 0}/2)</option>)}
            {editing && !eligibleGroups.some((group) => group.id === editing.groupId) && <option value={editing.groupId}>{editing.groupNo} · {editing.groupName}</option>}
          </Select>
          <DateTimeInput error={invalidStartPrecision ? "Choose a start time without seconds." : undefined} hint="Choose any date and minute." label="Start time" required step={60} type="datetime-local" value={form.startAt} onChange={(event) => updateStartAt(event.target.value)} />
          <Select disabled label="Duration" value={form.durationMinutes}>
            {SLOT_DURATION_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>2 hours 15 minutes</option>)}
          </Select>
          <TextInput error={crossesBusinessDay ? "Meetings must start and end on the same day." : invalidDuration ? "End must match the selected duration." : undefined} hint="Calculated automatically from start time and duration" label="End time" type="datetime-local" readOnly value={form.endAt} />
          <TextInput label="Meeting or reference link" placeholder="https://meet.google.com/abc-defg-hij" required type="url" value={form.meetLink} onChange={(event) => setForm((value) => ({ ...value, meetLink: event.target.value }))} />
          <TextInput label="Note (optional)" maxLength={500} value={form.note} onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))} />
        </form>
      </ResponsiveDialog>}
      {reopening && <ReopenMeetingDialog meeting={reopening} onClose={() => setReopening(null)} />}
      {confirming && <ConfirmMeetingDialog meeting={confirming} onClose={() => setConfirming(null)} />}
      {undoingConfirmation && <UndoMeetingConfirmationDialog meeting={undoingConfirmation} onClose={() => setUndoingConfirmation(null)} />}
    </div>
  );
}

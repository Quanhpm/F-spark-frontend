"use client";

import { useMemo, useState } from "react";
import { Edit3, ExternalLink, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useMentorGroups } from "@/modules/groups";
import { Badge, Button, Card, CardContent, CardHeader, EmptyState, LoadingState, PageHeader, ResponsiveDialog, Select, TextInput } from "@/shared/components";
import { ApiError } from "@/shared/lib";
import { useCancelMeeting, useCreateMeeting, useMyMeetings, useUpdateMeeting } from "../hooks";
import type { MentorMeetingDto } from "../types";
import { HalfHourDateTimeInput } from "./half-hour-date-time-input";

const MEETING_DURATION_MS = 60 * 60 * 1000;

function dateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function oneHourAfter(value: string) {
  if (!value) return "";
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "";
  return dateTimeLocal(new Date(start.getTime() + MEETING_DURATION_MS).toISOString());
}

function isHalfHourBoundary(value: string) {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) &&
    (date.getMinutes() === 0 || date.getMinutes() === 30) &&
    date.getSeconds() === 0 && date.getMilliseconds() === 0;
}

type FormState = { groupId: string; startAt: string; endAt: string; meetLink: string; note: string };

export function MentorMeetingsPage() {
  const groupsQuery = useMentorGroups();
  const meetingsQuery = useMyMeetings();
  const createMutation = useCreateMeeting();
  const updateMutation = useUpdateMeeting();
  const cancelMutation = useCancelMeeting();
  const [editing, setEditing] = useState<MentorMeetingDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ groupId: "", startAt: "", endAt: "", meetLink: "", note: "" });

  const groups = useMemo(() => groupsQuery.data?.data ?? [], [groupsQuery.data?.data]);
  const meetings = useMemo(() => meetingsQuery.data?.data ?? [], [meetingsQuery.data?.data]);
  const counts = useMemo(() => meetings.reduce<Record<number, number>>((result, meeting) => {
    if (meeting.status !== "CANCELED") result[meeting.groupId] = (result[meeting.groupId] ?? 0) + 1;
    return result;
  }, {}), [meetings]);
  const eligibleGroups = groups.filter((group) => (counts[group.id] ?? 0) < 2);
  const invalidStartBoundary = Boolean(form.startAt) && !isHalfHourBoundary(form.startAt);
  const invalidDuration = Boolean(form.startAt && form.endAt) &&
    new Date(form.endAt).getTime() - new Date(form.startAt).getTime() !== MEETING_DURATION_MS;

  function openCreate() {
    setEditing(null);
    setForm({ groupId: eligibleGroups[0]?.id.toString() ?? "", startAt: "", endAt: "", meetLink: "", note: "" });
    setShowForm(true);
  }

  function openEdit(meeting: MentorMeetingDto) {
    const startAt = dateTimeLocal(meeting.startAt);
    setEditing(meeting);
    setForm({ groupId: meeting.groupId.toString(), startAt, endAt: dateTimeLocal(meeting.endAt), meetLink: meeting.meetLink ?? "", note: meeting.note ?? "" });
    setShowForm(true);
  }

  function updateStartAt(startAt: string) {
    setForm((value) => ({ ...value, startAt, endAt: oneHourAfter(startAt) }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isHalfHourBoundary(form.startAt) || !form.endAt || invalidDuration) {
      toast.error(invalidDuration
        ? "Meetings must last exactly 60 minutes."
        : "Choose a meeting start time ending in :00 or :30.");
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
      toast.success(editing ? "Meeting updated." : "Meeting scheduled.");
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to save meeting.");
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Mentor" title="Meeting schedule & reports" description="Schedule or report up to two meetings for each assigned team." actions={
        <Button icon={<Plus size={16} />} disabled={eligibleGroups.length === 0} onClick={openCreate}>Add team & time slot</Button>
      } />

      {groupsQuery.isLoading || meetingsQuery.isLoading ? <Card isPadded><LoadingState title="Loading meetings" /></Card> :
       groupsQuery.isError || meetingsQuery.isError ? <Card isPadded><EmptyState title="Unable to load meetings" /></Card> :
       groups.length === 0 ? <Card isPadded><EmptyState title="No assigned teams" description="Teams will appear after an admin assigns them to you." /></Card> : (
        <div className="grid gap-5">
          {groups.map((group) => {
            const groupMeetings = meetings.filter((meeting) => meeting.groupId === group.id);
            const used = counts[group.id] ?? 0;
            return <Card key={group.id}>
              <CardHeader title={`${group.groupNo} · ${group.name}`} description={`${group.term} / ${group.courseCode}`} actions={<Badge tone={used >= 2 ? "warning" : "neutral"}>{used}/2 slots</Badge>} />
              <CardContent className="grid gap-3">
                {groupMeetings.length === 0 ? <EmptyState title="No meetings reported" /> : groupMeetings.map((meeting) => (
                  <article className="grid gap-3 rounded-xl border border-border bg-background p-4" key={meeting.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><strong>{formatDateTime(meeting.startAt)} – {formatDateTime(meeting.endAt)}</strong><p className="m-0 mt-1 text-sm text-muted">{meeting.note || "No note"}</p></div>
                      <Badge tone={meeting.status === "COMPLETED" ? "success" : meeting.status === "CANCELED" ? "danger" : "warning"}>{meeting.status}</Badge>
                    </div>
                    {meeting.evidenceImageUrl && <a className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary" href={meeting.evidenceImageUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View meeting evidence</a>}
                    {meeting.status === "SCHEDULED" && !meeting.evidenceImageUrl && <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" icon={<Edit3 size={14} />} onClick={() => openEdit(meeting)}>Edit</Button>
                      <Button size="sm" variant="danger" icon={<XCircle size={14} />} disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate({ groupId: group.id, meetingId: meeting.id, reason: "Canceled by mentor" })}>Cancel</Button>
                    </div>}
                  </article>
                ))}
              </CardContent>
            </Card>;
          })}
        </div>
      )}

      {showForm && <ResponsiveDialog title={editing ? "Edit mentor meeting" : "Add team & time slot"} description="Meetings last 60 minutes and start at minute 00 or 30." onClose={() => setShowForm(false)} footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="mentor-meeting-form" type="submit" disabled={createMutation.isPending || updateMutation.isPending || !form.startAt || !form.endAt || !form.meetLink.trim() || invalidStartBoundary || invalidDuration}>Save meeting</Button></>}>
        <form id="mentor-meeting-form" className="grid gap-4" onSubmit={submit}>
          <Select label="Team" value={form.groupId} disabled={Boolean(editing)} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))} required>
            {eligibleGroups.map((group) => <option key={group.id} value={group.id}>{group.groupNo} · {group.name} ({counts[group.id] ?? 0}/2)</option>)}
            {editing && !eligibleGroups.some((group) => group.id === editing.groupId) && <option value={editing.groupId}>{editing.groupNo} · {editing.groupName}</option>}
          </Select>
          <HalfHourDateTimeInput error={invalidStartBoundary ? "Choose a time ending in :00 or :30." : undefined} hint="Only times ending in :00 or :30 can be selected." label="Start time" required value={form.startAt} onChange={updateStartAt} />
          <TextInput error={invalidDuration ? "End must be exactly 60 minutes after start." : undefined} hint="Calculated automatically after changing start time" label="End time" type="datetime-local" readOnly value={form.endAt} />
          <TextInput label="Meeting link" placeholder="https://meet.google.com/abc-defg-hij" required type="url" value={form.meetLink} onChange={(event) => setForm((value) => ({ ...value, meetLink: event.target.value }))} />
          <TextInput label="Note (optional)" maxLength={500} value={form.note} onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))} />
        </form>
      </ResponsiveDialog>}
    </div>
  );
}

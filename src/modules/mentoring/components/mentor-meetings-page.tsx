"use client";

import { useMemo, useState } from "react";
import { Edit3, ExternalLink, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useMentorGroups } from "@/modules/groups";
import { Badge, Button, Card, CardContent, CardHeader, EmptyState, LoadingState, PageHeader, ResponsiveDialog, Select, TextInput } from "@/shared/components";
import { ApiError } from "@/shared/lib";
import { useCancelMeeting, useCreateMeeting, useMyMeetings, useUpdateMeeting } from "../hooks";
import type { MentorMeetingDto } from "../types";

function dateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
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

  function openCreate() {
    setEditing(null);
    setForm({ groupId: eligibleGroups[0]?.id.toString() ?? "", startAt: "", endAt: "", meetLink: "", note: "" });
    setShowForm(true);
  }

  function openEdit(meeting: MentorMeetingDto) {
    setEditing(meeting);
    setForm({ groupId: meeting.groupId.toString(), startAt: dateTimeLocal(meeting.startAt), endAt: dateTimeLocal(meeting.endAt), meetLink: meeting.meetLink ?? "", note: meeting.note ?? "" });
    setShowForm(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      meetLink: editing ? form.meetLink.trim() : form.meetLink.trim() || undefined,
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

      {showForm && <ResponsiveDialog title={editing ? "Edit mentor meeting" : "Add team & time slot"} description="Meeting time is required. Link and note are optional." onClose={() => setShowForm(false)} footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button form="mentor-meeting-form" type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Save meeting</Button></>}>
        <form id="mentor-meeting-form" className="grid gap-4" onSubmit={submit}>
          <Select label="Team" value={form.groupId} disabled={Boolean(editing)} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))} required>
            {eligibleGroups.map((group) => <option key={group.id} value={group.id}>{group.groupNo} · {group.name} ({counts[group.id] ?? 0}/2)</option>)}
            {editing && !eligibleGroups.some((group) => group.id === editing.groupId) && <option value={editing.groupId}>{editing.groupNo} · {editing.groupName}</option>}
          </Select>
          <TextInput label="Start time" type="datetime-local" required value={form.startAt} onChange={(event) => setForm((value) => ({ ...value, startAt: event.target.value }))} />
          <TextInput label="End time" type="datetime-local" required value={form.endAt} onChange={(event) => setForm((value) => ({ ...value, endAt: event.target.value }))} />
          <TextInput label="Meeting link (optional)" type="url" value={form.meetLink} onChange={(event) => setForm((value) => ({ ...value, meetLink: event.target.value }))} />
          <TextInput label="Note (optional)" maxLength={500} value={form.note} onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))} />
        </form>
      </ResponsiveDialog>}
    </div>
  );
}

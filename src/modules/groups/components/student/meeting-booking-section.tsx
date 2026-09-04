"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ExternalLink, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { useGroupMeetings, useSubmitMeetingEvidence } from "@/modules/mentoring";
import { Badge, Button, Card, CardContent, CardHeader, EmptyState, LoadingState, TextInput } from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { GroupDetailDto } from "../../types";

type MeetingBookingSectionProps = {
  canBook: boolean;
  group: GroupDetailDto;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MeetingBookingSection({ group }: MeetingBookingSectionProps) {
  const meetingsQuery = useGroupMeetings(group.id);
  const evidenceMutation = useSubmitMeetingEvidence();
  const [evidenceUrls, setEvidenceUrls] = useState<Record<number, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const meetings = useMemo(() => meetingsQuery.data?.data ?? [], [meetingsQuery.data?.data]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  async function submitEvidence(meetingId: number) {
    const imageUrl = evidenceUrls[meetingId]?.trim();
    if (!imageUrl) return;
    try {
      await evidenceMutation.mutateAsync({ groupId: group.id, meetingId, imageUrl });
      toast.success("Meeting evidence submitted. The meeting is now complete.");
      setEvidenceUrls((value) => ({ ...value, [meetingId]: "" }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to submit evidence.");
    }
  }

  return <Card>
    <CardHeader title="Mentor meetings" description={group.mentor ? `Assigned mentor: ${group.mentor.fullName}. Your mentor manages the meeting schedule.` : "A mentor must be assigned before meetings can be reported."} />
    <CardContent>
      {!group.mentor ? <EmptyState title="No mentor assigned" icon={<CalendarClock size={22} />} /> :
       meetingsQuery.isLoading ? <LoadingState title="Loading meeting reports" /> :
       meetingsQuery.isError ? <EmptyState title="Unable to load meeting reports" /> :
       meetings.length === 0 ? <EmptyState title="No meetings yet" description="Meeting times added by your mentor will appear here." /> :
       <div className="grid gap-4">
         {meetings.map((meeting) => {
           const canSubmit = meeting.status === "SCHEDULED" && new Date(meeting.endAt).getTime() <= now;
           return <article className="grid gap-3 rounded-xl border border-border bg-background p-4" key={meeting.id}>
             <div className="flex flex-wrap items-start justify-between gap-3">
               <div><strong className="text-foreground">{formatDateTime(meeting.startAt)} – {formatDateTime(meeting.endAt)}</strong><p className="m-0 mt-1 text-sm text-muted">{meeting.note || "No note"}</p></div>
               <Badge tone={meeting.status === "COMPLETED" ? "success" : meeting.status === "CANCELED" ? "danger" : "warning"}>{meeting.status}</Badge>
             </div>
             {meeting.meetLink && <a className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary" href={meeting.meetLink} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open meeting link</a>}
             {meeting.evidenceImageUrl ? <div className="grid gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
               <span>Evidence submitted by {meeting.evidenceSubmittedByStudentName ?? "a group member"}.</span>
               <a className="inline-flex items-center gap-1 font-semibold" href={meeting.evidenceImageUrl} target="_blank" rel="noreferrer"><ImageIcon size={14} /> View evidence image</a>
             </div> : canSubmit ? <div className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
               <TextInput label="Evidence image URL" type="url" placeholder="https://..." value={evidenceUrls[meeting.id] ?? ""} onChange={(event) => setEvidenceUrls((value) => ({ ...value, [meeting.id]: event.target.value }))} />
               <Button className="w-fit" size="sm" disabled={!evidenceUrls[meeting.id]?.trim() || evidenceMutation.isPending} onClick={() => submitEvidence(meeting.id)}>Submit evidence & complete</Button>
             </div> : meeting.status === "SCHEDULED" ? <p className="m-0 text-xs text-muted">Evidence can be submitted by any active member after the meeting ends.</p> : null}
             {meeting.cancelReason && <p className="m-0 text-sm text-red-700">Reason: {meeting.cancelReason}</p>}
           </article>;
         })}
       </div>}
    </CardContent>
  </Card>;
}

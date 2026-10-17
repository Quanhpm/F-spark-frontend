"use client";

import { toast } from "sonner";

import { Button, ResponsiveDialog } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useConfirmMeeting } from "../hooks";
import type { MentorMeetingDto } from "../types";
import { formatMentorIdentity } from "./availability-calendar.utils";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ConfirmMeetingDialog({
  meeting,
  onClose,
}: {
  meeting: MentorMeetingDto;
  onClose: () => void;
}) {
  const confirmMutation = useConfirmMeeting();

  async function confirm() {
    try {
      const response = await confirmMutation.mutateAsync({
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
      className="min-[761px]:max-w-[540px]"
      description={`${meeting.groupNo} · ${meeting.groupName} · Mentor: ${formatMentorIdentity(meeting)}`}
      footer={(
        <>
          <Button disabled={confirmMutation.isPending} onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button disabled={confirmMutation.isPending} onClick={() => void confirm()}>
            {confirmMutation.isPending ? "Confirming..." : "Confirm meeting"}
          </Button>
        </>
      )}
      onClose={onClose}
      title="Confirm this meeting happened?"
    >
      <div className="grid gap-3 text-sm leading-6 text-muted">
        <p className="m-0">
          Meeting time: {formatDateTime(meeting.startAt)}–{formatDateTime(meeting.endAt)}.
        </p>
        <p className="m-0">
          {meeting.evidenceImageUrl
            ? "Student evidence is already available. Confirming will complete this meeting."
            : "Student evidence has not been submitted yet. The meeting will remain open until evidence is received."}
        </p>
      </div>
    </ResponsiveDialog>
  );
}

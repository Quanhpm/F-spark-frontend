"use client";

import { toast } from "sonner";

import { Button, ResponsiveDialog } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useUndoMeetingConfirmation } from "../hooks";
import type { MentorMeetingDto } from "../types";
import { formatMentorIdentity } from "./availability-calendar.utils";

export function UndoMeetingConfirmationDialog({
  meeting,
  onClose,
}: {
  meeting: MentorMeetingDto;
  onClose: () => void;
}) {
  const undoMutation = useUndoMeetingConfirmation();

  async function undoConfirmation() {
    try {
      await undoMutation.mutateAsync({
        groupId: meeting.groupId,
        meetingId: meeting.id,
      });
      toast.success("Mentor confirmation removed. The meeting is awaiting confirmation again.");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to undo the mentor confirmation.",
      );
    }
  }

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[540px]"
      description={`${meeting.groupNo} · ${meeting.groupName} · Mentor: ${formatMentorIdentity(meeting)}`}
      footer={(
        <>
          <Button disabled={undoMutation.isPending} onClick={onClose} variant="secondary">
            Keep confirmation
          </Button>
          <Button
            disabled={undoMutation.isPending}
            onClick={() => void undoConfirmation()}
            variant="danger"
          >
            {undoMutation.isPending ? "Removing..." : "Undo confirmation"}
          </Button>
        </>
      )}
      onClose={onClose}
      title="Undo mentor confirmation?"
    >
      <div className="grid gap-3 text-sm leading-6 text-muted">
        <p className="m-0">
          The student evidence will be kept. This meeting will wait for mentor confirmation again.
        </p>
        {meeting.status === "COMPLETED" && (
          <p className="m-0 font-medium text-foreground">
            The meeting will change from Completed to Awaiting mentor confirmation.
          </p>
        )}
      </div>
    </ResponsiveDialog>
  );
}

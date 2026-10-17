"use client";

import { RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button, ResponsiveDialog } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useReopenMeeting } from "../hooks";
import type { MentorMeetingDto } from "../types";
import { formatMentorIdentity } from "./availability-calendar.utils";

const MAX_REASON_LENGTH = 500;

export function ReopenMeetingDialog({
  meeting,
  onClose,
}: {
  meeting: MentorMeetingDto;
  onClose: () => void;
}) {
  const reopenMutation = useReopenMeeting();
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const normalizedReason = reason.trim();

  async function submit() {
    if (!normalizedReason) {
      setError("Reopen reason is required.");
      return;
    }

    setError("");
    try {
      await reopenMutation.mutateAsync({
        groupId: meeting.groupId,
        meetingId: meeting.id,
        reason: normalizedReason,
      });
      toast.success("Meeting reopened. You can now cancel it.");
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to reopen the meeting. Please try again.",
      );
    }
  }

  function close() {
    if (!reopenMutation.isPending) onClose();
  }

  return (
    <ResponsiveDialog
      closeOnBackdrop={!reopenMutation.isPending}
      closeOnEscape={!reopenMutation.isPending}
      description={`Group ${meeting.groupNo} · ${meeting.groupName} · Mentor: ${formatMentorIdentity(meeting)}`}
      footer={(
        <>
          <Button disabled={reopenMutation.isPending} onClick={close} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={reopenMutation.isPending || !normalizedReason}
            icon={<RotateCcw size={16} />}
            onClick={() => void submit()}
          >
            {reopenMutation.isPending ? "Reopening..." : "Reopen meeting"}
          </Button>
        </>
      )}
      onClose={close}
      title="Undo completion"
    >
      <div className="grid gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
          The current evidence will be removed from this meeting and archived in its reopen history.
          The availability slot remains booked until the meeting owner cancels it.
        </div>

        <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor={reasonId}>
          Reason for reopening
          <textarea
            aria-label="Reason for reopening"
            autoFocus
            className="min-h-28 w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10"
            id={reasonId}
            maxLength={MAX_REASON_LENGTH}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError("");
            }}
            placeholder="Explain why this completed meeting needs to be reopened"
            value={reason}
          />
          <span className="text-right text-xs font-normal text-muted">
            {reason.length}/{MAX_REASON_LENGTH}
          </span>
        </label>

        {error && (
          <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </ResponsiveDialog>
  );
}

import { FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button, ResponsiveDialog } from "@/shared/components";
import type { ProblemStatus, EntityId } from "@/shared/types";
import { useReviewProblemAsInstructor } from "../hooks/use-problem-mutations";

type InstructorReviewProposalModalProps = {
  problemId: EntityId;
  problemTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function InstructorReviewProposalModal({
  problemId,
  problemTitle,
  onClose,
  onSuccess,
}: InstructorReviewProposalModalProps) {
  const formId = useId();
  const [status, setStatus] = useState<ProblemStatus>("APPROVED");
  const [comment, setComment] = useState("");

  const reviewMutation = useReviewProblemAsInstructor(problemId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (status === "REJECTED" && !comment.trim()) {
      toast.error("Please provide a reason or comment when rejecting a proposal.");
      return;
    }

    reviewMutation.mutate(
      {
        status,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
      }
    );
  };

  return (
    <ResponsiveDialog
      bodyClassName="p-0"
      className="min-[761px]:max-w-[520px]"
      closeLabel="Close proposal review"
      closeOnBackdrop={false}
      description="Approve or reject this proposal and optionally leave feedback."
      footer={
        <>
          <Button
            disabled={reviewMutation.isPending}
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={reviewMutation.isPending}
            form={formId}
            type="submit"
          >
            {reviewMutation.isPending ? "Submitting..." : "Save Review"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title="Instructor Review Proposal"
    >
          <form className="grid gap-4 p-4 min-[481px]:p-6" id={formId} onSubmit={handleSubmit}>
            <div>
              <span className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Topic Title</span>
              <div className="rounded-xl border border-border bg-background p-3 text-sm font-semibold leading-snug text-foreground">
                {problemTitle}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
                Review Decision
              </label>
              <div className="flex gap-4">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-brand-primary">
                  <input
                    type="radio"
                    name="status"
                    value="APPROVED"
                    checked={status === "APPROVED"}
                    onChange={() => setStatus("APPROVED")}
                    className="size-4.5 cursor-pointer accent-brand-primary"
                  />
                  Approve Proposal
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-red-700">
                  <input
                    type="radio"
                    name="status"
                    value="REJECTED"
                    checked={status === "REJECTED"}
                    onChange={() => setStatus("REJECTED")}
                    className="size-4.5 accent-red-600 cursor-pointer"
                  />
                  Reject Proposal
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
                Review Comment / Feedback {status === "REJECTED" && "*"}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  status === "APPROVED"
                    ? "Optionally add approval comments..."
                    : "Describe why this proposal was rejected..."
                }
                required={status === "REJECTED"}
                className="w-full rounded-xl border border-border bg-surface p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none min-h-[90px]"
              />
            </div>

          </form>
    </ResponsiveDialog>
  );
}

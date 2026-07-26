import { FormEvent, useId, useState } from "react";
import { Button, ResponsiveDialog } from "@/shared/components";
import type { ProblemStatus, EntityId } from "@/shared/types";
import { useReviewProblem } from "../hooks/use-problem-mutations";

type ReviewProposalModalProps = {
  problemId: EntityId;
  problemTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ReviewProposalModal({
  problemId,
  problemTitle,
  onClose,
  onSuccess,
}: ReviewProposalModalProps) {
  const [status, setStatus] = useState<ProblemStatus>("APPROVED");
  const [comment, setComment] = useState("");
  const formId = useId();

  const reviewMutation = useReviewProblem(problemId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (status === "REJECTED" && !comment.trim()) {
      alert("Please provide a reason / comment when rejecting a proposal.");
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
      className="min-[761px]:max-w-[480px]"
      closeOnBackdrop={false}
      description="Approve the proposal or return it with clear feedback."
      footer={
        <>
          <Button
            disabled={reviewMutation.isPending}
            onClick={onClose}
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
      onClose={onClose}
      title="Review Proposed Topic"
    >
          <form
            className="grid gap-4 p-4 min-[481px]:p-6"
            id={formId}
            onSubmit={handleSubmit}
          >
            <div>
              <span className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Topic Title</span>
              <div className="break-words rounded-xl border border-border/60 bg-neutral-50/50 p-3 text-sm leading-snug font-semibold text-foreground">
                {problemTitle}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Review Decision
              </label>
              <div className="flex flex-wrap gap-3 max-[480px]:grid">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-green-700">
                  <input
                    type="radio"
                    name="status"
                    value="APPROVED"
                    checked={status === "APPROVED"}
                    onChange={() => setStatus("APPROVED")}
                    className="size-4.5 accent-green-600 cursor-pointer"
                  />
                  Approve Proposal
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-red-700">
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
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Review Comment / Feedback {status === "REJECTED" && "*"}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  status === "APPROVED"
                    ? "Optionally add approval comments (e.g. Mentor assignments)..."
                    : "Describe required fixes, why this proposal was rejected..."
                }
                required={status === "REJECTED"}
                className="min-h-[90px] w-full rounded-xl border border-border bg-surface p-3 text-base outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary min-[761px]:text-sm"
              />
            </div>
          </form>
    </ResponsiveDialog>
  );
}

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components";
import type { ProblemStatus, EntityId } from "@/shared/types";
import { useReviewProblemAsInstructor } from "../hooks/use-problem-mutations";
import { X } from "lucide-react";

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
    <>
      <div className="fixed inset-0 z-45 bg-[rgba(26,26,26,0.36)]" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 grid place-items-center p-6 pointer-events-none">
        <div className="grid w-[min(480px,100%)] max-h-[85vh] grid-rows-[auto_1fr_auto] overflow-hidden rounded-2xl border border-border bg-surface shadow-modal pointer-events-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-base">
            <h3 className="m-0 text-base font-bold text-foreground">
              Instructor Review Proposal
            </h3>
            <Button
              variant="secondary"
              onClick={onClose}
              className="size-8 p-0 rounded-lg"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <span className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Topic Title</span>
              <div className="text-sm font-semibold text-foreground p-3 bg-neutral-50/50 rounded-xl border border-border/60 leading-snug">
                {problemTitle}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Review Decision
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-green-700">
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
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
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

            {/* Buttons */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={reviewMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={reviewMutation.isPending}>
                {reviewMutation.isPending ? "Submitting..." : "Save Review"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button, ResponsiveDialog } from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { EntityId } from "@/shared/types";
import { useDeletePendingGroupProposal } from "../hooks";
import type { ProblemSummaryDto } from "../types";

type DeleteProposalDialogProps = {
  groupId: EntityId;
  onClose: () => void;
  problem: ProblemSummaryDto;
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "The proposal could not be deleted. Please try again.";
}

export function DeleteProposalDialog({
  groupId,
  onClose,
  problem,
}: DeleteProposalDialogProps) {
  const deleteMutation = useDeletePendingGroupProposal(groupId);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");

    try {
      await deleteMutation.mutateAsync(problem.id);
      toast.success("Proposal deleted successfully.");
      onClose();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  return (
    <ResponsiveDialog
      bodyClassName="grid flex-none gap-4"
      className="min-[761px]:max-w-[520px] [&>footer]:border-t-0 [&>header]:border-b-0"
      description="This permanently removes the pending proposal before instructor review."
      footer={
        <>
          <Button
            disabled={deleteMutation.isPending}
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={deleteMutation.isPending}
            icon={<Trash2 className="size-4" />}
            onClick={() => void handleDelete()}
            variant="danger"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete proposal"}
          </Button>
        </>
      }
      onClose={onClose}
      title="Delete pending proposal?"
    >
      <p className="m-0 break-words text-sm leading-relaxed text-foreground">
        You are about to delete <strong>{problem.title}</strong>. This action
        cannot be undone.
      </p>
      {error && (
        <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </ResponsiveDialog>
  );
}

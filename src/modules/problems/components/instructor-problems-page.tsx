"use client";

import { useState } from "react";
import {
  Button,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/shared/components";
import type { EntityId } from "@/shared/types";
import { useInstructorPendingProblems } from "../hooks";
import { ProblemDifficultyBadge } from "./problem-difficulty-badge";
import { ProblemStatusBadge } from "./problem-status-badge";
import { ProblemDetailModal } from "./problem-detail-modal";
import { InstructorReviewProposalModal } from "./instructor-review-proposal-modal";
// No icons needed from lucide-react

export function InstructorProblemsPage() {
  // Modals state
  const [selectedProblemId, setSelectedProblemId] = useState<EntityId | null>(null);
  
  // Review modal
  const [activeReviewProblemId, setActiveReviewProblemId] = useState<EntityId | null>(null);
  const [activeReviewProblemTitle, setActiveReviewProblemTitle] = useState("");

  const { data: problemsResponse, isLoading } = useInstructorPendingProblems();
  const problems = problemsResponse?.data ?? [];

  const handleOpenReview = (id: EntityId, title: string) => {
    setSelectedProblemId(null);
    setActiveReviewProblemId(id);
    setActiveReviewProblemTitle(title);
  };

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Review Topic Proposals"
          description="Review thesis topic proposals submitted by student groups assigned to you."
        />
      </div>

      {isLoading ? (
        <LoadingState title="Loading proposed topics..." />
      ) : problems && problems.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface-base">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Code</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground font-semibold">Title</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Domain</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Difficulty</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Source</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {problems.map((prob) => (
                  <tr
                    key={prob.id}
                    onClick={() => setSelectedProblemId(prob.id)}
                    className="hover:bg-neutral-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-muted">
                      {prob.code || "PROPOSAL"}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-foreground max-w-xs truncate">
                      {prob.title}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {prob.domainCode}
                    </td>
                    <td className="px-5 py-3.5">
                      <ProblemDifficultyBadge difficulty={prob.difficultyLevel} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                        Proposal
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ProblemStatusBadge status={prob.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleOpenReview(prob.id, prob.title)}
                          className="h-8 text-xs px-2.5 rounded-lg"
                        >
                          Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No proposed topics"
          description="There are no self-proposed topics waiting for your review."
        />
      )}

      {/* Details Modal */}
      {selectedProblemId !== null && (
        <ProblemDetailModal
          problemId={selectedProblemId}
          onClose={() => setSelectedProblemId(null)}
          isGroupLeader={false}
          currentGroupId={undefined}
          selectedProblemId={null}
        />
      )}

      {/* Review Modal */}
      {activeReviewProblemId !== null && (
        <InstructorReviewProposalModal
          problemId={activeReviewProblemId}
          problemTitle={activeReviewProblemTitle}
          onClose={() => setActiveReviewProblemId(null)}
        />
      )}
    </div>
  );
}

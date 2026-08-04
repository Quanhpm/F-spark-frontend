"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
} from "@/shared/components";
import type { ProblemDifficulty, ProblemSourceType, EntityId, ProblemStatus } from "@/shared/types";
import { useAuthStore } from "@/modules/auth";
import {
  resolveActiveGroup,
  useActiveGroupStore,
} from "@/modules/groups";
import { useMyGroups, useGroupDetails } from "@/modules/projects/hooks";
import { useGroupProposals, useProblems } from "../hooks";
import type { ProblemSummaryDto } from "../types";
import { ProblemCard } from "./problem-card";
import { ProblemDifficultyBadge } from "./problem-difficulty-badge";
import { ProblemFilters } from "./problem-filters";
import { ProblemDetailModal } from "./problem-detail-modal";
import { ProblemStatusBadge } from "./problem-status-badge";
import { ProposeProblemForm } from "./propose-problem-form";
import { Archive, Pencil, Plus } from "lucide-react";

type ProposalArchiveItemProps = {
  canEdit: boolean;
  onEdit: () => void;
  onView: () => void;
  problem: ProblemSummaryDto;
};

function ProposalArchiveItem({
  canEdit,
  onEdit,
  onView,
  problem,
}: ProposalArchiveItemProps) {
  return (
    <article className="grid min-w-0 gap-3 rounded-xl border border-border bg-background p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ProblemDifficultyBadge difficulty={problem.difficultyLevel} />
          <span className="break-all rounded bg-surface px-2 py-1 font-mono text-[11px] font-bold text-muted">
            {problem.code || "PROPOSAL"}
          </span>
        </div>
        <ProblemStatusBadge status={problem.status} size="sm" />
      </div>

      <div className="grid min-w-0 gap-1">
        <h3 className="m-0 break-words text-sm font-bold leading-snug text-foreground">
          {problem.title}
        </h3>
        <p className="m-0 break-words text-xs text-muted">
          {problem.domainName} ({problem.domainCode})
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2 max-[480px]:grid max-[480px]:grid-cols-1">
        <Button onClick={onView} size="sm" variant="secondary">
          View Details
        </Button>
        {canEdit && (
          <Button icon={<Pencil className="size-4" />} onClick={onEdit} size="sm">
            Edit
          </Button>
        )}
      </div>
    </article>
  );
}

export function StudentProblemsPage() {
  const session = useAuthStore((state) => state.session);

  // Filters State
  const [search, setSearch] = useState("");
  const [domainCode, setDomainCode] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sourceType, setSourceType] = useState<string>("");
  const [page, setPage] = useState(0);
  const selectedGroupId = useActiveGroupStore((state) => state.activeGroupId);

  // Modals / Overlays state
  const [selectedProblemId, setSelectedProblemId] = useState<EntityId | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isProposing, setIsProposing] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<EntityId | null>(null);

  // Student Group queries
  const { data: myGroupsResponse } = useMyGroups();
  const myGroups = myGroupsResponse?.data;

  const activeGroup = resolveActiveGroup(myGroups ?? [], selectedGroupId);

  const activeGroupId = activeGroup?.id;
  const { data: groupDetailsResponse } = useGroupDetails(activeGroupId || 0);
  const group = groupDetailsResponse?.data;

  const {
    data: proposalsResponse,
    isLoading: isProposalsLoading,
    isError: isProposalsError,
    refetch: refetchProposals,
  } = useGroupProposals(activeGroupId || 0);
  const groupProposals = proposalsResponse?.data ?? [];
  const hasReachedProposalLimit = groupProposals.length >= 3;

  // Check if current user is Group Leader
  const isGroupLeader = useMemo(() => {
    if (!group || !session?.user) return false;
    return group.leader.email === session.user.email;
  }, [group, session]);

  // Problem Bank query
  const problemsQuery = {
    search: search || undefined,
    domainCode: domainCode || undefined,
    difficulty: difficulty ? (difficulty as ProblemDifficulty) : undefined,
    sourceType: sourceType ? (sourceType as ProblemSourceType) : undefined,
    status: "ACTIVE" as ProblemStatus, // Students can only view ACTIVE problems
    page,
    size: 9,
  };

  const {
    data: problemsResponse,
    isFetching: isProblemsFetching,
    isLoading: isProblemsLoading,
  } = useProblems(problemsQuery, { keepPreviousPage: true });
  const problems = problemsResponse?.data;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSelectedProblemId(null);
    setIsArchiveOpen(false);
    setIsProposing(false);
    setEditingProblemId(null);
    setPage(0);
  }, [activeGroupId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Problem Bank"
          description="Browse official research topics or propose custom ideas for your graduation thesis."
        />

        {activeGroupId && isGroupLeader &&
          (isProposalsLoading ? (
            <Button className="max-[480px]:w-full" disabled size="md">
              Loading proposals...
            </Button>
          ) : isProposalsError ? (
            <Button className="max-[480px]:w-full" disabled size="md">
              Proposal status unavailable
            </Button>
          ) : hasReachedProposalLimit ? (
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-bold text-muted">
              3/3 proposals submitted
            </span>
          ) : (
            <Button
              className="max-[480px]:w-full"
              icon={<Plus className="size-4" />}
              onClick={() => setIsProposing(true)}
              size="md"
            >
              Propose Custom Topic ({groupProposals.length}/3)
            </Button>
          ))}
      </div>

      {activeGroup && (
        <Card isPadded>
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-muted">
              Current group context
            </p>
            <h2 className="mt-1 mb-0 break-words text-lg font-bold text-foreground">
              {activeGroup.groupNo} - {activeGroup.name}
            </h2>
            <p className="mt-1 mb-0 break-words text-sm text-muted">
              {activeGroup.courseCode} · {activeGroup.term}
            </p>
          </div>
        </Card>
      )}

      {/* Selected problem summary */}
      {activeGroup && (
        <Card className="border-l-4 border-l-brand-primary bg-brand-primary/5 shadow-sm">
          <CardHeader
            actions={
              <Button
                icon={<Archive className="size-4" />}
                onClick={() => setIsArchiveOpen(true)}
                size="sm"
                variant="secondary"
              >
                Archived Problem Bank ({groupProposals.length})
              </Button>
            }
            description="The problem currently assigned to your group."
            title="Selected Problem"
          />
          <CardContent>
            {activeGroup.selectedProblem ? (
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
                <div className="grid min-w-0 gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="break-all rounded bg-surface px-2 py-1 font-mono text-[11px] font-bold text-muted">
                      {activeGroup.selectedProblem.code || "PROBLEM"}
                    </span>
                    <ProblemStatusBadge
                      status={activeGroup.selectedProblem.status as ProblemStatus}
                      size="sm"
                    />
                    <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                      {activeGroup.selectedProblem.sourceType.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="m-0 break-words text-lg font-bold leading-snug text-foreground">
                    {activeGroup.selectedProblem.title}
                  </h3>
                </div>
                <Button
                  className="max-[480px]:w-full"
                  onClick={() =>
                    setSelectedProblemId(activeGroup.selectedProblem!.id)
                  }
                  size="sm"
                  variant="secondary"
                >
                  View Details
                </Button>
              </div>
            ) : (
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-surface p-4">
                <div className="min-w-0">
                  <p className="m-0 text-sm font-bold text-foreground">
                    No problem selected yet
                  </p>
                  <p className="mt-1 mb-0 break-words text-xs leading-relaxed text-muted">
                    Choose an active problem below or wait for a proposal decision.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <ProblemFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(0);
        }}
        domainCode={domainCode}
        onDomainChange={(val) => {
          setDomainCode(val);
          setPage(0);
        }}
        difficulty={difficulty}
        onDifficultyChange={(val) => {
          setDifficulty(val);
          setPage(0);
        }}
        sourceType={sourceType}
        onSourceTypeChange={(val) => {
          setSourceType(val);
          setPage(0);
        }}
      />

      {/* Problem list grid */}
      {isProblemsLoading ? (
        <LoadingState title="Loading problem bank..." />
      ) : problems?.content && problems.content.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {problems.content.map((prob) => (
              <ProblemCard
                key={prob.id}
                problem={prob}
                isSelected={
                  !!(activeGroup?.selectedProblem &&
                  Number(activeGroup.selectedProblem.id) === Number(prob.id))
                }
                onClick={() => setSelectedProblemId(prob.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {problems.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4 max-[480px]:grid">
              <span className="break-words text-xs font-medium text-muted">
                Page {problems.page + 1} of {problems.totalPages} ({problems.totalElements} topics)
              </span>
              <div className="flex gap-2 max-[480px]:grid max-[480px]:grid-cols-2 max-[480px]:[&>button]:min-h-11 max-[480px]:[&>button]:min-w-0">
                <Button
                  disabled={isProblemsFetching || problems.page === 0}
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage(problems.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  disabled={
                    isProblemsFetching ||
                    problems.page >= problems.totalPages - 1
                  }
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage(problems.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No topics found"
          description="Try adjusting your filters or search terms."
        />
      )}

      {/* Archived proposals dialog */}
      {isArchiveOpen && activeGroup && (
        <ResponsiveDialog
          className="min-[761px]:max-w-[760px]"
          closeLabel="Close archived problem bank"
          description={`${groupProposals.length}/3 problem ideas submitted by your group.`}
          footer={
            <Button onClick={() => setIsArchiveOpen(false)} variant="secondary">
              Close
            </Button>
          }
          mobileMode="fullscreen"
          onClose={() => setIsArchiveOpen(false)}
          title="Archived Problem Bank"
        >
          {isProposalsLoading ? (
            <LoadingState title="Loading proposal archive..." />
          ) : isProposalsError ? (
            <div className="grid min-h-32 place-items-center rounded-xl border border-red-200 bg-red-50 p-5 text-center">
              <div className="grid gap-3">
                <p className="m-0 text-sm text-red-800">
                  The proposal archive could not be loaded.
                </p>
                <Button
                  onClick={() => void refetchProposals()}
                  size="sm"
                  variant="secondary"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : groupProposals.length > 0 ? (
            <div className="grid min-w-0 gap-3">
              {groupProposals.map((proposal) => (
                <ProposalArchiveItem
                  canEdit={
                    isGroupLeader && proposal.status === "PENDING_REVIEW"
                  }
                  key={proposal.id}
                  onEdit={() => {
                    setIsArchiveOpen(false);
                    setEditingProblemId(proposal.id);
                  }}
                  onView={() => {
                    setIsArchiveOpen(false);
                    setSelectedProblemId(proposal.id);
                  }}
                  problem={proposal}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-border bg-background p-5 text-center">
              <div>
                <Archive className="mx-auto size-5 text-muted" />
                <p className="mt-2 mb-0 text-sm font-bold text-foreground">
                  No proposals submitted
                </p>
                <p className="mt-1 mb-0 text-xs leading-relaxed text-muted">
                  Your group can submit up to three problem ideas.
                </p>
              </div>
            </div>
          )}
        </ResponsiveDialog>
      )}

      {/* Details Modal */}
      {selectedProblemId !== null && (
        <ProblemDetailModal
          problemId={selectedProblemId}
          onClose={() => setSelectedProblemId(null)}
          isGroupLeader={isGroupLeader}
          currentGroupId={activeGroupId}
          selectedProblemId={activeGroup?.selectedProblem ? activeGroup.selectedProblem.id : null}
        />
      )}

      {/* Propose Form Modal */}
      {isProposing && activeGroupId && (
        <ProposeProblemForm
          groupId={activeGroupId}
          onClose={() => setIsProposing(false)}
        />
      )}

      {/* Edit pending proposal form */}
      {editingProblemId !== null && activeGroupId && (
        <ProposeProblemForm
          groupId={activeGroupId}
          onClose={() => setEditingProblemId(null)}
          problemId={editingProblemId}
        />
      )}
    </div>
  );
}

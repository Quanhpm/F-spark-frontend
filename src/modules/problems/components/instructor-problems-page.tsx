"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  TextInput,
} from "@/shared/components";
import type { EntityId, ProblemStatus } from "@/shared/types";

import { useInstructorProposalGroups } from "../hooks";
import type { ProblemSummaryDto } from "../types";
import { InstructorReviewProposalModal } from "./instructor-review-proposal-modal";
import { ProblemDetailModal } from "./problem-detail-modal";
import { ProblemDifficultyBadge } from "./problem-difficulty-badge";
import { ProblemStatusBadge } from "./problem-status-badge";

const STATUS_OPTIONS: Array<{ label: string; value: "" | ProblemStatus }> = [
  { label: "All statuses", value: "" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

type ProposalActionsProps = {
  onReview: () => void;
  onView: () => void;
  problem: ProblemSummaryDto;
};

function ProposalActions({
  onReview,
  onView,
  problem,
}: ProposalActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2 max-[480px]:grid max-[480px]:grid-cols-1">
      <Button onClick={onView} size="sm" variant="secondary">
        View Details
      </Button>
      {problem.status === "PENDING_REVIEW" && (
        <Button onClick={onReview} size="sm">
          Review
        </Button>
      )}
    </div>
  );
}

type ProposalTableProps = {
  onReview: (problem: ProblemSummaryDto) => void;
  onView: (problem: ProblemSummaryDto) => void;
  problems: ProblemSummaryDto[];
};

function ProposalTable({ onReview, onView, problems }: ProposalTableProps) {
  return (
    <>
      <div className="overflow-x-auto max-[760px]:hidden">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Code
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Problem
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Domain
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Difficulty
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {problems.map((problem) => (
              <tr className="align-middle hover:bg-background/70" key={problem.id}>
                <td className="px-4 py-3 font-mono text-xs font-bold text-muted">
                  {problem.code || "PROPOSAL"}
                </td>
                <td className="max-w-sm px-4 py-3">
                  <button
                    className="min-w-0 break-words text-left font-bold text-foreground transition-colors hover:text-brand-primary"
                    onClick={() => onView(problem)}
                    type="button"
                  >
                    {problem.title}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted">
                  <span className="break-words">
                    {problem.domainName} ({problem.domainCode})
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ProblemDifficultyBadge difficulty={problem.difficultyLevel} />
                </td>
                <td className="px-4 py-3">
                  <ProblemStatusBadge status={problem.status} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <ProposalActions
                    onReview={() => onReview(problem)}
                    onView={() => onView(problem)}
                    problem={problem}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden min-w-0 gap-3 max-[760px]:grid">
        {problems.map((problem) => (
          <article
            className="grid min-w-0 gap-3 rounded-xl border border-border bg-background p-4"
            key={problem.id}
          >
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span className="break-all rounded bg-surface px-2 py-1 font-mono text-[11px] font-bold text-muted">
                {problem.code || "PROPOSAL"}
              </span>
              <ProblemStatusBadge status={problem.status} size="sm" />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <button
                className="break-words text-left text-sm font-bold text-foreground"
                onClick={() => onView(problem)}
                type="button"
              >
                {problem.title}
              </button>
              <p className="m-0 break-words text-xs text-muted">
                {problem.domainName} ({problem.domainCode})
              </p>
              <div>
                <ProblemDifficultyBadge difficulty={problem.difficultyLevel} />
              </div>
            </div>
            <ProposalActions
              onReview={() => onReview(problem)}
              onView={() => onView(problem)}
              problem={problem}
            />
          </article>
        ))}
      </div>
    </>
  );
}

export function InstructorProblemsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ProblemStatus>("");
  const [selectedProblemId, setSelectedProblemId] = useState<EntityId | null>(
    null,
  );
  const [activeReviewProblemId, setActiveReviewProblemId] =
    useState<EntityId | null>(null);
  const [activeReviewProblemTitle, setActiveReviewProblemTitle] = useState("");

  const {
    data: proposalGroups,
    isError,
    isLoading,
    refetch,
  } = useInstructorProposalGroups();
  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return proposalGroups
      .filter(({ group }) => {
        if (!normalizedSearch) return true;

        return [group.name, group.groupNo, String(group.id)].some((value) =>
          value.toLocaleLowerCase().includes(normalizedSearch),
        );
      })
      .map(({ group, proposals }) => ({
        group,
        proposals: status
          ? proposals.filter((problem) => problem.status === status)
          : proposals,
        totalProposals: proposals.length,
      }))
      .filter(({ proposals }) => proposals.length > 0);
  }, [proposalGroups, search, status]);

  function openReview(problem: ProblemSummaryDto) {
    setSelectedProblemId(null);
    setActiveReviewProblemId(problem.id);
    setActiveReviewProblemTitle(problem.title);
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Review and revisit topic proposals from your assigned student groups."
        title="Review Topic Proposals"
      />

      <Card isPadded>
        <div className="grid min-w-0 grid-cols-[minmax(240px,1fr)_minmax(190px,260px)] gap-3 max-[760px]:grid-cols-1">
          <TextInput
            icon={<Search className="size-4" />}
            label="Search group"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by group name, number, or ID..."
            value={search}
          />
          <label className="grid min-w-0 gap-[7px]">
            <span className="text-[13px] font-medium text-foreground">
              Status
            </span>
            <Select
              onChange={(event) =>
                setStatus(event.target.value as "" | ProblemStatus)
              }
              value={status}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState title="Loading group proposals..." />
      ) : isError ? (
        <Card isPadded>
          <div className="grid min-h-32 place-items-center text-center">
            <div className="grid gap-3">
              <p className="m-0 text-sm text-red-800">
                Group proposal history could not be loaded.
              </p>
              <Button
                onClick={() => void refetch()}
                size="sm"
                variant="secondary"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      ) : filteredGroups.length > 0 ? (
        <div className="grid min-w-0 gap-5">
          {filteredGroups.map(({ group, proposals, totalProposals }) => (
            <Card key={group.id}>
              <CardHeader
                actions={
                  <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-muted">
                    {proposals.length}/{totalProposals} proposals
                  </span>
                }
                description={`Group ID: ${group.id}`}
                title={`${group.groupNo} - ${group.name}`}
              />
              <CardContent className="p-0 max-[760px]:p-4">
                <ProposalTable
                  onReview={openReview}
                  onView={(problem) => setSelectedProblemId(problem.id)}
                  problems={proposals}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          description="Try another group name or status filter."
          title="No matching proposals"
        />
      )}

      {selectedProblemId !== null && (
        <ProblemDetailModal
          currentGroupId={undefined}
          isGroupLeader={false}
          onClose={() => setSelectedProblemId(null)}
          problemId={selectedProblemId}
          selectedProblemId={null}
        />
      )}

      {activeReviewProblemId !== null && (
        <InstructorReviewProposalModal
          onClose={() => setActiveReviewProblemId(null)}
          problemId={activeReviewProblemId}
          problemTitle={activeReviewProblemTitle}
        />
      )}
    </div>
  );
}

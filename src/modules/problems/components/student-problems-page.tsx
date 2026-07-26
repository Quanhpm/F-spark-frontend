"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/shared/components";
import type { ProblemDifficulty, ProblemSourceType, EntityId, ProblemStatus } from "@/shared/types";
import { useAuthStore } from "@/modules/auth";
import { useMyGroups, useGroupDetails } from "@/modules/projects/hooks";
import { useProblems } from "../hooks";
import { ProblemCard } from "./problem-card";
import { ProblemFilters } from "./problem-filters";
import { ProblemDetailModal } from "./problem-detail-modal";
import { ProposeProblemForm } from "./propose-problem-form";
import { Plus } from "lucide-react";

export function StudentProblemsPage() {
  const session = useAuthStore((state) => state.session);

  // Filters State
  const [search, setSearch] = useState("");
  const [domainCode, setDomainCode] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sourceType, setSourceType] = useState<string>("");
  const [page, setPage] = useState(0);

  // Modals / Overlays state
  const [selectedProblemId, setSelectedProblemId] = useState<EntityId | null>(null);
  const [isProposing, setIsProposing] = useState(false);

  // Student Group queries
  const { data: myGroupsResponse } = useMyGroups();
  const myGroups = myGroupsResponse?.data;
  
  const activeGroup = useMemo(() => {
    const groups = myGroups || [];
    return groups.find((g) => g.status === "ACTIVE");
  }, [myGroups]);

  const activeGroupId = activeGroup?.id;
  const { data: groupDetailsResponse } = useGroupDetails(activeGroupId || 0);
  const group = groupDetailsResponse?.data;

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

  const { data: problemsResponse, isLoading: isProblemsLoading } = useProblems(problemsQuery);
  const problems = problemsResponse?.data;

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Problem Bank"
          description="Browse official research topics or propose custom ideas for your graduation thesis."
        />

        {activeGroupId && isGroupLeader && (
          <Button
            className="max-[480px]:w-full"
            onClick={() => setIsProposing(true)}
            size="md"
          >
            <Plus className="size-4 mr-1.5" />
            <span>Propose Custom Topic</span>
          </Button>
        )}
      </div>

      {/* Selected Problem Highlight Card */}
      {activeGroup && (
        <Card className="border-l-4 border-l-brand-primary shadow-sm bg-brand-primary/5">
          <CardHeader
            title={activeGroup.selectedProblem ? activeGroup.selectedProblem.title : "No Topic Selected Yet"}
            description={
              activeGroup.selectedProblem
                ? `Your group is working on official topic ${activeGroup.selectedProblem.code || ""}.`
                : "Your group hasn't chosen an official topic. Choose one below or submit a proposal."
            }
          />
          
          {activeGroup.selectedProblem && (
            <CardContent className="pt-0">
              <div className="flex justify-end gap-2.5 max-[480px]:grid max-[480px]:[&>button]:w-full">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedProblemId(activeGroup.selectedProblem!.id)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          )}
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
                  size="sm"
                  variant="secondary"
                  disabled={problems.page === 0}
                  onClick={() => setPage(problems.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={problems.page >= problems.totalPages - 1}
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
          onSuccess={() => alert("Proposed custom topic successfully. Waiting for admin approval.")}
        />
      )}
    </div>
  );
}

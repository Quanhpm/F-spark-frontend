import type { ReactNode } from "react";
import {
  AlertTriangle,
  Award,
  Compass,
  ExternalLink,
  FileText,
  Users,
} from "lucide-react";

import {
  Button,
  LoadingState,
  ResponsiveDialog,
  Select,
} from "@/shared/components";
import type { EntityId, ProblemStatus } from "@/shared/types";

import { useProblem, useEvaluationCriteria } from "../hooks";
import {
  useClearGroupProblem,
  useSelectGroupProblem,
  useUpdateProblemStatus,
} from "../hooks/use-problem-mutations";
import { ProblemDifficultyBadge } from "./problem-difficulty-badge";
import { ProblemStatusBadge } from "./problem-status-badge";

type ProblemDetailModalProps = {
  problemId: EntityId;
  onClose: () => void;
  isGroupLeader?: boolean;
  currentGroupId?: EntityId | null;
  selectedProblemId?: EntityId | null;
  isAdmin?: boolean;
  onEditClick?: () => void;
  onReviewClick?: () => void;
};

type DetailSectionProps = {
  children: ReactNode;
  icon: ReactNode;
  title: string;
  tone?: "default" | "danger";
};

type MetadataItemProps = {
  label: string;
  value: ReactNode;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function DetailSection({
  children,
  icon,
  title,
  tone = "default",
}: DetailSectionProps) {
  const isDanger = tone === "danger";

  return (
    <section className="grid min-w-0 gap-2.5">
      <h3
        className={
          isDanger
            ? "m-0 flex items-center gap-2 text-xs font-bold tracking-[0.05em] text-red-700 uppercase"
            : "m-0 flex items-center gap-2 text-xs font-bold tracking-[0.05em] text-muted uppercase"
        }
      >
        {icon}
        {title}
      </h3>
      <div
        className={
          isDanger
            ? "min-w-0 break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-relaxed text-red-800"
            : "min-w-0 break-words rounded-xl border border-border bg-surface px-4 py-3.5 text-sm leading-relaxed text-foreground shadow-card"
        }
      >
        {children}
      </div>
    </section>
  );
}

function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background px-3.5 py-3">
      <span className="block text-[10px] font-bold tracking-[0.05em] text-muted uppercase">
        {label}
      </span>
      <span className="mt-1 block min-w-0 break-words text-sm leading-snug font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

export function ProblemDetailModal({
  problemId,
  onClose,
  isGroupLeader = false,
  currentGroupId = null,
  selectedProblemId = null,
  isAdmin = false,
  onEditClick,
  onReviewClick,
}: ProblemDetailModalProps) {
  const { data: problemResponse, isLoading } = useProblem(problemId);
  const { data: criteriaResponse } = useEvaluationCriteria();

  const selectProblemMutation = useSelectGroupProblem(currentGroupId || 0);
  const clearProblemMutation = useClearGroupProblem(currentGroupId || 0);
  const updateStatusMutation = useUpdateProblemStatus(problemId);

  const problem = problemResponse?.data;
  const criteria = criteriaResponse?.data || [];
  const isSelected =
    selectedProblemId && Number(selectedProblemId) === Number(problemId);

  function handleSelect() {
    if (!currentGroupId) return;
    selectProblemMutation.mutate(
      { problemId: Number(problemId) },
      {
        onSuccess: () => onClose(),
      },
    );
  }

  function handleClear() {
    if (!currentGroupId) return;
    if (
      window.confirm(
        "Are you sure you want to deselect this problem for your group?",
      )
    ) {
      clearProblemMutation.mutate(undefined, {
        onSuccess: () => onClose(),
      });
    }
  }

  if (isLoading) {
    return (
      <ResponsiveDialog
        className="min-[761px]:max-w-[680px]"
        closeOnBackdrop={false}
        onClose={onClose}
        title="Loading problem details"
      >
        <LoadingState title="Loading problem details..." />
      </ResponsiveDialog>
    );
  }

  if (!problem) {
    return (
      <ResponsiveDialog
        className="min-[761px]:max-w-[480px]"
        closeOnBackdrop={false}
        footer={<Button onClick={onClose}>Close</Button>}
        onClose={onClose}
        title="Error loading problem"
      >
        <p className="m-0 break-words text-sm text-muted">
          Problem details could not be retrieved.
        </p>
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog
      bodyClassName="bg-background/60 px-4 py-5 min-[641px]:px-6"
      className="min-[761px]:max-w-[980px]"
      closeLabel="Close problem details"
      description={
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ProblemDifficultyBadge difficulty={problem.difficultyLevel} />
          <span className="break-all rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-xs font-bold text-muted">
            {problem.code || "PROPOSAL"}
          </span>
          <ProblemStatusBadge status={problem.status} size="sm" />
        </div>
      }
      footer={
        <>
          <div className="break-words text-xs text-muted">
            Created: {formatDate(problem.createdAt)}
          </div>
          <div className="flex min-w-0 flex-wrap justify-end gap-2 max-[760px]:grid max-[760px]:grid-cols-1 max-[760px]:[&>button]:w-full">
            {!isAdmin &&
              problem.status === "ACTIVE" &&
              isGroupLeader &&
              currentGroupId &&
              (isSelected ? (
                <Button
                  disabled={clearProblemMutation.isPending}
                  onClick={handleClear}
                  variant="danger"
                >
                  Clear Selected Problem
                </Button>
              ) : (
                <Button
                  disabled={selectProblemMutation.isPending}
                  onClick={handleSelect}
                >
                  Select for Group
                </Button>
              ))}

            {isAdmin && (
              <>
                <div className="grid min-w-0 gap-1 rounded-xl border border-border bg-background px-3 py-2 min-[481px]:flex min-[481px]:items-center min-[481px]:gap-2">
                  <span className="text-xs font-bold tracking-[0.05em] text-muted uppercase">
                    Status
                  </span>
                  <Select
                    className="pr-8 pl-2 text-xs"
                    disabled={updateStatusMutation.isPending}
                    onChange={(event) => {
                      const newStatus = event.target.value as ProblemStatus;
                      if (
                        window.confirm(
                          `Are you sure you want to change the status to ${newStatus}?`,
                        )
                      ) {
                        updateStatusMutation.mutate(
                          { status: newStatus },
                          {
                            onError: (err) => {
                              alert(`Failed to update status: ${err.message}`);
                            },
                            onSuccess: () => {
                              alert("Status updated successfully!");
                            },
                          },
                        );
                      }
                    }}
                    shellClassName="h-9 rounded-lg bg-surface"
                    value={problem.status}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                </div>

                {onEditClick && (
                  <Button onClick={onEditClick} variant="secondary">
                    Edit Problem
                  </Button>
                )}
                {problem.status === "PENDING_REVIEW" && onReviewClick && (
                  <Button onClick={onReviewClick}>Review Proposal</Button>
                )}
              </>
            )}

            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </>
      }
      footerClassName="items-stretch max-[760px]:flex-col min-[761px]:items-center min-[761px]:justify-between"
      mobileMode="fullscreen"
      onClose={onClose}
      title={problem.title}
    >
            <div className="grid min-w-0 grid-cols-[minmax(0,1.45fr)_minmax(260px,0.75fr)] gap-5 max-[860px]:grid-cols-1">
              <div className="grid min-w-0 content-start gap-5">
                <DetailSection
                  icon={<FileText className="size-4" />}
                  title="Problem Statement"
                >
                  <p className="m-0 whitespace-pre-wrap">
                    {problem.statement}
                  </p>
                </DetailSection>

                {problem.expectedOutput && (
                  <DetailSection
                    icon={<Compass className="size-4" />}
                    title="Expected Deliverables / Output"
                  >
                    <p className="m-0 whitespace-pre-wrap">
                      {problem.expectedOutput}
                    </p>
                  </DetailSection>
                )}

                {(problem.status === "REJECTED" ||
                  problem.reviewComment) && (
                  <DetailSection
                    icon={<AlertTriangle className="size-4" />}
                    title="Review Feedback"
                    tone="danger"
                  >
                    <p className="m-0 font-semibold">
                      {problem.reviewComment ||
                        "Rejected by administrator with no additional comments."}
                    </p>
                    {problem.reviewedBy && (
                      <p className="mt-2 mb-0 text-xs text-red-700/80">
                        Reviewed by {problem.reviewedBy.email}
                      </p>
                    )}
                  </DetailSection>
                )}

                {criteria.length > 0 && (
                  <section className="grid gap-3">
                    <h3 className="m-0 flex items-center gap-2 text-xs font-bold tracking-[0.05em] text-muted uppercase">
                      <Award className="size-4" />
                      Evaluation & Feasibility Rubric
                    </h3>
                    <div className="grid gap-3">
                      {criteria.map((crit) => (
                        <div
                          className="rounded-xl border border-border bg-surface p-4 shadow-card"
                          key={crit.id}
                        >
                          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="m-0 text-sm font-bold text-foreground">
                                {crit.category} - {crit.code}
                              </h4>
                              <p className="m-0 mt-1 text-sm leading-relaxed text-muted">
                                {crit.question}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-surface-warm px-2.5 py-1 text-xs font-bold text-brand-primary">
                              Max {crit.maxScore}
                            </span>
                          </div>
                          {crit.suggestion && (
                            <p className="mt-3 mb-0 rounded-lg border border-border-warm bg-surface-warm px-3 py-2 text-xs leading-relaxed text-muted">
                              Suggestion: {crit.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="grid min-w-0 content-start gap-4">
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
                  <h3 className="m-0 border-b border-border pb-3 text-xs font-bold tracking-[0.05em] text-foreground uppercase">
                    Specifications
                  </h3>
                  <div className="mt-4 grid gap-3">
                    {problem.domain && (
                      <MetadataItem
                        label="Domain"
                        value={`${problem.domain.name} (${problem.domain.code})`}
                      />
                    )}
                    {problem.ownerLab && (
                      <MetadataItem
                        label="Owner Lab"
                        value={problem.ownerLab}
                      />
                    )}
                    {problem.suggestedCourses && (
                      <MetadataItem
                        label="Suggested Courses"
                        value={problem.suggestedCourses}
                      />
                    )}
                    {problem.strategicTheme && (
                      <MetadataItem
                        label="Strategic Theme"
                        value={problem.strategicTheme}
                      />
                    )}
                    {problem.researchArea && (
                      <MetadataItem
                        label="Research Area"
                        value={problem.researchArea}
                      />
                    )}
                    {problem.driveFolderLink && (
                      <a
                        className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 break-words rounded-xl border border-border bg-surface px-3.5 py-3 text-center text-sm font-bold text-brand-primary transition-colors duration-[160ms] hover:bg-background"
                        href={problem.driveFolderLink}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ExternalLink className="size-4" />
                        Drive Workspace Link
                      </a>
                    )}
                  </div>
                </div>

                {problem.sourceType === "SELF_PROPOSED" &&
                  (problem.proposedByGroup || problem.proposedByStudent) && (
                    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
                      <h3 className="m-0 flex items-center gap-2 border-b border-border pb-3 text-xs font-bold tracking-[0.05em] text-foreground uppercase">
                        <Users className="size-4 text-muted" />
                        Proposer Information
                      </h3>
                      <div className="mt-4 grid gap-3">
                        {problem.proposedByGroup && (
                          <MetadataItem
                            label="Group Proposer"
                            value={`${problem.proposedByGroup.groupNo} - ${problem.proposedByGroup.name}`}
                          />
                        )}
                        {problem.proposedByStudent && (
                          <MetadataItem
                            label="Student Contact"
                            value={`${problem.proposedByStudent.fullName} (${problem.proposedByStudent.studentCode})`}
                          />
                        )}
                      </div>
                    </div>
                  )}
              </aside>
            </div>
    </ResponsiveDialog>
  );
}

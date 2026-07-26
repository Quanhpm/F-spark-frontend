import { AlertTriangle, ExternalLink, GraduationCap } from "lucide-react";

import type { InstructorGroupSummaryDto } from "@/modules/groups";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { MilestoneSubmissionStatus } from "@/shared/types";

import type { CourseMilestoneDto, MilestoneSubmissionDto } from "../../types";

type SubmissionResultsProps = {
  error: unknown;
  groups: InstructorGroupSummaryDto[];
  isLoading: boolean;
  milestones: CourseMilestoneDto[];
  onGrade: (submission: MilestoneSubmissionDto) => void;
  submissions: MilestoneSubmissionDto[];
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not submitted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatScore(
  value: number | null | undefined,
  maxScore?: number | null,
) {
  if (typeof value !== "number") return "Not graded";
  if (typeof maxScore === "number") return `${value} / ${maxScore}`;
  return String(value);
}

function getSubmissionStatusTone(status: MilestoneSubmissionStatus) {
  if (status === "GRADED") return "success";
  if (status === "RESUBMITTED") return "warning";
  return "brand";
}

export function SubmissionResults({
  error,
  groups,
  isLoading,
  milestones,
  onGrade,
  submissions,
}: SubmissionResultsProps) {
  const milestonesById = new Map(
    milestones.map((milestone) => [milestone.id, milestone]),
  );
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  return (
    <Card>
      <CardHeader
        actions={<Badge tone="neutral">{submissions.length} submissions</Badge>}
        description="Open a submission to create or update its grade."
        title="Assigned group submissions"
      />
      <CardContent>
        {isLoading ? (
          <LoadingState title="Loading submissions" />
        ) : error ? (
          <EmptyState
            className="border-red-200 bg-red-50"
            description={getErrorMessage(error)}
            icon={<AlertTriangle size={22} />}
            title="Unable to load submissions"
          />
        ) : submissions.length === 0 ? (
          <EmptyState
            description="Try a different filter set or wait for group leaders to submit deliverables."
            icon={<GraduationCap size={22} />}
            title="No submissions found"
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-border min-[761px]:block">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-background">
                    {[
                      "Group",
                      "Milestone",
                      "Status",
                      "Submitted",
                      "Score",
                      "Actions",
                    ].map((label) => (
                      <th
                        className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted last:text-right"
                        key={label}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface text-sm">
                  {submissions.map((submission) => {
                    const milestone = milestonesById.get(submission.milestoneId);
                    const group = groupsById.get(submission.groupId);

                    return (
                      <tr
                        className="transition-colors hover:bg-background"
                        key={submission.id}
                      >
                        <td className="px-5 py-4">
                          <div className="grid gap-1">
                            <span className="break-words font-bold text-foreground">
                              {group?.groupNo ?? `Group #${submission.groupId}`}
                            </span>
                            <span className="break-words text-xs text-muted">
                              {group?.name ?? "Assigned group"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="grid gap-1">
                            <span className="break-words font-medium text-foreground">
                              {milestone?.title ??
                                `Milestone #${submission.milestoneId}`}
                            </span>
                            <span className="text-xs text-muted">
                              Max {submission.maxScore ?? milestone?.maxScore ?? "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge tone={getSubmissionStatusTone(submission.status)}>
                              {submission.status}
                            </Badge>
                            {submission.late && <Badge tone="danger">Late</Badge>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted">
                          {formatDateTime(submission.submittedAt)}
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground">
                          {formatScore(submission.score, submission.maxScore)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              icon={<ExternalLink size={15} />}
                              onClick={() =>
                                window.open(submission.fileUrl, "_blank", "noreferrer")
                              }
                              size="sm"
                              variant="secondary"
                            >
                              File
                            </Button>
                            <Button
                              icon={<GraduationCap size={15} />}
                              onClick={() => onGrade(submission)}
                              size="sm"
                            >
                              Grade
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 min-[761px]:hidden">
              {submissions.map((submission) => {
                const milestone = milestonesById.get(submission.milestoneId);
                const group = groupsById.get(submission.groupId);

                return (
                  <article
                    className="grid min-w-0 gap-4 rounded-xl border border-border bg-surface p-4"
                    key={submission.id}
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="grid min-w-0 gap-1">
                        <span className="break-words font-bold text-foreground">
                          {group?.groupNo ?? `Group #${submission.groupId}`}
                        </span>
                        <span className="break-words text-sm text-muted">
                          {group?.name ?? "Assigned group"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={getSubmissionStatusTone(submission.status)}>
                          {submission.status}
                        </Badge>
                        {submission.late && <Badge tone="danger">Late</Badge>}
                      </div>
                    </div>

                    <div className="grid min-w-0 gap-1 rounded-xl bg-background p-3">
                      <span className="break-words text-sm font-medium text-foreground">
                        {milestone?.title ??
                          `Milestone #${submission.milestoneId}`}
                      </span>
                      <span className="text-xs text-muted">
                        Max {submission.maxScore ?? milestone?.maxScore ?? "N/A"}
                      </span>
                    </div>

                    <dl className="m-0 grid grid-cols-2 gap-3 text-sm">
                      <div className="grid gap-1">
                        <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                          Submitted
                        </dt>
                        <dd className="m-0 break-words text-foreground">
                          {formatDateTime(submission.submittedAt)}
                        </dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                          Score
                        </dt>
                        <dd className="m-0 font-medium text-foreground">
                          {formatScore(submission.score, submission.maxScore)}
                        </dd>
                      </div>
                    </dl>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        icon={<ExternalLink size={15} />}
                        onClick={() =>
                          window.open(submission.fileUrl, "_blank", "noreferrer")
                        }
                        variant="secondary"
                      >
                        File
                      </Button>
                      <Button
                        icon={<GraduationCap size={15} />}
                        onClick={() => onGrade(submission)}
                      >
                        Grade
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

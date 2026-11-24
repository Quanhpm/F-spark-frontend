import { AlertTriangle, ExternalLink } from "lucide-react";

import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type {
  CourseMilestoneStatus,
  EntityId,
  MilestoneSubmissionStatus,
} from "@/shared/types";

import type { CourseMilestoneDto, MilestoneSubmissionDto } from "../../types";

type StudentMilestoneTimelineProps = {
  error: unknown;
  isLoading: boolean;
  milestones: CourseMilestoneDto[];
  submissionsByMilestone: Map<EntityId, MilestoneSubmissionDto>;
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getMilestoneStatusTone(status: CourseMilestoneStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "CLOSED") return "warning";
  if (status === "ARCHIVED") return "danger";
  return "neutral";
}

function getSubmissionStatusTone(status: MilestoneSubmissionStatus) {
  if (status === "GRADED") return "success";
  if (status === "RESUBMITTED") return "warning";
  return "brand";
}

export function StudentMilestoneTimeline({
  error,
  isLoading,
  milestones,
  submissionsByMilestone,
}: StudentMilestoneTimelineProps) {
  if (isLoading) {
    return <LoadingState title="Loading milestone timeline" />;
  }

  if (error) {
    return (
      <EmptyState
        className="border-red-200 bg-red-50"
        description={getErrorMessage(error)}
        icon={<AlertTriangle size={22} />}
        title="Unable to load timeline"
      />
    );
  }

  if (milestones.length === 0) {
    return (
      <EmptyState
        description="Your instructor has not published milestones for this group yet."
        title="No milestones published"
      />
    );
  }

  return (
    <div className="grid gap-3">
      {milestones.map((milestone) => {
        const submission = submissionsByMilestone.get(milestone.id);
        return (
          <div
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-xl border border-border bg-surface p-4 max-[860px]:grid-cols-1"
            key={milestone.id}
          >
            <div className="grid min-w-0 gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={getMilestoneStatusTone(milestone.status)}>
                  {milestone.status}
                </Badge>
                {submission ? (
                  <Badge tone={getSubmissionStatusTone(submission.status)}>
                    {submission.status}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Not submitted</Badge>
                )}
                {submission?.late && <Badge tone="danger">Late</Badge>}
              </div>
              <div className="grid min-w-0 gap-1">
                <h3 className="m-0 break-words text-base font-bold text-foreground">
                  {milestone.title}
                </h3>
                {milestone.description && (
                  <p className="m-0 break-words text-sm leading-6 text-muted">
                    {milestone.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted">
                <span className="rounded-full border border-border bg-background px-3 py-1">
                  Deadline {formatDateTime(milestone.deadlineAt)}
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1">
                  Weight {milestone.weight ?? "N/A"}%
                </span>
              </div>
            </div>

            <div className="flex items-start justify-end gap-2 max-[860px]:grid max-[860px]:grid-cols-2 max-[430px]:grid-cols-1">
              {submission?.fileUrl && (
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
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

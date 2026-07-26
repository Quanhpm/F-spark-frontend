import { AlertTriangle, CalendarClock, Pencil, Trash2 } from "lucide-react";

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
import type { CourseMilestoneStatus } from "@/shared/types";

import type { CourseMilestoneDto } from "../../types";

type MilestoneListProps = {
  courseCode: string;
  error: unknown;
  hasRequiredFilters: boolean;
  isArchiving: boolean;
  isLoading: boolean;
  milestones: CourseMilestoneDto[];
  onArchive: (milestone: CourseMilestoneDto) => void;
  onEdit: (milestone: CourseMilestoneDto) => void;
  term: string;
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

function formatNumber(value: number | null | undefined, suffix = "") {
  return typeof value === "number" ? `${value}${suffix}` : "Not set";
}

function getStatusTone(status: CourseMilestoneStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "CLOSED") return "warning";
  if (status === "ARCHIVED") return "danger";
  return "neutral";
}

export function MilestoneList({
  courseCode,
  error,
  hasRequiredFilters,
  isArchiving,
  isLoading,
  milestones,
  onArchive,
  onEdit,
  term,
}: MilestoneListProps) {
  return (
    <Card>
      <CardHeader
        actions={
          hasRequiredFilters && (
            <Badge tone="brand">
              {term.trim()} / {courseCode.trim()}
            </Badge>
          )
        }
        description="Milestones load from the selected term and course code."
        title="Timeline milestones"
      />
      <CardContent>
        {!hasRequiredFilters ? (
          <EmptyState
            description="Milestones load after both filters are set."
            icon={<CalendarClock size={22} />}
            title="Select a term and course"
          />
        ) : isLoading ? (
          <LoadingState title="Loading milestones" />
        ) : error ? (
          <EmptyState
            className="border-red-200 bg-red-50"
            description={getErrorMessage(error)}
            icon={<AlertTriangle size={22} />}
            title="Unable to load milestones"
          />
        ) : milestones.length === 0 ? (
          <EmptyState
            description="Create the first timeline item for this term and course."
            title="No milestones yet"
          />
        ) : (
          <div className="grid gap-3">
            {milestones.map((milestone) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-card-interactive max-[760px]:grid-cols-1"
                key={milestone.id}
              >
                <div className="grid min-w-0 gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge tone={getStatusTone(milestone.status)}>
                      {milestone.status}
                    </Badge>
                    <span className="text-xs font-medium text-muted">
                      Position {formatNumber(milestone.position)}
                    </span>
                    <span className="text-xs font-medium text-muted">
                      {formatDateTime(milestone.deadlineAt)}
                    </span>
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
                      Weight {formatNumber(milestone.weight, "%")}
                    </span>
                    <span className="rounded-full border border-border bg-background px-3 py-1">
                      Max score {formatNumber(milestone.maxScore)}
                    </span>
                    <span className="rounded-full border border-border bg-background px-3 py-1">
                      #{milestone.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-end gap-2 max-[480px]:grid max-[480px]:[&>button]:min-h-11 max-[480px]:[&>button]:w-full">
                  <Button
                    icon={<Pencil size={15} />}
                    onClick={() => onEdit(milestone)}
                    size="sm"
                    variant="secondary"
                  >
                    Edit
                  </Button>
                  <Button
                    disabled={isArchiving}
                    icon={<Trash2 size={15} />}
                    onClick={() => onArchive(milestone)}
                    size="sm"
                    variant="danger"
                  >
                    Archive
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

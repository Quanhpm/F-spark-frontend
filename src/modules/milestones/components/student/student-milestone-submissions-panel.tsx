"use client";

import { type FormEvent, useId, useMemo, useState } from "react";
import { CalendarClock, Send, Upload } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type {
  CourseMilestoneStatus,
  EntityId,
} from "@/shared/types";

import {
  useAverageGrade,
  useGroupMilestoneSubmissions,
  useGroupMilestones,
  useSubmitMilestone,
  useUpdateMilestoneSubmission,
} from "../../hooks";
import type { CourseMilestoneDto, MilestoneSubmissionDto } from "../../types";
import { StudentMilestoneTimeline } from "./student-milestone-timeline";

export type StudentMilestoneGroupOption = {
  courseCode: string;
  groupNo: string;
  id: EntityId;
  name: string;
  projectName: string | null;
  status: string;
  term: string;
};

type StudentMilestoneSubmissionsPanelProps = {
  groups: StudentMilestoneGroupOption[];
  initialGroupId?: EntityId | null;
};

type SubmissionModalProps = {
  existingSubmission?: MilestoneSubmissionDto;
  groupId: EntityId;
  milestone: CourseMilestoneDto;
  onClose: () => void;
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
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

function getAverageValue(
  value: { averageGrade: number | null; average: number | null } | undefined,
) {
  if (!value) return null;
  return value.averageGrade ?? value.average ?? null;
}

function getLatestSubmissionByMilestone(submissions: MilestoneSubmissionDto[]) {
  const latestByMilestone = new Map<EntityId, MilestoneSubmissionDto>();

  submissions.forEach((submission) => {
    const current = latestByMilestone.get(submission.milestoneId);
    if (!current) {
      latestByMilestone.set(submission.milestoneId, submission);
      return;
    }

    const currentTime = current.submittedAt
      ? new Date(current.submittedAt).getTime()
      : 0;
    const nextTime = submission.submittedAt
      ? new Date(submission.submittedAt).getTime()
      : 0;

    if (nextTime >= currentTime) {
      latestByMilestone.set(submission.milestoneId, submission);
    }
  });

  return latestByMilestone;
}

function SubmissionModal({
  existingSubmission,
  groupId,
  milestone,
  onClose,
}: SubmissionModalProps) {
  const formId = useId();
  const submitMutation = useSubmitMilestone();
  const updateMutation = useUpdateMilestoneSubmission();
  const [fileUrl, setFileUrl] = useState(existingSubmission?.fileUrl ?? "");
  const [comments, setComments] = useState(existingSubmission?.comments ?? "");
  const [error, setError] = useState("");

  const isPending = submitMutation.isPending || updateMutation.isPending;
  const mutationError = submitMutation.error ?? updateMutation.error;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!fileUrl.trim()) {
      setError("Deliverable URL is required.");
      return;
    }

    if (fileUrl.trim().length > 1000) {
      setError("Deliverable URL cannot exceed 1,000 characters.");
      return;
    }

    if (existingSubmission) {
      updateMutation.mutate(
        {
          payload: {
            comments: optional(comments),
            fileUrl: fileUrl.trim(),
            version: existingSubmission.version ?? undefined,
          },
          submissionId: existingSubmission.id,
        },
        { onSuccess: onClose },
      );
      return;
    }

    submitMutation.mutate(
      {
        payload: {
          comments: optional(comments),
          fileUrl: fileUrl.trim(),
          groupId,
          milestoneId: milestone.id,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[620px]"
      closeLabel="Close submission form"
      closeOnBackdrop={false}
      description={milestone.title}
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={isPending}
            form={formId}
            icon={<Send size={16} />}
            type="submit"
          >
            {isPending
              ? "Submitting..."
              : existingSubmission
                ? "Resubmit"
                : "Submit"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={existingSubmission ? "Resubmit deliverable" : "Submit deliverable"}
    >
      <form className="grid min-w-0 gap-5" id={formId} onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-4 text-sm text-muted">
          <Badge tone={getMilestoneStatusTone(milestone.status)}>
            {milestone.status}
          </Badge>
          <span>Deadline {formatDateTime(milestone.deadlineAt)}</span>
          <span>Weight {milestone.weight ?? "N/A"}%</span>
          <span>Max {milestone.maxScore ?? "N/A"}</span>
        </div>

        <TextInput
          icon={<Upload size={16} />}
          label="Deliverable URL"
          onChange={(event) => setFileUrl(event.target.value)}
          placeholder="https://drive.google.com/..."
          required
          value={fileUrl}
        />
        {fileUrl && (
          <p className="-mt-3 m-0 break-all text-xs leading-5 text-muted">
            {fileUrl}
          </p>
        )}

        <label className="grid gap-[7px]">
          <span className="text-[13px] font-medium text-foreground">
            Comments
          </span>
          <textarea
            className="min-h-28 min-w-0 rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-0 transition-[border-color,box-shadow] focus:border-brand-secondary focus:shadow-[0_0_0_4px_rgba(237,161,47,0.12)] min-[761px]:text-sm"
            onChange={(event) => setComments(event.target.value)}
            placeholder="Notes for the instructor"
            value={comments}
          />
        </label>

        {(error || mutationError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || getErrorMessage(mutationError)}
          </div>
        )}
      </form>
    </ResponsiveDialog>
  );
}

export function StudentMilestoneSubmissionsPanel({
  groups,
  initialGroupId,
}: StudentMilestoneSubmissionsPanelProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(
    initialGroupId ? String(initialGroupId) : "",
  );
  const [activeMilestone, setActiveMilestone] =
    useState<CourseMilestoneDto | null>(null);

  const effectiveGroupId =
    selectedGroupId || !groups[0]
      ? Number(selectedGroupId) || null
      : groups[0].id;
  const activeGroup =
    groups.find((group) => Number(group.id) === Number(effectiveGroupId)) ??
    null;

  const milestonesQuery = useGroupMilestones(effectiveGroupId);
  const submissionsQuery = useGroupMilestoneSubmissions(effectiveGroupId);
  const averageGradeQuery = useAverageGrade(effectiveGroupId);
  const milestones = useMemo(
    () =>
      [...(milestonesQuery.data?.data ?? [])].sort((left, right) => {
        const byPosition = (left.position ?? 0) - (right.position ?? 0);
        if (byPosition !== 0) return byPosition;
        return left.id - right.id;
      }),
    [milestonesQuery.data?.data],
  );
  const submissionsByMilestone = useMemo(
    () => getLatestSubmissionByMilestone(submissionsQuery.data?.data ?? []),
    [submissionsQuery.data?.data],
  );
  const averageGrade = getAverageValue(averageGradeQuery.data?.data);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock size={22} />}
        title="No group timeline"
        description="Join or create a group before submitting milestone deliverables."
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-6">
      <Card>
        <CardHeader
          actions={
            <Badge tone={averageGrade === null ? "neutral" : "brand"}>
              {averageGradeQuery.isLoading
                ? "Loading average"
                : averageGrade === null
                  ? "No grade"
                  : `Average ${averageGrade.toFixed(2)}`}
            </Badge>
          }
          description="Submit or resubmit deliverable URLs for your group's instructor milestones."
          title="Milestone submissions"
        />
        <CardContent className="grid gap-5">
          <div className="grid grid-cols-[minmax(240px,360px)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
            <Select
              label="Group"
              onChange={(event) => {
                setSelectedGroupId(event.target.value);
                setActiveMilestone(null);
              }}
              value={String(effectiveGroupId ?? "")}
            >
              {groups.map((group) => (
                <option key={group.id} value={String(group.id)}>
                  {group.groupNo} - {group.name}
                </option>
              ))}
            </Select>

            <div className="grid content-center gap-1 rounded-xl border border-border bg-background px-4 py-3">
              <span className="break-words text-sm font-bold text-foreground">
                {activeGroup?.projectName ??
                  activeGroup?.name ??
                  "Selected group"}
              </span>
              <span className="break-words text-sm text-muted">
                {activeGroup
                  ? `${activeGroup.term} / ${activeGroup.courseCode}`
                  : "Group scope"}
              </span>
            </div>
          </div>

          <StudentMilestoneTimeline
            error={milestonesQuery.error ?? submissionsQuery.error}
            isLoading={milestonesQuery.isLoading || submissionsQuery.isLoading}
            milestones={milestones}
            onSubmit={setActiveMilestone}
            submissionsByMilestone={submissionsByMilestone}
          />
        </CardContent>
      </Card>

      {activeMilestone && effectiveGroupId && (
        <SubmissionModal
          existingSubmission={submissionsByMilestone.get(activeMilestone.id)}
          groupId={effectiveGroupId}
          milestone={activeMilestone}
          onClose={() => setActiveMilestone(null)}
        />
      )}
    </div>
  );
}

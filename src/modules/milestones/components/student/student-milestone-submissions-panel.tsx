"use client";

import { useEffect, useMemo } from "react";
import { CalendarClock } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Select,
} from "@/shared/components";
import type { EntityId } from "@/shared/types";
import { resolveActiveGroup, useActiveGroupStore } from "@/modules/groups";

import {
  useAverageGrade,
  useGroupMilestoneSubmissions,
  useGroupMilestones,
} from "../../hooks";
import type { MilestoneSubmissionDto } from "../../types";
import { StudentMilestoneTimeline } from "./student-milestone-timeline";

export type StudentMilestoneGroupOption = {
  courseCode: string;
  groupNo: string;
  id: EntityId;
  name: string;
  projectName: string | null;
  status: string;
  term: string;
  studentReadOnly: boolean;
};

type StudentMilestoneSubmissionsPanelProps = {
  groups: StudentMilestoneGroupOption[];
  initialGroupId?: EntityId | null;
};

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


export function StudentMilestoneSubmissionsPanel({
  groups,
  initialGroupId,
}: StudentMilestoneSubmissionsPanelProps) {
  const storedActiveGroupId = useActiveGroupStore(
    (state) => state.activeGroupId,
  );
  const setActiveGroupId = useActiveGroupStore(
    (state) => state.setActiveGroupId,
  );
  const activeGroup = resolveActiveGroup(
    groups,
    initialGroupId ?? storedActiveGroupId ?? null,
  );
  const effectiveGroupId = activeGroup?.id ?? null;

  useEffect(() => {
    if (
      initialGroupId &&
      activeGroup?.id === initialGroupId &&
      storedActiveGroupId !== initialGroupId
    ) {
      setActiveGroupId(initialGroupId);
    }
  }, [
    activeGroup?.id,
    initialGroupId,
    setActiveGroupId,
    storedActiveGroupId,
  ]);

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
        description="Join or create a group before viewing milestone progress."
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-6">
      {activeGroup?.studentReadOnly && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Term {activeGroup.term} has ended — read-only. Submissions and grades remain available for review.
        </div>
      )}
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
          description="Review deliverables, grades, and instructor feedback for your group's milestones."
          title="Milestone progress"
        />
        <CardContent className="grid gap-5">
          <div className="grid grid-cols-[minmax(240px,360px)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
            <Select
              label="Group"
              onChange={(event) => {
                setActiveGroupId(Number(event.target.value));
              }}
              value={String(effectiveGroupId ?? "")}
            >
              {groups.map((group) => (
                <option key={group.id} value={String(group.id)}>
                  {group.groupNo} - {group.name}
                  {group.studentReadOnly ? ` (Ended · ${group.term})` : ""}
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
            submissionsByMilestone={submissionsByMilestone}
          />
        </CardContent>
      </Card>
    </div>
  );
}

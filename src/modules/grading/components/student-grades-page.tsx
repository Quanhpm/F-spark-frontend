"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { useAuthStore } from "@/modules/auth";
import { resolveActiveGroup, useActiveGroupStore } from "@/modules/groups";
import { useGroupMilestones } from "@/modules/milestones";
import { useGroupDetails, useMyGroups } from "@/modules/projects/hooks";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
} from "@/shared/components";

import { useGroupGradeMatrix } from "../hooks";
import { StudentMilestoneDetailsDialog } from "./student-milestone-details-dialog";

type StudentGradesPageProps = {
  initialGroupId?: number | null;
  initialMilestoneId?: number | null;
};

export function StudentGradesPage({
  initialGroupId,
  initialMilestoneId,
}: StudentGradesPageProps = {}) {
  const session = useAuthStore((state) => state.session);
  const storedActiveGroupId = useActiveGroupStore(
    (state) => state.activeGroupId,
  );
  const setActiveGroupId = useActiveGroupStore(
    (state) => state.setActiveGroupId,
  );
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(
    null,
  );
  const handledInitialMilestoneKey = useRef<string | null>(null);

  const myGroupsQuery = useMyGroups();
  const myGroups = myGroupsQuery.data?.data;
  const activeGroup = resolveActiveGroup(
    myGroups ?? [],
    initialGroupId ?? storedActiveGroupId ?? null,
  );
  const activeGroupId = activeGroup?.id ?? null;

  const groupDetailsQuery = useGroupDetails(activeGroupId || 0);
  const group = groupDetailsQuery.data?.data;
  const matrixQuery = useGroupGradeMatrix(activeGroupId);
  const matrix = matrixQuery.data?.data;
  const milestoneDetailsQuery = useGroupMilestones(activeGroupId);
  const milestoneDetails = milestoneDetailsQuery.data?.data ?? [];

  const hasMilestones = Boolean(matrix?.milestones.length);
  const isMatrixComplete = hasMilestones && Boolean(matrix?.complete);
  const isLoadingDetails =
    groupDetailsQuery.isLoading || matrixQuery.isLoading;

  const myGroupMember = useMemo(() => {
    if (!group || !session?.user) return null;
    return (
      group.members.find(
        (member) =>
          member.email.toLowerCase() === session.user.email.toLowerCase(),
      ) ?? null
    );
  }, [group, session]);

  const isGroupLeader = useMemo(() => {
    if (!group?.leader || !session?.user) return false;
    return (
      group.leader.email.toLowerCase() === session.user.email.toLowerCase()
    );
  }, [group, session]);

  const myMemberRow = useMemo(() => {
    if (!matrix) return null;
    if (myGroupMember) {
      return (
        matrix.members.find(
          (member) => member.studentId === myGroupMember.studentId,
        ) ?? null
      );
    }
    if (!session?.user) return null;

    const accountCode = session.user.email.split("@")[0].toLowerCase();
    return (
      matrix.members.find(
        (member) => member.studentCode.toLowerCase() === accountCode,
      ) ??
      matrix.members.find((member) =>
        member.studentName.toLowerCase().includes(accountCode),
      ) ??
      null
    );
  }, [matrix, myGroupMember, session]);

  const leaderStudentId = useMemo(() => {
    if (!matrix || !group?.leader) return null;
    const leaderCode = group.leader.email.split("@")[0].toLowerCase();
    return (
      matrix.members.find(
        (member) =>
          member.studentId === group.leader?.id ||
          member.studentCode.toLowerCase() === leaderCode,
      )?.studentId ?? null
    );
  }, [group, matrix]);

  const selectedMilestone =
    matrix?.milestones.find(
      (milestone) => milestone.milestoneId === selectedMilestoneId,
    ) ?? null;
  const selectedMilestoneDetails =
    milestoneDetails.find(
      (milestone) => milestone.id === selectedMilestoneId,
    ) ?? null;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSelectedMilestoneId(null);
  }, [activeGroupId, session?.user?.email]);

  useEffect(() => {
    if (
      initialGroupId &&
      activeGroupId === initialGroupId &&
      storedActiveGroupId !== initialGroupId
    ) {
      setActiveGroupId(initialGroupId);
    }
  }, [
    activeGroupId,
    initialGroupId,
    setActiveGroupId,
    storedActiveGroupId,
  ]);

  useEffect(() => {
    if (!activeGroupId || !initialMilestoneId || !matrix) return;
    const initialMilestoneKey = `${activeGroupId}:${initialMilestoneId}`;
    if (handledInitialMilestoneKey.current === initialMilestoneKey) return;

    const milestone = matrix.milestones.find(
      (item) => item.milestoneId === initialMilestoneId,
    );
    if (milestone) {
      handledInitialMilestoneKey.current = initialMilestoneKey;
      setSelectedMilestoneId(milestone.milestoneId);
    }
  }, [activeGroupId, initialMilestoneId, matrix]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="View milestone grades, instructor feedback, and member contributions."
        title="My Thesis Grades"
      />

      {myGroupsQuery.isLoading ? (
        <LoadingState title="Loading your groups..." />
      ) : !myGroups || myGroups.length === 0 ? (
        <EmptyState
          description="You must be in a group to view grade reports."
          title="No groups found"
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="grid gap-5 pt-6">
              <div className="grid grid-cols-[minmax(240px,360px)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-1">
                <Select
                  label="Group"
                  onChange={(event) =>
                    setActiveGroupId(Number(event.target.value))
                  }
                  value={String(activeGroupId ?? "")}
                >
                  {myGroups.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.groupNo} - {item.name}
                    </option>
                  ))}
                </Select>

                <div className="grid content-center gap-1 rounded-xl border border-border bg-background px-4 py-3">
                  <span className="break-words text-sm font-bold text-foreground">
                    {group?.projectName ?? group?.name ?? "Selected group"}
                  </span>
                  <span className="break-words text-sm text-muted">
                    {group
                      ? `${group.term} / ${group.courseCode}`
                      : "Group scope"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoadingDetails ? (
            <LoadingState title="Loading grading information..." />
          ) : !matrix || !hasMilestones ? (
            <EmptyState
              description="Course milestones have not been created for this group yet."
              title="No milestones yet"
            />
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <Card>
                    <CardHeader
                      description="Select a milestone to view its details, grade, and member contributions."
                      title="Milestone Evaluations"
                    />
                    <CardContent className="border-t border-border p-0">
                      <div className="divide-y divide-border">
                        {matrix.milestones.map((milestone) => {
                          const grade = milestone.groupGrade;

                          return (
                            <button
                              className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-0 bg-transparent p-5 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-secondary max-[560px]:grid-cols-1"
                              key={milestone.milestoneId}
                              onClick={() =>
                                setSelectedMilestoneId(milestone.milestoneId)
                              }
                              type="button"
                            >
                              <div className="grid min-w-0 gap-2">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <strong className="break-words text-sm font-bold text-foreground">
                                    {milestone.title}
                                  </strong>
                                  <Badge
                                    size="sm"
                                    tone={
                                      milestone.graded ? "success" : "neutral"
                                    }
                                  >
                                    {milestone.graded
                                      ? "Graded"
                                      : "Not Graded"}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted">
                                  Weight: {milestone.weight}% · Max score:{" "}
                                  {milestone.maxScore}
                                </span>
                                {grade && (
                                  <span className="text-sm font-bold text-brand-primary">
                                    Group grade: {grade.score} /{" "}
                                    {milestone.maxScore}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 justify-self-end text-xs font-bold text-brand-primary max-[560px]:justify-self-start">
                                <span>View details</span>
                                <ChevronRight size={16} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-l-4 border-l-brand-primary bg-brand-primary/5">
                    <CardHeader
                      description={`Active Project: ${group?.projectName || "No Project"}`}
                      title="Academic Summary"
                    />
                    <CardContent className="space-y-4 pt-0">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <span className="text-sm font-bold text-muted">
                          Grading Progress:
                        </span>
                        <Badge
                          icon={
                            isMatrixComplete ? (
                              <CheckCircle2 size={13} />
                            ) : undefined
                          }
                          tone={isMatrixComplete ? "success" : "neutral"}
                        >
                          {isMatrixComplete ? "Completed" : "In Progress"}
                        </Badge>
                      </div>

                      <p className="m-0 text-xs leading-relaxed text-muted">
                        Completed when all milestones have grading and
                        contribution data.
                      </p>

                      {myMemberRow && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold tracking-wider text-muted uppercase">
                            My Total Grade
                          </span>
                          <strong className="text-3xl leading-none font-extrabold text-brand-primary">
                            {typeof myMemberRow.totalScore === "number" &&
                            Number.isFinite(myMemberRow.totalScore)
                              ? myMemberRow.totalScore.toFixed(2)
                              : "Not available"}
                          </strong>
                          <span className="text-xs text-muted">
                            Individual weighted total of graded milestones.
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {selectedMilestone && activeGroupId && (
                <StudentMilestoneDetailsDialog
                  canEditContributions={
                    isGroupLeader && !selectedMilestone.graded
                  }
                  courseCode={matrix.courseCode}
                  currentStudentId={myMemberRow?.studentId}
                  groupId={activeGroupId}
                  isMilestoneDetailsError={
                    milestoneDetailsQuery.isError ||
                    (!milestoneDetailsQuery.isLoading &&
                      !selectedMilestoneDetails)
                  }
                  isMilestoneDetailsLoading={milestoneDetailsQuery.isLoading}
                  key={`${activeGroupId}-${selectedMilestone.milestoneId}`}
                  leaderStudentId={leaderStudentId}
                  members={matrix.members}
                  milestone={selectedMilestone}
                  milestoneDetails={selectedMilestoneDetails}
                  onClose={() => setSelectedMilestoneId(null)}
                  term={matrix.term}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

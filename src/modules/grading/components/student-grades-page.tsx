"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/shared/components";
import { CheckCircle2, Users } from "lucide-react";
import { useAuthStore } from "@/modules/auth";
import { resolveActiveGroup, useActiveGroupStore } from "@/modules/groups";
import { useMyGroups, useGroupDetails } from "@/modules/projects/hooks";
import { useGroupGradeMatrix } from "../hooks";
import { ContributionEditor } from "./contribution-editor";

type StudentGradesPageProps = {
  initialGroupId?: number | null;
  initialMilestoneId?: number | null;
};

export function StudentGradesPage({
  initialGroupId,
  initialMilestoneId,
}: StudentGradesPageProps = {}) {
  const session = useAuthStore((state) => state.session);

  // Student Group queries
  const { data: myGroupsResponse, isLoading: isMyGroupsLoading } = useMyGroups();
  const myGroups = myGroupsResponse?.data;
  const storedActiveGroupId = useActiveGroupStore(
    (state) => state.activeGroupId,
  );
  const setActiveGroupId = useActiveGroupStore(
    (state) => state.setActiveGroupId,
  );
  const activeGroup = resolveActiveGroup(
    myGroups ?? [],
    initialGroupId ?? storedActiveGroupId ?? null,
  );

  const activeGroupId = activeGroup?.id;
  const { data: groupDetailsResponse, isLoading: isGroupDetailsLoading } = useGroupDetails(activeGroupId || 0);
  const group = groupDetailsResponse?.data;

  // Check if current user is Group Leader
  const isGroupLeader = useMemo(() => {
    if (!group || !session?.user) return false;
    return group.leader.email === session.user.email;
  }, [group, session]);

  // Grade matrix query
  const { data: matrixResponse, isLoading: isMatrixLoading } = useGroupGradeMatrix(activeGroupId);
  const matrix = matrixResponse?.data;
  const hasMilestones = Boolean(matrix?.milestones.length);
  const isMatrixComplete = hasMilestones && Boolean(matrix?.complete);

  // Selected milestone for contribution editing
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
  const [editingMilestoneTitle, setEditingMilestoneTitle] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setEditingMilestoneId(null);
    setEditingMilestoneTitle("");
  }, [activeGroupId]);

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
    if (!initialMilestoneId || !matrix) return;
    const milestone = matrix.milestones.find(
      (item) => item.milestoneId === initialMilestoneId,
    );
    if (milestone) {
      setEditingMilestoneId(milestone.milestoneId);
      setEditingMilestoneTitle(milestone.title);
    }
  }, [initialMilestoneId, matrix]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isLoading = isMyGroupsLoading || isGroupDetailsLoading || isMatrixLoading;

  // Find active member row
  const myMemberRow = useMemo(() => {
    if (!matrix || !session?.user) return null;
    return matrix.members.find((m) => m.studentCode === session.user.email.split("@")[0].toUpperCase())
      || matrix.members.find((m) => m.studentName.toLowerCase().includes(session.user.email.split("@")[0].toLowerCase()));
  }, [matrix, session]);

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        title="My Thesis Grades"
        description="View your group milestones grades, feedback from instructors, and manage member contributions."
      />

      {isLoading ? (
        <LoadingState title="Loading grading information..." />
      ) : !activeGroupId ? (
        <EmptyState
          title="No active group"
          description="You must be in an active group to view grade reports."
        />
      ) : !matrix ? (
        <EmptyState
          title="No grading matrix found"
          description="Grading reports are not set up for this group yet."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader
                title="Milestone Evaluations"
                description="List of all course milestones, scores, and instructor feedback."
              />
              <CardContent className="p-0 border-t border-border">
                {hasMilestones ? (
                  <div className="divide-y divide-border">
                    {matrix.milestones.map((col) => {
                    const grade = col.groupGrade;
                    const myScore = myMemberRow?.milestoneScores.find(
                      (ms) => ms.milestoneId === col.milestoneId
                    );

                    return (
                      <div className="p-5 space-y-3 hover:bg-neutral-50/20 transition-colors" key={col.milestoneId}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <strong className="text-sm font-bold text-foreground block">
                              {col.title}
                            </strong>
                            <span className="text-xs text-muted">
                              Weight: {col.weight}% &bull; Max Score: {col.maxScore}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {col.graded ? (
                              <Badge tone="success" size="sm">
                                Graded
                              </Badge>
                            ) : (
                              <Badge tone="neutral" size="sm">
                                Not Graded
                              </Badge>
                            )}

                            {col.contributionsComplete ? (
                              <Badge tone="brand" size="sm">
                                Contributions Done
                              </Badge>
                            ) : (
                              <Badge tone="warning" size="sm">
                                Contributions Pending
                              </Badge>
                            )}
                          </div>
                        </div>

                        {col.graded && grade && (
                          <div className="grid gap-2 rounded-xl bg-background border border-border p-3.5">
                            <div className="flex items-center justify-between text-xs text-muted font-semibold">
                              <span>Group Grade:</span>
                              <span className="text-sm font-extrabold text-foreground">
                                {grade.score} / {col.maxScore}
                              </span>
                            </div>

                            {myScore && (
                              <div className="flex items-center justify-between text-xs text-muted font-semibold border-t border-border/40 pt-1.5">
                                <span>My Contribution / Individual Grade:</span>
                                <span className="text-sm font-extrabold text-brand-primary">
                                  {myScore.contributionPercent}% &bull; {myScore.calculatedScore.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {grade.feedback && (
                              <div className="text-xs text-muted bg-surface border border-border/40 rounded-lg p-2.5 mt-1.5 leading-normal">
                                <strong className="block text-foreground mb-0.5">Instructor Feedback:</strong>
                                {grade.feedback}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Leader Contribution Edit Button */}
                        {isGroupLeader && !col.contributionsComplete && (
                          <button
                            onClick={() => {
                              setEditingMilestoneId(col.milestoneId);
                              setEditingMilestoneTitle(col.title);
                            }}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-brand-primary bg-brand-primary/5 px-3 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 transition-colors"
                          >
                            <Users size={13} />
                            <span>Edit Contributions</span>
                          </button>
                        )}
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    className="rounded-none border-0 bg-transparent"
                    description="Course milestones have not been created for this group yet."
                    title="No milestones yet"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Grade Overview Summary Card */}
            <Card className="border-l-4 border-l-brand-primary bg-brand-primary/5">
              <CardHeader
                title="Academic Summary"
                description={`Active Project: ${group?.projectName || "No Project"}`}
              />
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="text-sm font-bold text-muted">Grading Progress:</span>
                  <Badge tone={isMatrixComplete ? "success" : "neutral"} icon={isMatrixComplete ? <CheckCircle2 size={13} /> : undefined}>
                    {!hasMilestones
                      ? "No Milestones"
                      : isMatrixComplete
                        ? "Completed"
                        : "In Progress"}
                  </Badge>
                </div>

                <p className="m-0 text-xs leading-relaxed text-muted">
                  Completed when all milestones have grading and contribution data.
                </p>

                {hasMilestones && myMemberRow && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">My Total Grade</span>
                    <strong className="text-3xl font-extrabold text-brand-primary leading-none">
                      {myMemberRow.totalScore.toFixed(2)}
                    </strong>
                    <span className="text-xs text-muted">
                      Individual weighted total of graded milestones.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Render Contribution Editor if Leader clicks "Edit Contributions" */}
            {isGroupLeader && editingMilestoneId !== null && (
              <ContributionEditor
                groupId={activeGroupId}
                milestoneId={editingMilestoneId}
                milestoneTitle={editingMilestoneTitle}
                members={matrix.members}
                onSuccess={() => {
                  setEditingMilestoneId(null);
                  setEditingMilestoneTitle("");
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

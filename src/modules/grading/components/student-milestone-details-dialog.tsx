"use client";

import {
  Badge,
  LoadingState,
  ResponsiveDialog,
} from "@/shared/components";
import type { CourseMilestoneDto } from "@/modules/milestones";

import type { MemberRow, MilestoneColumn } from "../types";
import { ContributionEditor } from "./contribution-editor";

type StudentMilestoneDetailsDialogProps = {
  canEditContributions: boolean;
  courseCode: string;
  currentStudentId?: number | null;
  groupId: number;
  isMilestoneDetailsError: boolean;
  isMilestoneDetailsLoading: boolean;
  leaderStudentId?: number | null;
  members: MemberRow[];
  milestone: MilestoneColumn;
  milestoneDetails?: CourseMilestoneDto | null;
  onClose: () => void;
  term: string;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "Not available";
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1 rounded-xl border border-border bg-background p-3">
      <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
        {label}
      </span>
      <span className="min-w-0 break-words text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

export function StudentMilestoneDetailsDialog({
  canEditContributions,
  courseCode,
  currentStudentId,
  groupId,
  isMilestoneDetailsError,
  isMilestoneDetailsLoading,
  leaderStudentId,
  members,
  milestone,
  milestoneDetails,
  onClose,
  term,
}: StudentMilestoneDetailsDialogProps) {
  const grade = milestone.groupGrade;
  const currentStudent = members.find(
    (member) => member.studentId === currentStudentId,
  );
  const currentStudentScore = currentStudent?.milestoneScores.find(
    (score) => score.milestoneId === milestone.milestoneId,
  );
  const readOnlyReason = milestone.graded
    ? "Contributions are locked after this milestone has been graded."
    : "Only the group leader can update contribution percentages.";

  return (
    <ResponsiveDialog
      bodyClassName="min-[900px]:overflow-hidden"
      className="min-[761px]:max-w-[1120px]"
      closeLabel="Close milestone details"
      description={`${term} · ${courseCode}`}
      mobileMode="fullscreen"
      onClose={onClose}
      title={milestone.title}
    >
      <div className="grid min-w-0 gap-5 min-[900px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[900px]:items-start">
        <section className="grid min-w-0 gap-5 min-[900px]:max-h-[calc(100dvh-11rem)] min-[900px]:overflow-y-auto min-[900px]:pr-1">
          <div className="flex flex-wrap gap-2">
            <Badge tone={milestone.graded ? "success" : "neutral"}>
              {milestone.graded ? "Graded" : "Not graded"}
            </Badge>
            <Badge tone={milestone.gradeComplete ? "success" : "warning"}>
              {milestone.gradeComplete ? "Grade complete" : "In progress"}
            </Badge>
            {milestoneDetails?.status && (
              <Badge tone="neutral">{milestoneDetails.status}</Badge>
            )}
          </div>

          {isMilestoneDetailsLoading && !milestoneDetails ? (
            <LoadingState title="Loading milestone details" />
          ) : (
            <>
              {isMilestoneDetailsError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Additional milestone details are unavailable. Grade information
                  is still shown below.
                </div>
              )}

              <div className="grid gap-2">
                <h3 className="m-0 text-sm font-bold text-foreground">
                  Milestone information
                </h3>
                <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
                  {milestoneDetails?.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                <DetailItem label="Term" value={milestoneDetails?.term ?? term} />
                <DetailItem
                  label="Course"
                  value={milestoneDetails?.courseCode ?? courseCode}
                />
                <DetailItem
                  label="Weight"
                  value={`${milestoneDetails?.weight ?? milestone.weight}%`}
                />
                <DetailItem
                  label="Max score"
                  value={milestoneDetails?.maxScore ?? milestone.maxScore}
                />
                <DetailItem
                  label="Deadline"
                  value={formatDateTime(milestoneDetails?.deadlineAt)}
                />
                <DetailItem
                  label="Position"
                  value={milestoneDetails?.position ?? "Not available"}
                />
                <DetailItem
                  label="Instructor"
                  value={milestoneDetails?.instructorName ?? "Not available"}
                />
                <DetailItem
                  label="Status"
                  value={milestoneDetails?.status ?? "Not available"}
                />
              </div>
            </>
          )}

          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4">
            <h3 className="m-0 text-sm font-bold text-foreground">
              Grade information
            </h3>
            {grade ? (
              <>
                <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                  <DetailItem
                    label="Group grade"
                    value={`${grade.score} / ${grade.maxScoreSnapshot}`}
                  />
                  <DetailItem
                    label="Graded at"
                    value={formatDateTime(grade.gradedAt)}
                  />
                  <DetailItem
                    label="My contribution"
                    value={
                      typeof currentStudentScore?.contributionPercent ===
                        "number" &&
                      Number.isFinite(currentStudentScore.contributionPercent)
                        ? `${currentStudentScore.contributionPercent}%`
                        : "Not available"
                    }
                  />
                  <DetailItem
                    label="My score"
                    value={formatScore(currentStudentScore?.calculatedScore)}
                  />
                </div>
                <div className="grid gap-1 rounded-xl border border-border bg-background p-3">
                  <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
                    Instructor feedback
                  </span>
                  <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                    {grade.feedback || "No feedback provided."}
                  </p>
                </div>
              </>
            ) : (
              <p className="m-0 text-sm text-muted">
                This milestone has not been graded yet.
              </p>
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 min-[900px]:max-h-[calc(100dvh-11rem)] min-[900px]:overflow-y-auto min-[761px]:p-5">
          <ContributionEditor
            canEdit={canEditContributions}
            currentStudentId={currentStudentId}
            groupId={groupId}
            leaderStudentId={leaderStudentId}
            members={members}
            milestoneId={milestone.milestoneId}
            milestoneTitle={milestone.title}
            readOnlyReason={readOnlyReason}
            agreementStatus={milestone.contributionAgreementStatus}
            contributionRevision={milestone.contributionRevision}
            approvedCount={milestone.approvedCount}
            requiredCount={milestone.requiredCount}
            isGraded={milestone.graded}
          />
        </section>
      </div>
    </ResponsiveDialog>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, TextInput } from "@/shared/components";
import { useUpdateContributions } from "../hooks";
import type { MemberRow } from "../types";

type ContributionEditorProps = {
  groupId: number;
  milestoneId: number;
  milestoneTitle: string;
  members: MemberRow[];
  canEdit?: boolean;
  currentStudentId?: number | null;
  leaderStudentId?: number | null;
  onSuccess?: () => void;
  readOnlyReason?: string;
};

function formatScore(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "Not available";
}

export function ContributionEditor({
  groupId,
  milestoneId,
  milestoneTitle,
  members,
  canEdit = true,
  currentStudentId,
  leaderStudentId,
  onSuccess,
  readOnlyReason,
}: ContributionEditorProps) {
  const [percents, setPercents] = useState<Record<number, number>>(() => {
    return members.reduce<Record<number, number>>((acc, member) => {
      // Find the percent for this milestone if it exists
      const score = member.milestoneScores.find(
        (m) => m.milestoneId === milestoneId
      );
      acc[member.studentId] =
        typeof score?.contributionPercent === "number" &&
        Number.isFinite(score.contributionPercent)
          ? score.contributionPercent
          : 0;
      return acc;
    }, {});
  });

  const updateContributionsMutation = useUpdateContributions(
    groupId,
    milestoneId
  );

  const total = Number(
    Object.values(percents)
      .reduce((sum, val) => sum + val, 0)
      .toFixed(2),
  );
  const error =
    total !== 100
      ? `Total percentage must equal exactly 100%. Current total is ${total}%.`
      : null;

  const handlePercentChange = (studentId: number, value: string) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setPercents((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSave = () => {
    if (!canEdit || total !== 100) return;

    updateContributionsMutation.mutate(
      {
        items: Object.entries(percents).map(([studentId, pct]) => ({
          studentId: Number(studentId),
          contributionPercent: pct,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Contributions updated successfully.");
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          toast.error(`Failed to save contributions: ${err.message}`);
        },
      }
    );
  };

  return (
    <div className="grid min-w-0 gap-4">
      <div>
        <h3 className="m-0 text-base font-bold text-foreground">
          Member Contributions
        </h3>
        <p className="mt-1 mb-0 text-xs text-muted">
          {canEdit
            ? `Set each member's contribution for ${milestoneTitle}.`
            : readOnlyReason ??
              `Contribution details for ${milestoneTitle}.`}
        </p>
      </div>

      <div className="grid gap-3">
        {members.map((member) => {
          const memberScore = member.milestoneScores.find(
            (score) => score.milestoneId === milestoneId,
          );
          const isCurrentStudent = member.studentId === currentStudentId;
          const isLeader = member.studentId === leaderStudentId;

          return (
            <div
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border bg-background p-3 max-[480px]:grid-cols-1"
              key={member.studentId}
            >
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <strong className="break-words text-sm font-bold text-foreground">
                    {member.studentName}
                  </strong>
                  {isCurrentStudent && <Badge tone="brand">You</Badge>}
                  {isLeader && <Badge tone="neutral">Leader</Badge>}
                </div>
                <p className="m-0 mt-0.5 text-xs text-muted">
                  {member.studentCode}
                  {memberScore && (
                    <span>
                      {" "}
                      · Individual score {formatScore(memberScore.calculatedScore)}
                    </span>
                  )}
                </p>
              </div>

              {canEdit ? (
                <div className="flex items-center gap-2 max-[480px]:justify-self-start">
                  <div className="w-24">
                    <TextInput
                      aria-label={`${member.studentName} contribution percentage`}
                      max={100}
                      min={0}
                      onChange={(event) =>
                        handlePercentChange(member.studentId, event.target.value)
                      }
                      step="0.01"
                      type="number"
                      value={percents[member.studentId] ?? 0}
                    />
                  </div>
                  <span className="text-sm font-semibold text-muted">%</span>
                </div>
              ) : (
                <strong className="justify-self-end text-sm font-bold text-foreground max-[480px]:justify-self-start">
                  {typeof memberScore?.contributionPercent === "number" &&
                  Number.isFinite(memberScore.contributionPercent)
                    ? `${memberScore.contributionPercent}%`
                    : "Not set"}
                </strong>
              )}
            </div>
          );
        })}
      </div>

      {canEdit && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-normal text-red-700 font-semibold">
          {error}
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <span className="text-sm font-bold text-foreground">
            Total:{" "}
            <span className={total === 100 ? "text-green-600" : "text-red-600"}>
              {total}%
            </span>
          </span>
          <Button
            disabled={total !== 100 || updateContributionsMutation.isPending}
            onClick={handleSave}
          >
            {updateContributionsMutation.isPending
              ? "Saving..."
              : "Save Contributions"}
          </Button>
        </div>
      )}
    </div>
  );
}

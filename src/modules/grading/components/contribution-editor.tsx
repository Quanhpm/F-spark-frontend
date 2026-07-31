"use client";

import { useState } from "react";
import { Button, TextInput } from "@/shared/components";
import { useUpdateContributions } from "../hooks";
import type { MemberRow } from "../types";

type ContributionEditorProps = {
  groupId: number;
  milestoneId: number;
  milestoneTitle: string;
  members: MemberRow[];
  onSuccess?: () => void;
};

export function ContributionEditor({
  groupId,
  milestoneId,
  milestoneTitle,
  members,
  onSuccess,
}: ContributionEditorProps) {
  const [percents, setPercents] = useState<Record<number, number>>(() => {
    return members.reduce<Record<number, number>>((acc, member) => {
      // Find the percent for this milestone if it exists
      const score = member.milestoneScores.find(
        (m) => m.milestoneId === milestoneId
      );
      acc[member.studentId] = score ? score.contributionPercent : 0;
      return acc;
    }, {});
  });

  const updateContributionsMutation = useUpdateContributions(
    groupId,
    milestoneId
  );

  const total = Object.values(percents).reduce((sum, val) => sum + val, 0);
  const error =
    total !== 100
      ? `Total percentage must equal exactly 100%. Current total is ${total}%.`
      : null;

  const handlePercentChange = (studentId: number, value: string) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setPercents((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSave = () => {
    if (total !== 100) return;

    updateContributionsMutation.mutate(
      {
        items: Object.entries(percents).map(([studentId, pct]) => ({
          studentId: Number(studentId),
          contributionPercent: pct,
        })),
      },
      {
        onSuccess: () => {
          alert("Contributions updated successfully.");
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          alert(`Failed to save contributions: ${err.message}`);
        },
      }
    );
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div>
        <h3 className="m-0 text-base font-bold text-foreground">
          Member Contributions - {milestoneTitle}
        </h3>
        <p className="mt-1 mb-0 text-xs text-muted">
          Input the contribution percentage for each group member.
        </p>
      </div>

      <div className="grid gap-3">
        {members.map((member) => (
          <div
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-3"
            key={member.studentId}
          >
            <div className="min-w-0">
              <strong className="text-sm font-bold text-foreground">
                {member.studentName}
              </strong>
              <p className="m-0 text-xs text-muted">{member.studentCode}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20">
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  value={percents[member.studentId] ?? 0}
                  onChange={(e) =>
                    handlePercentChange(member.studentId, e.target.value)
                  }
                />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-normal text-red-700 font-semibold">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <span className="text-sm font-bold text-foreground">
          Total: <span className={total === 100 ? "text-green-600" : "text-red-600"}>{total}%</span>
        </span>
        <Button
          onClick={handleSave}
          disabled={total !== 100 || updateContributionsMutation.isPending}
        >
          {updateContributionsMutation.isPending
            ? "Saving..."
            : "Save Contributions"}
        </Button>
      </div>
    </div>
  );
}

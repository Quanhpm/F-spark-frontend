"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, TextInput } from "@/shared/components";
import { useRespondToContributions, useUpdateContributions } from "../hooks";
import type { MilestoneColumn } from "../types";
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
  agreementStatus: MilestoneColumn["contributionAgreementStatus"];
  contributionRevision: number;
  approvedCount: number;
  requiredCount: number;
  isGraded: boolean;
  readOnly?: boolean;
};

function formatScore(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "Not available";
}

function parsePercent(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
    ? parsed
    : null;
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
  agreementStatus,
  contributionRevision,
  approvedCount,
  requiredCount,
  isGraded,
  readOnly = false,
}: ContributionEditorProps) {
  const [changeReason, setChangeReason] = useState("");
  const [percents, setPercents] = useState<Record<number, string>>(() => {
    return members.reduce<Record<number, string>>((acc, member) => {
      // Find the percent for this milestone if it exists
      const score = member.milestoneScores.find(
        (m) => m.milestoneId === milestoneId
      );
      acc[member.studentId] =
        typeof score?.contributionPercent === "number" &&
        Number.isFinite(score.contributionPercent)
          ? String(score.contributionPercent)
          : "";
      return acc;
    }, {});
  });

  const updateContributionsMutation = useUpdateContributions(
    groupId,
    milestoneId
  );
  const responseMutation = useRespondToContributions(groupId, milestoneId);
  const currentScore = members.find((member) => member.studentId === currentStudentId)
    ?.milestoneScores.find((score) => score.milestoneId === milestoneId);
  const canRespond = !readOnly && !isGraded && contributionRevision > 0 && agreementStatus !== "CHANGES_REQUESTED";
  const hasInvalidPercent = members.some(
    (member) => parsePercent(percents[member.studentId] ?? "") === null,
  );

  const handlePercentChange = (studentId: number, value: string) => {
    setPercents((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSave = () => {
    if (!canEdit) return;

    const items = members.map((member) => {
      const contributionPercent = parsePercent(
        percents[member.studentId] ?? "",
      );
      return contributionPercent === null
        ? null
        : { studentId: member.studentId, contributionPercent };
    });
    if (items.some((item) => item === null)) {
      toast.error("Enter a contribution from 0% to 100% for every member.");
      return;
    }

    updateContributionsMutation.mutate(
      {
        items: items.filter((item) => item !== null),
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
            ? `Rate each member independently from 0% to 100% for ${milestoneTitle}. Percentages do not need to add up to 100%.`
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
                      · Individual milestone score {formatScore(memberScore.calculatedScore)}
                    </span>
                  )}
                </p>
                <Badge size="sm" tone={memberScore?.agreementDecision === "AGREE" ? "success" : memberScore?.agreementDecision === "REQUEST_CHANGES" ? "danger" : "neutral"}>
                  {memberScore?.agreementDecision === "AGREE" ? "Agreed" : memberScore?.agreementDecision === "REQUEST_CHANGES" ? "Changes requested" : "Pending agreement"}
                </Badge>
                {memberScore?.agreementReason && <p className="m-0 mt-1 text-xs text-red-700">{memberScore.agreementReason}</p>}
              </div>

              {canEdit ? (
                <div className="flex items-center gap-2 max-[480px]:justify-self-start">
                  <div className="w-24">
                    <TextInput
                      aria-label={`${member.studentName} contribution percentage`}
                      error={
                        parsePercent(percents[member.studentId] ?? "") === null
                          ? (percents[member.studentId] ?? "").trim()
                            ? "0–100 only"
                            : "Required"
                          : undefined
                      }
                      max={100}
                      min={0}
                      onChange={(event) =>
                        handlePercentChange(member.studentId, event.target.value)
                      }
                      step="0.01"
                      type="number"
                      value={percents[member.studentId] ?? ""}
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

      <div className="grid gap-3 rounded-xl border border-border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong>Revision {contributionRevision || "–"}</strong>
          <Badge tone={agreementStatus === "AGREED" ? "success" : agreementStatus === "CHANGES_REQUESTED" ? "danger" : "warning"}>{agreementStatus.replaceAll("_", " ")}</Badge>
        </div>
        <p className="m-0 text-sm text-muted">{approvedCount}/{requiredCount} active members agreed. Every member, including the leader, must agree.</p>
        {canRespond && <div className="grid gap-2">
          <TextInput label="Reason when requesting changes" maxLength={1000} value={changeReason} onChange={(event) => setChangeReason(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={responseMutation.isPending || currentScore?.agreementDecision === "AGREE"} onClick={() => responseMutation.mutate({ decision: "AGREE" })}>Agree</Button>
            <Button size="sm" variant="danger" disabled={responseMutation.isPending || !changeReason.trim()} onClick={() => responseMutation.mutate({ decision: "REQUEST_CHANGES", reason: changeReason.trim() })}>Request changes</Button>
          </div>
        </div>}
        {agreementStatus === "CHANGES_REQUESTED" && <p className="m-0 text-sm font-semibold text-red-700">The leader must save a new revision before members can respond again.</p>}
      </div>

      {canEdit && (
        <div className="flex flex-wrap justify-end gap-3 border-t border-border/60 pt-4">
          <Button
            disabled={
              updateContributionsMutation.isPending || hasInvalidPercent
            }
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

"use client";

import { AlertTriangle, Eye, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  ActionConfirmDialog,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useGradeModeration, useSaveGradeModeration, useSelectModeratedMilestone } from "../hooks";
import type {
  GradeModerationChange,
  GradeModerationInstructor,
  GradeModerationOverviewDto,
  GradeModerationSetting,
  GradeModerationType,
} from "../types";

type GradeModerationCardProps = {
  courseCode: string;
  term: string;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

/** Accepts "0.25" and "0,25"; returns null when the value is not allowed for the type. */
export function parseModerationValue(type: GradeModerationType, raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const value = Number(text);
  return value <= (type === "PERCENT" ? 100 : 10) ? value : null;
}

export function formatModeration(setting: GradeModerationSetting) {
  return setting.type === "PERCENT" ? `× ${setting.value}%` : `− ${setting.value} points`;
}

function isNeutral(setting: GradeModerationSetting) {
  return setting.type === "PERCENT" ? setting.value === 100 : setting.value === 0;
}

function formatScore(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat("en", { maximumFractionDigits: 4 }).format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function MilestonePicker({
  instructor,
  onSelect,
  pending,
}: {
  instructor: GradeModerationInstructor;
  onSelect: (milestoneId: number) => void;
  pending: boolean;
}) {
  const [picked, setPicked] = useState(instructor.milestoneId === null ? "" : String(instructor.milestoneId));
  const changed = picked !== "" && Number(picked) !== instructor.milestoneId;

  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5">
      <span className="w-40 min-w-0 break-words text-sm font-medium text-foreground">
        {instructor.instructorLabel}
        <span className="block text-xs font-normal text-muted">
          {instructor.groupCount} group{instructor.groupCount === 1 ? "" : "s"}
        </span>
      </span>
      {instructor.options.length === 0 ? (
        <span className="text-sm text-muted">No milestones yet</span>
      ) : (
        <>
          <select
            aria-label={`Moderated milestone of ${instructor.instructorLabel}`}
            className="h-10 min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand-secondary"
            disabled={pending}
            onChange={(event) => setPicked(event.target.value)}
            value={picked}
          >
            <option disabled value="">
              Choose a milestone
            </option>
            {instructor.options.map((option) => (
              <option key={option.milestoneId} value={option.milestoneId}>
                {option.title} ({option.weight ?? 0}%)
              </option>
            ))}
          </select>
          <Button disabled={!changed || pending} onClick={() => onSelect(Number(picked))} size="sm" variant="secondary">
            Use this milestone
          </Button>
        </>
      )}
    </div>
  );
}

function Warnings({ overview }: { overview: GradeModerationOverviewDto }) {
  const lines = [
    { label: "not graded yet", status: "UNGRADED" },
    { label: "without a grading instructor", status: "NO_INSTRUCTOR" },
    { label: `whose instructor has no ${overview.milestoneTitle} chosen`, status: "NO_MILESTONE" },
  ]
    .map(({ label, status }) => ({ groups: overview.groups.filter((group) => group.status === status), label }))
    .filter(({ groups }) => groups.length > 0);
  if (lines.length === 0) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="grid min-w-0 gap-1">
        <strong>
          {overview.gradedGroups}/{overview.totalGroups} groups are graded.
          {overview.editable && " You can still save; groups graded later are moderated the same way."}
        </strong>
        {lines.map(({ groups, label }) => (
          <details key={label}>
            <summary className="cursor-pointer">
              {groups.length} group{groups.length === 1 ? "" : "s"} {label}
            </summary>
            <span className="text-xs">
              {groups
                .map((group) => `${group.groupNo ?? "?"} ${group.groupName}${group.instructorLabel ? ` (${group.instructorLabel})` : ""}`)
                .join(", ")}
            </span>
          </details>
        ))}
      </div>
    </div>
  );
}

function History({ history }: { history: GradeModerationChange[] }) {
  if (history.length === 0) return null;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-foreground">History ({history.length})</summary>
      <ul className="m-0 mt-2 grid list-none gap-1 p-0 text-xs text-muted">
        {history.map((change, index) => (
          <li key={`${change.changedAt}-${index}`}>
            {formatDateTime(change.changedAt)} · {isNeutral(change) ? "As graded" : formatModeration(change)}
            {change.changedByEmail && ` · ${change.changedByEmail}`}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function GradeModerationCard({ courseCode, term }: GradeModerationCardProps) {
  const [type, setType] = useState<GradeModerationType>("PERCENT");
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState<GradeModerationSetting | null>(null);
  const [confirming, setConfirming] = useState<GradeModerationSetting | null>(null);

  const overviewQuery = useGradeModeration({ courseCode, term }, preview);
  const saveMutation = useSaveGradeModeration({ courseCode, term });
  const selectMutation = useSelectModeratedMilestone({ courseCode, term });
  const overview = overviewQuery.data?.data;
  const parsed = parseModerationValue(type, value);
  const valueError =
    value.trim() && parsed === null
      ? `0–${type === "PERCENT" ? 100 : 10}, up to 2 decimals`
      : undefined;

  async function handleSave(setting: GradeModerationSetting) {
    await saveMutation.mutateAsync(setting);
    setPreview(null);
    setValue("");
    toast.success(
      isNeutral(setting)
        ? `${courseCode}: scores now count as graded.`
        : `${courseCode}: moderation ${formatModeration(setting)} saved.`,
    );
  }

  async function handleSelect(milestoneId: number) {
    try {
      await selectMutation.mutateAsync(milestoneId);
      toast.success("Moderated milestone selected.");
    } catch (error) {
      toast.error(errorMessage(error, "Unable to select the milestone."));
    }
  }

  const missing = overview?.instructors.filter((instructor) => instructor.milestoneId === null) ?? [];
  const chosen = overview?.instructors.filter((instructor) => instructor.milestoneId !== null) ?? [];
  const previewing = Boolean(preview) && !overviewQuery.isPlaceholderData;

  return (
    <Card>
      <CardHeader
        actions={
          overview && (
            <Badge tone={overview.current ? "brand" : "neutral"}>
              {overview.current ? `Now ${formatModeration(overview.current)}` : "As graded"}
            </Badge>
          )
        }
        description={`Adjusts every group's ${overview?.milestoneTitle ?? "final milestone"} score in ${term}; each member's contribution share is taken afterwards. The scores given by the instructors are kept, so this can be changed or removed at any time while the term is open.`}
        title={`Moderation · ${courseCode}${overview ? ` ${overview.milestoneTitle}` : ""}`}
      />
      <CardContent className="grid gap-4">
        {overviewQuery.isLoading ? (
          <LoadingState title="Loading moderation" />
        ) : overviewQuery.isError || !overview ? (
          <EmptyState
            description={errorMessage(overviewQuery.error, "Unable to load moderation.")}
            title="Unable to load moderation"
          />
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <Select
                disabled={!overview.editable}
                fieldClassName="w-48"
                id={`moderation-type-${courseCode}`}
                label="Method"
                onChange={(event) => {
                  setType(event.target.value as GradeModerationType);
                  setPreview(null);
                }}
                value={type}
              >
                <option value="PERCENT">Multiply by %</option>
                <option value="POINTS">Subtract points</option>
              </Select>
              <div className="w-44">
                <TextInput
                  disabled={!overview.editable}
                  error={valueError}
                  inputMode="decimal"
                  label={type === "PERCENT" ? "Percentage" : "Points to subtract"}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setPreview(null);
                  }}
                  placeholder={type === "PERCENT" ? "80" : "0.25"}
                  value={value}
                />
              </div>
              <Button
                disabled={parsed === null || overviewQuery.isFetching}
                icon={<Eye size={15} />}
                onClick={() => parsed !== null && setPreview({ type, value: parsed })}
                variant="secondary"
              >
                Preview
              </Button>
              <Button
                disabled={!overview.editable || parsed === null}
                icon={<Save size={15} />}
                onClick={() => parsed !== null && setConfirming({ type, value: parsed })}
              >
                Save
              </Button>
              {overview.current && (
                <Button
                  disabled={!overview.editable}
                  icon={<RotateCcw size={15} />}
                  onClick={() => setConfirming({ type: "PERCENT", value: 100 })}
                  variant="ghost"
                >
                  Remove moderation
                </Button>
              )}
            </div>
            <p className="m-0 text-xs text-muted">
              Both methods work on the group score: 80% turns 10 into 8 and 8 into 6.4; subtracting 0.25 turns 10 into
              9.75 and 8 into 7.75. 100% or 0 points leaves the scores as graded. Scores never go below 0.
              {!overview.editable && " This term is closed, so moderation can no longer be changed."}
            </p>

            <Warnings overview={overview} />

            {missing.length > 0 && (
              <div className="rounded-xl border border-amber-200 px-4 py-3">
                <strong className="text-sm text-foreground">Choose {overview.milestoneTitle} for these instructors</strong>
                <p className="m-0 text-xs text-muted">
                  They named their milestones differently, so the system cannot tell which one is {overview.milestoneTitle}.
                </p>
                {missing.map((instructor) => (
                  <MilestonePicker
                    instructor={instructor}
                    key={instructor.instructorId}
                    onSelect={handleSelect}
                    pending={!overview.editable || selectMutation.isPending}
                  />
                ))}
              </div>
            )}

            {overview.groups.length === 0 ? (
              <EmptyState description="No groups with members in this course yet." title="No groups" />
            ) : (
              <div className="max-h-96 overflow-auto rounded-xl border border-border">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b border-border text-left text-xs text-muted">
                      <th className="px-3 py-2 font-medium">Group</th>
                      <th className="px-3 py-2 font-medium">Instructor</th>
                      <th className="px-3 py-2 font-medium">Milestone</th>
                      <th className="px-3 py-2 text-right font-medium">Before</th>
                      <th className="px-3 py-2 text-right font-medium">After{previewing && " (preview)"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.groups.map((group) => (
                      <tr className="border-b border-border last:border-0" key={group.groupId}>
                        <td className="px-3 py-2 text-foreground">
                          {group.groupNo} · {group.groupName}
                        </td>
                        <td className="px-3 py-2 text-muted">{group.instructorLabel ?? "—"}</td>
                        <td className="px-3 py-2 text-muted">{group.milestoneTitle ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">
                          {group.status === "GRADED" ? formatScore(group.scoreBefore) : "Not graded"}
                        </td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums text-foreground">
                          {formatScore(group.scoreAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {chosen.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-foreground">
                  {overview.milestoneTitle} of each instructor ({chosen.length})
                </summary>
                {chosen.map((instructor) => (
                  <MilestonePicker
                    instructor={instructor}
                    key={`${instructor.instructorId}-${instructor.milestoneId}`}
                    onSelect={handleSelect}
                    pending={!overview.editable || selectMutation.isPending}
                  />
                ))}
              </details>
            )}
            <History history={overview.history} />
          </>
        )}
      </CardContent>

      {confirming && overview && (
        <ActionConfirmDialog
          confirmLabel={isNeutral(confirming) ? "Remove moderation" : "Save moderation"}
          description={
            isNeutral(confirming)
              ? `All ${overview.totalGroups} groups of ${courseCode} in ${term} go back to the ${overview.milestoneTitle} scores given by their instructors.`
              : `${formatModeration(confirming)} will apply to the ${overview.milestoneTitle} score of all ${overview.totalGroups} groups of ${courseCode} in ${term} (${overview.gradedGroups} graded so far) and change their final totals.`
          }
          onClose={() => setConfirming(null)}
          onConfirm={() => handleSave(confirming)}
          pendingLabel="Saving..."
          title={isNeutral(confirming) ? "Remove moderation?" : "Save moderation?"}
          tone="default"
        />
      )}
    </Card>
  );
}

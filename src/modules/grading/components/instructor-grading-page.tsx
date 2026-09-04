"use client";

import { useId, useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import { Download, Edit3, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { useExportGradesCsv, useGradeGroup, useGroupGradeMatrix } from "../hooks";
import { useInstructorMilestoneDashboard } from "@/modules/dashboards";
import type { DashboardMilestoneStatusDto } from "@/modules/dashboards";
import { useInstructorGroups } from "@/modules/groups";

type GradeModalProps = {
  groupId: number;
  groupName: string;
  milestoneId: number;
  milestoneTitle: string;
  onClose: () => void;
};

function GradeModal({
  groupId,
  groupName,
  milestoneId,
  milestoneTitle,
  onClose,
}: GradeModalProps) {
  const formId = useId();
  const { data: matrixResponse, isLoading } = useGroupGradeMatrix(groupId);
  const matrix = matrixResponse?.data;

  // Find the milestone column
  const column = matrix?.milestones.find((m) => m.milestoneId === milestoneId);
  const maxScore = column?.maxScore ?? 10;
  const isContributionsComplete = column?.contributionsComplete ?? false;
  const contributionsAgreed = column?.contributionAgreementStatus === "AGREED";
  const canGrade = isContributionsComplete && contributionsAgreed;
  
  const [score, setScore] = useState<number>(() => column?.groupGrade?.score ?? 0);
  const [feedback, setFeedback] = useState<string>(() => column?.groupGrade?.feedback ?? "");

  // Update form when data loads
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (column?.groupGrade) {
      setScore(column.groupGrade.score);
      setFeedback(column.groupGrade.feedback ?? "");
    }
  }, [column]);

  const gradeMutation = useGradeGroup(milestoneId, groupId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 0 || score > maxScore) {
      toast.error(`Score must be between 0 and ${maxScore}.`);
      return;
    }

    gradeMutation.mutate(
      {
        score,
        feedback: feedback.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Grade submitted successfully.");
          onClose();
        },
        onError: (err) => {
          toast.error(`Failed to submit grade: ${err.message}`);
        },
      }
    );
  };

  return (
    <ResponsiveDialog
      bodyClassName="p-4 min-[761px]:p-6"
      className="max-[760px]:pt-[env(safe-area-inset-top)] min-[761px]:max-w-[680px]"
      closeLabel="Close grading form"
      footer={
        <>
          <Button
            disabled={gradeMutation.isPending}
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={gradeMutation.isPending || !canGrade}
            form={formId}
            type="submit"
          >
            {gradeMutation.isPending ? "Submitting..." : "Save Grade"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title="Grade Group Milestone"
      description={`${groupName} · ${milestoneTitle}`}
    >
        {isLoading ? (
          <div className="grid min-h-60 place-items-center">
            <LoadingState title="Loading grade matrix..." />
          </div>
        ) : (
          <form className="grid gap-6" id={formId} onSubmit={handleSubmit}>
            <div className="grid gap-4 rounded-xl border border-border bg-background p-4">
              <h4 className="m-0 text-sm font-bold text-foreground">Group Members &amp; Contributions</h4>
              <div className="divide-y divide-border/60">
                {matrix?.members.map((member) => {
                  const mScore = member.milestoneScores.find((ms) => ms.milestoneId === milestoneId);
                  const hasContribution =
                    typeof mScore?.contributionPercent === "number" &&
                    Number.isFinite(mScore.contributionPercent);
                  const decision = mScore?.agreementDecision;
                  return (
                    <div className="py-2.5 flex items-center justify-between text-sm" key={member.studentId}>
                      <div>
                        <span className="font-bold text-foreground">{member.studentName}</span>
                        <span className="text-xs text-muted ml-2 font-mono">{member.studentCode}</span>
                      </div>
                      <Badge tone={hasContribution ? "brand" : "neutral"} size="sm">
                        {hasContribution
                          ? `${mScore.contributionPercent}%`
                          : "Not submitted"}
                      </Badge>
                      <Badge tone={decision === "AGREE" ? "success" : decision === "REQUEST_CHANGES" ? "danger" : "neutral"} size="sm">
                        {decision === "AGREE" ? "Agreed" : decision === "REQUEST_CHANGES" ? "Changes requested" : "Pending"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {!canGrade && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="size-5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <h5 className="m-0 font-bold text-amber-950">Contribution chưa được toàn bộ thành viên đồng thuận</h5>
                  <p className="mt-1 mb-0 text-xs text-amber-900 leading-normal font-medium">
                    Đã đồng ý {column?.approvedCount ?? 0}/{column?.requiredCount ?? 0}. Nhóm trưởng cần nộp đủ tỷ lệ và mọi thành viên, kể cả nhóm trưởng, phải bấm Agree trước khi chấm.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <TextInput
                label={`Score (0 - ${maxScore})`}
                type="number"
                min={0}
                max={maxScore}
                step={0.1}
                required
                value={score}
                onChange={(e) => setScore(Number(e.target.value) || 0)}
                disabled={!canGrade}
              />

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
                  Feedback / Comments
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter comments, suggestions or required updates for this milestone..."
                  className="min-h-[120px] w-full rounded-xl border border-border bg-surface p-3 text-base text-foreground outline-none transition-[border-color,box-shadow] focus:border-brand-secondary focus:shadow-[0_0_0_4px_rgba(237,161,47,0.12)] min-[761px]:text-sm disabled:bg-neutral-50/80 disabled:cursor-not-allowed"
                  disabled={!canGrade}
                />
              </div>
            </div>
          </form>
        )}
    </ResponsiveDialog>
  );
}

type InstructorGradingPageProps = {
  initialGroupId?: number | null;
  initialMilestoneId?: number | null;
};

const defaultCourseCodes = ["EXE101", "EXE201", "EXE401"] as const;

function buildCourseOptions(courses: string[]) {
  const values = new Set<string>(defaultCourseCodes);
  courses.forEach((course) => {
    const trimmed = course.trim();
    if (trimmed) values.add(trimmed);
  });

  return Array.from(values);
}

function formatMatrixScore(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function InstructorGradingPage({
  initialGroupId,
  initialMilestoneId,
}: InstructorGradingPageProps = {}) {
  const [term, setTerm] = useState("");
  const [courseCode, setCourseCode] = useState("");

  const [activeGradeModal, setActiveGradeModal] = useState<{
    groupId: number;
    groupName: string;
    milestoneId: number;
    milestoneTitle: string;
  } | null>(null);

  const instructorGroupsQuery = useInstructorGroups();
  const assignedGroups = useMemo(
    () => instructorGroupsQuery.data?.data ?? [],
    [instructorGroupsQuery.data?.data],
  );
  const termOptions = useMemo(
    () =>
      Array.from(
        new Set(assignedGroups.map((group) => group.term).filter(Boolean)),
      ).sort(),
    [assignedGroups],
  );
  const courseOptions = useMemo(
    () =>
      buildCourseOptions(
        assignedGroups.map((group) => group.courseCode).filter(Boolean),
      ),
    [assignedGroups],
  );

  const { data: dashboardResponse, isLoading } =
    useInstructorMilestoneDashboard({
      courseCode: courseCode.trim() || undefined,
      term: term.trim() || undefined,
    });

  const milestoneStatuses = useMemo(
    () => dashboardResponse?.data ?? [],
    [dashboardResponse?.data]
  );

  const exportMutation = useExportGradesCsv();

  // Group status values by groupId
  const groupedData = useMemo(() => {
    const groupsMap = new Map<
      number,
      {
        groupId: number;
        groupName: string;
        groupNo: string;
        milestones: Record<number, DashboardMilestoneStatusDto>;
      }
    >();

    milestoneStatuses.forEach((status) => {
      if (!groupsMap.has(status.groupId)) {
        groupsMap.set(status.groupId, {
          groupId: status.groupId,
          groupName: status.groupName,
          groupNo: status.groupNo,
          milestones: {},
        });
      }
      groupsMap.get(status.groupId)!.milestones[status.milestoneId] = status;
    });

    return Array.from(groupsMap.values());
  }, [milestoneStatuses]);

  // Extract all unique milestone titles
  const milestonesList = useMemo(() => {
    const list: { milestoneId: number; milestoneTitle: string }[] = [];
    const seen = new Set<number>();
    milestoneStatuses.forEach((status) => {
      if (!seen.has(status.milestoneId)) {
        seen.add(status.milestoneId);
        list.push({
          milestoneId: status.milestoneId,
          milestoneTitle: status.milestoneTitle,
        });
      }
    });
    return list;
  }, [milestoneStatuses]);

  const matrixSummary = useMemo(() => {
    let gradedCount = 0;
    let ungradedCount = 0;

    groupedData.forEach((row) => {
      milestonesList.forEach((milestone) => {
        const status = row.milestones[milestone.milestoneId];
        if (!status) return;

        if (status.graded) {
          gradedCount += 1;
        } else {
          ungradedCount += 1;
        }
      });
    });

    return {
      gradedCount,
      groupCount: groupedData.length,
      milestoneCount: milestonesList.length,
      ungradedCount,
    };
  }, [groupedData, milestonesList]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!initialGroupId || !initialMilestoneId) return;
    const group = groupedData.find((item) => item.groupId === initialGroupId);
    const status = group?.milestones[initialMilestoneId];
    if (!group || !status) return;
    setActiveGradeModal({
      groupId: group.groupId,
      groupName: group.groupName,
      milestoneId: initialMilestoneId,
      milestoneTitle: status.milestoneTitle,
    });
  }, [groupedData, initialGroupId, initialMilestoneId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleExportCsv = () => {
    exportMutation.mutate({
      courseCode: courseCode.trim() || undefined,
      term: term.trim() || undefined,
    });
  };

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Grading Matrix"
          description="Evaluate graduation thesis group submissions and review milestones grades."
        />
        <Button
          variant="secondary"
          onClick={handleExportCsv}
          disabled={exportMutation.isPending || groupedData.length === 0}
          size="md"
        >
          <Download className="size-4 mr-1.5" />
          <span>{exportMutation.isPending ? "Exporting..." : "Export CSV"}</span>
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Filter and Export"
          description="Leave filters empty to show all assigned groups and milestones."
        />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <Select
              label="Academic Term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              <option value="">All terms</option>
              {termOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select
              label="Course Code"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
            >
              <option value="">All courses</option>
              {courseOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>

        {isLoading ? (
          <CardContent>
            <LoadingState title="Loading grading matrix..." />
          </CardContent>
        ) : groupedData.length > 0 ? (
          <>
            <CardContent className="border-t border-border">
              <div className="grid grid-cols-4 gap-3 max-[860px]:grid-cols-2 max-[520px]:grid-cols-1">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted">
                    Groups
                  </div>
                  <div className="mt-1 text-2xl font-bold text-foreground">
                    {matrixSummary.groupCount}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted">
                    Milestones
                  </div>
                  <div className="mt-1 text-2xl font-bold text-foreground">
                    {matrixSummary.milestoneCount}
                  </div>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50/70 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-green-800">
                    Graded cells
                  </div>
                  <div className="mt-1 text-2xl font-bold text-green-900">
                    {matrixSummary.gradedCount}
                  </div>
                </div>
                <div className="rounded-xl border border-yellow-200 bg-yellow-50/70 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-yellow-800">
                    Ungraded cells
                  </div>
                  <div className="mt-1 text-2xl font-bold text-yellow-900">
                    {matrixSummary.ungradedCount}
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="max-h-[70vh] overflow-auto border-t border-border">
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-30 w-52 border-b border-r border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted shadow-[8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                    Group
                  </th>
                  {milestonesList.map((m) => (
                    <th className="sticky top-0 z-20 min-w-44 border-b border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted" key={m.milestoneId}>
                      {m.milestoneTitle}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {groupedData.map((row) => (
                  <tr className="group odd:bg-surface even:bg-background hover:bg-brand-primary/5" key={row.groupId}>
                    <td className="sticky left-0 z-10 border-r border-b border-border bg-inherit px-4 py-3 font-bold text-foreground shadow-[8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="max-w-44 break-words">{row.groupName}</div>
                      <div className="mt-1 text-xs font-normal text-muted">{row.groupNo}</div>
                    </td>

                    {milestonesList.map((m) => {
                      const status = row.milestones[m.milestoneId];
                      if (!status) {
                        return (
                          <td className="border-b border-border px-4 py-3 text-xs text-muted" key={m.milestoneId}>
                            <span className="inline-flex rounded-full border border-border bg-background px-2 py-1 italic">
                              No timeline setup
                            </span>
                          </td>
                        );
                      }
                      const scoreLabel =
                        status.graded && status.score !== null
                          ? `${formatMatrixScore(status.score)}${
                              status.maxScoreSnapshot !== null
                                ? `/${formatMatrixScore(status.maxScoreSnapshot)}`
                                : ""
                            }`
                          : null;

                      return (
                        <td className="border-b border-border px-4 py-3 align-top" key={m.milestoneId}>
                          <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm transition-colors group-hover:border-orange-200 group-hover:bg-orange-50/40">
                            <div className="flex min-w-0 flex-wrap items-center gap-1">
                              {status.graded ? (
                                <Badge tone="success" size="sm" icon={<CheckCircle size={12} />} className="justify-start">
                                  Graded
                                </Badge>
                              ) : (
                                <Badge tone="warning" size="sm" icon={<AlertCircle size={12} />} className="justify-start">
                                  Ungraded
                                </Badge>
                              )}

                              {status.submitted && (
                                <Badge tone="brand" size="sm" icon={<FileText size={12} />} className="justify-start">
                                  Submitted
                                </Badge>
                              )}

                              {status.late && (
                                <Badge tone="danger" size="sm">
                                  Late
                                </Badge>
                              )}
                            </div>

                            {scoreLabel && (
                              <div
                                className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-sm font-extrabold text-green-900"
                                title="Group score"
                              >
                                {scoreLabel}
                              </div>
                            )}

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setActiveGradeModal({
                                  groupId: row.groupId,
                                  groupName: row.groupName,
                                  milestoneId: m.milestoneId,
                                  milestoneTitle: m.milestoneTitle,
                                })
                              }
                              className="h-8 shrink-0 !border-orange-500 !bg-orange-500 px-3 text-xs font-bold !text-white shadow-sm hover:!border-orange-600 hover:!bg-orange-600"
                            >
                              <Edit3 className="size-3" />
                              <span>Grade</span>
                            </Button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <CardContent>
            <EmptyState
              title="No groups found"
              description="No student groups are assigned to you for this term and course."
            />
          </CardContent>
        )}
      </Card>

      {activeGradeModal && (
        <GradeModal
          groupId={activeGradeModal.groupId}
          groupName={activeGradeModal.groupName}
          milestoneId={activeGradeModal.milestoneId}
          milestoneTitle={activeGradeModal.milestoneTitle}
          onClose={() => setActiveGradeModal(null)}
        />
      )}
    </div>
  );
}

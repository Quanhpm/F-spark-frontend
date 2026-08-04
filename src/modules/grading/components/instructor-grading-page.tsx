"use client";

import { useState, useMemo, useEffect } from "react";
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
  TextInput,
} from "@/shared/components";
import { Download, Edit3, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { useExportGradesCsv, useGradeGroup, useGroupGradeMatrix } from "../hooks";
import { useInstructorMilestoneDashboard } from "@/modules/dashboards";
import type { DashboardMilestoneStatusDto } from "@/modules/dashboards";

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
  const { data: matrixResponse, isLoading } = useGroupGradeMatrix(groupId);
  const matrix = matrixResponse?.data;

  // Find the milestone column
  const column = matrix?.milestones.find((m) => m.milestoneId === milestoneId);
  const maxScore = column?.maxScore ?? 10;
  
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
  /* eslint-enable react-hooks/set-state-in-effect */

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
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(26,26,26,0.36)]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-[min(540px,100%)] bg-surface shadow-2xl border-l border-border flex flex-col">
        <header className="border-b border-border px-6 py-5 flex items-center justify-between bg-surface-base">
          <div>
            <h3 className="m-0 text-base font-bold text-foreground">
              Grade Group Milestone
            </h3>
            <p className="m-0 text-xs text-muted">
              {groupName} &bull; {milestoneTitle}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} size="sm">
            Close
          </Button>
        </header>

        {isLoading ? (
          <div className="flex-1 grid place-items-center">
            <LoadingState title="Loading grade matrix..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid gap-4 rounded-xl border border-border bg-background p-4">
              <h4 className="m-0 text-sm font-bold text-foreground">Group Members &amp; Contributions</h4>
              <div className="divide-y divide-border/60">
                {matrix?.members.map((member) => {
                  const mScore = member.milestoneScores.find((ms) => ms.milestoneId === milestoneId);
                  return (
                    <div className="py-2.5 flex items-center justify-between text-sm" key={member.studentId}>
                      <div>
                        <span className="font-bold text-foreground">{member.studentName}</span>
                        <span className="text-xs text-muted ml-2 font-mono">{member.studentCode}</span>
                      </div>
                      <Badge tone={mScore?.contributionPercent ? "brand" : "neutral"} size="sm">
                        {mScore ? `${mScore.contributionPercent}%` : "Not submitted"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

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
              />

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Feedback / Comments
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter comments, suggestions or required updates for this milestone..."
                  className="w-full rounded-xl border border-border bg-surface p-3 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none min-h-[120px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button type="button" variant="secondary" onClick={onClose} disabled={gradeMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={gradeMutation.isPending}>
                {gradeMutation.isPending ? "Submitting..." : "Save Grade"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

export function InstructorGradingPage() {
  const [term, setTerm] = useState("SU24");
  const [courseCode, setCourseCode] = useState("EXE101");

  const [activeGradeModal, setActiveGradeModal] = useState<{
    groupId: number;
    groupName: string;
    milestoneId: number;
    milestoneTitle: string;
  } | null>(null);

  const { data: dashboardResponse, isLoading } = useInstructorMilestoneDashboard({
    term,
    courseCode,
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

  const handleExportCsv = () => {
    exportMutation.mutate({ term, courseCode });
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
          description="Choose a term and course to see the groups."
        />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <TextInput
              label="Academic Term"
              value={term}
              onChange={(e) => setTerm(e.target.value.toUpperCase())}
            />
            <TextInput
              label="Course Code"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
            />
          </div>
        </CardContent>

        {isLoading ? (
          <CardContent>
            <LoadingState title="Loading grading matrix..." />
          </CardContent>
        ) : groupedData.length > 0 ? (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface-base">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-48">Group</th>
                  {milestonesList.map((m) => (
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-44" key={m.milestoneId}>
                      {m.milestoneTitle}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {groupedData.map((row) => (
                  <tr className="hover:bg-neutral-50/50 transition-colors" key={row.groupId}>
                    <td className="px-5 py-4 font-bold text-foreground">
                      <div>{row.groupName}</div>
                      <div className="text-xs text-muted font-normal mt-0.5">{row.groupNo}</div>
                    </td>

                    {milestonesList.map((m) => {
                      const status = row.milestones[m.milestoneId];
                      if (!status) {
                        return (
                          <td className="px-5 py-4 text-muted text-xs italic" key={m.milestoneId}>
                            No timeline setup
                          </td>
                        );
                      }

                      return (
                        <td className="px-5 py-4" key={m.milestoneId}>
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {status.submitted ? (
                                <Badge tone="brand" size="sm" icon={<FileText size={12} />}>
                                  Submitted
                                </Badge>
                              ) : (
                                <Badge tone="neutral" size="sm">
                                  Not Submitted
                                </Badge>
                              )}

                              {status.graded ? (
                                <Badge tone="success" size="sm" icon={<CheckCircle size={12} />}>
                                  Graded
                                </Badge>
                              ) : (
                                <Badge tone="warning" size="sm" icon={<AlertCircle size={12} />}>
                                  Ungraded
                                </Badge>
                              )}

                              {status.late && (
                                <Badge tone="danger" size="sm">
                                  Late
                                </Badge>
                              )}
                            </div>

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
                              className="h-8 text-xs font-bold self-start mt-0.5"
                            >
                              <Edit3 className="size-3 mr-1" />
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

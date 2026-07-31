"use client";

import { useMemo, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";

import {
  useStudentDashboardProgress,
  useStudentDashboardProjects,
  useStudentMilestoneDashboard,
} from "../hooks";
import type {
  DashboardCheckpointDto,
  DashboardGroupProgressDto,
  DashboardProjectDto,
  DashboardStatsDto,
} from "../types";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load dashboard data.";
}

function formatDate(value: string | null) {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getPriorityTone(priority: DashboardCheckpointDto["priority"]) {
  if (priority === "URGENT" || priority === "HIGH") return "danger" as const;
  if (priority === "MEDIUM") return "warning" as const;
  return "neutral" as const;
}

function getStatusTone(status: DashboardCheckpointDto["status"]) {
  if (status === "DONE") return "success" as const;
  if (status === "IN_PROGRESS" || status === "REVIEW") return "warning" as const;
  return "neutral" as const;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-l-4 border-l-brand-primary" isPadded>
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
            {label}
          </span>
          <strong className="text-2xl leading-none font-bold text-foreground">
            {value}
          </strong>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-warm text-brand-primary">
          {icon}
        </span>
      </div>
    </Card>
  );
}

function StatsOverview({ stats }: { stats: DashboardStatsDto }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-4">
      <StatCard
        icon={<ClipboardList size={20} />}
        label="Total tasks"
        value={stats.totalTasks}
      />
      <StatCard
        icon={<CheckCircle2 size={20} />}
        label="Completed"
        value={stats.completedTasks}
      />
      <StatCard
        icon={<AlertTriangle size={20} />}
        label="Overdue"
        value={stats.overdueTasks}
      />
      <StatCard
        icon={<TrendingUp size={20} />}
        label="Progress"
        value={`${clampPercent(stats.progressPercent)}%`}
      />
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const percent = clampPercent(value);

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-background">
      <div
        className="h-full rounded-full bg-brand-primary transition-all duration-200"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function GroupProgressCard({ group }: { group: DashboardGroupProgressDto }) {
  return (
    <article className="grid gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h3 className="m-0 break-words text-base leading-snug font-bold text-foreground">
            {group.groupName}
          </h3>
          <p className="m-0 break-words text-sm text-muted">
            {group.term} - {group.courseCode} - {group.groupNo}
          </p>
        </div>
        <Badge tone={group.status === "ACTIVE" ? "success" : "neutral"}>
          {group.status}
        </Badge>
      </div>
      <p className="m-0 break-words text-sm leading-relaxed text-muted">
        {group.projectName ?? "No project selected yet"}
      </p>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="min-w-0 break-words text-muted">
            Tasks: {group.completedTasks}/{group.totalTasks} done
          </span>
          <strong className="text-foreground">
            {clampPercent(group.progressPercent)}%
          </strong>
        </div>
        <ProgressBar value={group.progressPercent} />
      </div>
      <div className="grid min-w-0 gap-1 text-sm text-muted">
        <span className="break-words">
          Mentor: {group.mentorName ?? "Unassigned"}
        </span>
        <span className="break-words">Next due: {formatDate(group.nextDueAt)}</span>
      </div>
    </article>
  );
}

function CheckpointCard({ checkpoint }: { checkpoint: DashboardCheckpointDto }) {
  return (
    <article
      className={cn(
        "grid gap-2 rounded-xl border bg-surface p-4",
        checkpoint.overdue ? "border-red-200" : "border-border",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h3 className="m-0 break-words text-sm leading-snug font-bold text-foreground">
            {checkpoint.title}
          </h3>
          <p className="m-0 break-words text-xs text-muted">
            {checkpoint.groupName}
          </p>
        </div>
        <Badge tone={getPriorityTone(checkpoint.priority)} size="sm">
          {checkpoint.priority}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span
          className={checkpoint.overdue ? "font-medium text-red-600" : "text-muted"}
        >
          {formatDate(checkpoint.dueAt)}
        </span>
        <Badge tone={getStatusTone(checkpoint.status)} size="sm">
          {checkpoint.status.replace("_", " ")}
        </Badge>
      </div>
    </article>
  );
}

function ProjectCard({ project }: { project: DashboardProjectDto }) {
  return (
    <article className="grid gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h3 className="m-0 break-words text-base leading-snug font-bold text-foreground">
            {project.projectName ?? "Untitled project"}
          </h3>
          <p className="m-0 break-words text-sm text-muted">
            {project.groupName} - {project.courseCode}
          </p>
        </div>
        <Badge tone={project.groupStatus === "ACTIVE" ? "success" : "neutral"}>
          {project.groupStatus}
        </Badge>
      </div>
      <p className="m-0 break-words text-sm leading-relaxed text-muted">
        {project.ideaDescription ?? "No idea description yet."}
      </p>
      <div className="grid gap-2">
        <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
          Progress {clampPercent(project.progressPercent)}%
        </span>
        <ProgressBar value={project.progressPercent} />
      </div>
      {project.researchDomain && (
        <span className="break-words text-sm text-muted">
          Domain: {project.researchDomain}
        </span>
      )}
    </article>
  );
}

export function StudentDashboardPage() {
  const progressQuery = useStudentDashboardProgress();
  const projectsQuery = useStudentDashboardProjects();

  const progress = progressQuery.data?.data;
  const projects = projectsQuery.data?.data ?? [];
  const isLoading = progressQuery.isLoading || projectsQuery.isLoading;
  const error = progressQuery.error ?? projectsQuery.error;

  const activeGroup = useMemo(() => {
    if (!progress || progress.groups.length === 0) return null;
    return (
      progress.groups.find((g) => g.status === "ACTIVE") ?? progress.groups[0]
    );
  }, [progress]);

  const activeGroupId = activeGroup?.groupId;
  const { data: milestonesResponse, isLoading: isMilestonesLoading } =
    useStudentMilestoneDashboard(activeGroupId);
  const milestones = milestonesResponse?.data ?? [];

  if (isLoading) {
    return (
      <LoadingState
        description="Gathering your groups, tasks, and project progress."
        title="Loading dashboard"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        className="border-red-200 bg-red-50"
        description={getErrorMessage(error)}
        icon={<AlertTriangle size={22} />}
        title="Dashboard unavailable"
      />
    );
  }

  if (!progress) {
    return (
      <EmptyState
        description="Your dashboard will appear after you join or create a group."
        icon={<Users size={22} />}
        title="No dashboard data"
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Track group progress, upcoming checkpoints, and project work in one place."
        eyebrow="Student"
        title="Dashboard"
      />

      <StatsOverview stats={progress.stats} />

      <Card>
        <CardHeader
          description="Progress across your active groups."
          title="My Groups Progress"
        />
        <CardContent>
          {progress.groups.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
              {progress.groups.map((group) => (
                <GroupProgressCard group={group} key={group.groupId} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="min-h-48"
              icon={<Users size={22} />}
              title="No groups yet"
            />
          )}
        </CardContent>
      </Card>

      {activeGroupId && (
        <Card>
          <CardHeader
            description="Status of your course milestones, submissions and grading."
            title="Course Milestones Status"
          />
          <CardContent>
            {isMilestonesLoading ? (
              <LoadingState title="Loading milestones..." />
            ) : milestones.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
                {milestones.map((m) => (
                  <article
                    className="grid gap-3 rounded-xl border border-border bg-surface p-4 shadow-card"
                    key={m.milestoneId}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <h3 className="m-0 text-sm leading-snug font-bold text-foreground truncate">
                        {m.milestoneTitle}
                      </h3>
                      {m.late && <Badge tone="danger">LATE</Badge>}
                    </div>

                    <div className="grid gap-1.5 text-xs text-muted">
                      <div className="flex items-center justify-between">
                        <span>Deadline:</span>
                        <span className="font-medium text-foreground">
                          {formatDate(m.deadlineAt)}
                        </span>
                      </div>
                      {m.submittedAt && (
                        <div className="flex items-center justify-between">
                          <span>Submitted:</span>
                          <span className="font-medium text-foreground">
                            {formatDate(m.submittedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
                      {m.submitted ? (
                        <Badge tone="brand" size="sm">
                          {m.submissionStatus || "SUBMITTED"}
                        </Badge>
                      ) : (
                        <Badge tone="neutral" size="sm">
                          Not Submitted
                        </Badge>
                      )}

                      {m.graded ? (
                        <Badge tone="success" size="sm">
                          Graded
                        </Badge>
                      ) : (
                        <Badge tone="warning" size="sm">
                          Ungraded
                        </Badge>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                className="min-h-32"
                title="No milestones"
                description="No milestones set up for this course timeline yet."
              />
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)] gap-6 max-[980px]:grid-cols-1">
        <Card>
          <CardHeader
            description="Tasks that are due soon or need attention."
            title="Upcoming Checkpoints"
          />
          <CardContent>
            {progress.checkpoints.length > 0 ? (
              <div className="grid gap-3">
                {progress.checkpoints.map((checkpoint) => (
                  <CheckpointCard
                    checkpoint={checkpoint}
                    key={checkpoint.taskId}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                className="min-h-48"
                icon={<Target size={22} />}
                title="No checkpoints"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            description="Project ideas and selected problem progress."
            title="My Projects"
          />
          <CardContent>
            {projects.length > 0 ? (
              <div className="grid gap-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={`${project.groupId}-${project.projectName ?? "project"}`}
                    project={project}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                className="min-h-48"
                icon={<FolderKanban size={22} />}
                title="No projects yet"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

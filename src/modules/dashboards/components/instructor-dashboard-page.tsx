"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  Button,
} from "@/shared/components";
import { useInstructorMilestoneDashboard } from "../hooks";
import { useInstructorGroups } from "@/modules/groups";
import {
  ArrowRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Users,
} from "lucide-react";

function formatDeadline(value: string | null) {
  if (!value) return "No deadline";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function InstructorDashboardPage() {
  const [term, setTerm] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const instructorGroupsQuery = useInstructorGroups();
  const assignedGroups = instructorGroupsQuery.data?.data ?? [];
  const terms = Array.from(new Set(assignedGroups.map((group) => group.term))).sort();
  const courses = Array.from(
    new Set(
      assignedGroups
        .filter((group) => !term || group.term === term)
        .map((group) => group.courseCode),
    ),
  ).sort();

  const { data: dashboardResponse, isLoading } = useInstructorMilestoneDashboard({
    term,
    courseCode,
  });

  const milestoneStatuses = dashboardResponse?.data ?? [];

  const totalMilestones = milestoneStatuses.length;
  const assignedGroupCount = new Set(
    milestoneStatuses.map((milestone) => milestone.groupId),
  ).size;
  const gradedCount = milestoneStatuses.filter((m) => m.graded).length;
  const gradeCompleteCount = milestoneStatuses.filter(
    (m) => m.gradeComplete,
  ).length;

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        title="Instructor Dashboard"
        description="Monitor thesis milestones, grading progress, and assigned groups."
        eyebrow="Instructor"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-brand-primary" isPadded>
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
                Assigned Groups
              </span>
              <strong className="text-2xl leading-none font-bold text-foreground">
                {assignedGroupCount}
              </strong>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-primary/5 text-brand-primary">
              <Users size={20} />
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-brand-secondary" isPadded>
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
                Milestones
              </span>
              <strong className="text-2xl leading-none font-bold text-foreground">
                {totalMilestones}
              </strong>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-secondary/10 text-brand-secondary">
              <CalendarClock size={20} />
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-brand-primary" isPadded>
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
                Graded Milestones
              </span>
              <strong className="text-2xl leading-none font-bold text-foreground">
                {gradedCount}/{totalMilestones}
              </strong>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <CheckCircle2 size={20} />
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-brand-secondary" isPadded>
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
                Grade Complete
              </span>
              <strong className="text-2xl leading-none font-bold text-foreground">
                {gradeCompleteCount}/{totalMilestones}
              </strong>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-secondary/10 text-brand-secondary">
              <Award size={20} />
            </span>
          </div>
        </Card>
      </div>

      {/* Filter and Content Card */}
      <Card>
        <CardHeader
          title="Milestone Monitor"
          description="Filter milestone grading progress by term and course code."
        />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <Select
              label="Academic Term"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setCourseCode("");
              }}
            >
              <option value="">All terms</option>
              {terms.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Select
              label="Course Code"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
            >
              <option value="">All courses</option>
              {courses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>
        </CardContent>

        {isLoading ? (
          <CardContent>
            <LoadingState title="Loading milestones statuses..." />
          </CardContent>
        ) : milestoneStatuses.length > 0 ? (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted">Group</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted">Milestone</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted">Deadline</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted">Grade status</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted">Contributions</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {milestoneStatuses.map((m) => (
                  <tr className="hover:bg-neutral-50/50 transition-colors" key={`${m.groupId}-${m.milestoneId}`}>
                    <td className="px-5 py-4 font-bold text-foreground">
                      <div>{m.groupName}</div>
                      <div className="text-xs text-muted font-normal mt-0.5">{m.groupNo}</div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {m.milestoneTitle}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">
                      {formatDeadline(m.deadlineAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={m.gradeComplete ? "success" : m.graded ? "warning" : "neutral"}
                        size="sm"
                      >
                        {m.gradeComplete
                          ? "Complete"
                          : m.graded
                            ? "Graded"
                            : "Not graded"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={m.contributionsComplete ? "success" : "neutral"} size="sm">
                        {m.contributionsComplete ? "Complete" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/instructor/grading?groupId=${m.groupId}&milestoneId=${m.milestoneId}`}
                      >
                        <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-brand-primary gap-1">
                          <span>Grade matrix</span>
                          <ArrowRight size={13} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <CardContent>
            <EmptyState
              title="No milestones status data"
              description="Ensure there are groups assigned to you for this term and course."
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}

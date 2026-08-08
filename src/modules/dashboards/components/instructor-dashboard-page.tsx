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
  TextInput,
  Button,
} from "@/shared/components";
import { useInstructorMilestoneDashboard } from "../hooks";
import { CheckCircle2, AlertTriangle, ArrowRight, Users, ClipboardList } from "lucide-react";

export function InstructorDashboardPage() {
  const [term, setTerm] = useState("SU24");
  const [courseCode, setCourseCode] = useState("EXE101");

  const { data: dashboardResponse, isLoading } = useInstructorMilestoneDashboard({
    term,
    courseCode,
  });

  const milestoneStatuses = dashboardResponse?.data ?? [];

  // Derived metrics
  const totalSubmissions = milestoneStatuses.length;
  const submittedCount = milestoneStatuses.filter((m) => m.submitted).length;
  const gradedCount = milestoneStatuses.filter((m) => m.graded).length;
  const lateCount = milestoneStatuses.filter((m) => m.late).length;

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        title="Instructor Dashboard"
        description="Monitor thesis milestones submissions, grading progress, and track assigned groups."
        eyebrow="Instructor"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-brand-primary" isPadded>
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
                Submissions Tracked
              </span>
              <strong className="text-2xl leading-none font-bold text-foreground">
                {totalSubmissions}
              </strong>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-primary/5 text-brand-primary">
              <ClipboardList size={20} />
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-brand-secondary" isPadded>
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
                Submitted
              </span>
              <strong className="text-2xl leading-none font-bold text-foreground">
                {submittedCount}
              </strong>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-secondary/10 text-brand-secondary">
              <Users size={20} />
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-brand-primary" isPadded>
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
                Graded
              </span>
              <strong className="text-2xl leading-none font-bold text-foreground">
                {gradedCount}
              </strong>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <CheckCircle2 size={20} />
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-red-300" isPadded>
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
                Late Submissions
              </span>
              <strong className="text-2xl leading-none font-bold text-foreground">
                {lateCount}
              </strong>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-700">
              <AlertTriangle size={20} />
            </span>
          </div>
        </Card>
      </div>

      {/* Filter and Content Card */}
      <Card>
        <CardHeader
          title="Milestone Monitor"
          description="Filter milestone submissions by term and course code."
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
            <LoadingState title="Loading milestones statuses..." />
          </CardContent>
        ) : milestoneStatuses.length > 0 ? (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted">Group</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted">Milestone</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted">Submitted</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted">Graded</th>
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
                    <td className="px-5 py-4">
                      {m.submitted ? (
                        <Badge tone="brand" size="sm">
                          {m.submissionStatus || "SUBMITTED"}
                        </Badge>
                      ) : (
                        <Badge tone="neutral" size="sm">
                          Pending
                        </Badge>
                      )}
                      {m.late && (
                        <Badge tone="danger" size="sm" className="ml-1.5">
                          LATE
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={m.graded ? "success" : "warning"} size="sm">
                        {m.graded ? "Graded" : "Ungraded"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={m.contributionsComplete ? "success" : "neutral"} size="sm">
                        {m.contributionsComplete ? "Submitted" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href="/instructor/grading">
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

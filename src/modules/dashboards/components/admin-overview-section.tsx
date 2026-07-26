"use client";

import { FormEvent, useState } from "react";
import { BookOpen, GraduationCap, Users } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useAdminDashboardOverview } from "../hooks";

const filterClassName =
  "grid grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_110px_auto] items-end gap-3 max-[860px]:grid-cols-[minmax(0,1fr)]";
const metricGridClassName =
  "grid grid-cols-2 gap-4 max-[620px]:grid-cols-[minmax(0,1fr)]";
const tableClassName =
  "w-full min-w-[360px] border-collapse [&_tbody_tr:last-child_td]:border-b-0";
const desktopTableClassName = "overflow-x-auto max-[760px]:hidden";
const mobileListClassName =
  "hidden min-w-0 gap-3 p-3 max-[760px]:grid";
const mobileCardClassName =
  "grid min-w-0 gap-2 rounded-xl border border-border bg-background p-3.5";
const tableHeadCellClassName =
  "border-b border-border px-4 py-3 text-left text-xs font-bold tracking-[0.04em] text-muted uppercase";
const tableCellClassName =
  "border-b border-border px-4 py-3 text-sm text-foreground";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load the admin overview.";
}

export function AdminOverviewSection() {
  const [termInput, setTermInput] = useState("");
  const [courseCodeInput, setCourseCodeInput] = useState("");
  const [limitInput, setLimitInput] = useState("5");
  const [filters, setFilters] = useState({
    term: "",
    courseCode: "",
    limit: 5,
  });
  const overviewQuery = useAdminDashboardOverview({
    term: filters.term || undefined,
    courseCode: filters.courseCode || undefined,
    limit: filters.limit,
  });
  const overview = overviewQuery.data?.data;

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLimit = Number(limitInput);

    setFilters({
      term: termInput.trim(),
      courseCode: courseCodeInput.trim(),
      limit: Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5,
    });
  }

  return (
    <Card>
      <CardHeader
        description="Live account totals and the most selected problems/domains for the requested scope."
        title="Academic overview"
      />
      <CardContent className="grid gap-5">
        <form className={filterClassName} onSubmit={handleFilter}>
          <TextInput
            label="Academic term"
            onChange={(event) => setTermInput(event.target.value)}
            placeholder="FALL2026"
            value={termInput}
          />
          <TextInput
            label="Course code"
            onChange={(event) => setCourseCodeInput(event.target.value)}
            placeholder="EXE101"
            value={courseCodeInput}
          />
          <TextInput
            label="Top limit"
            min="1"
            onChange={(event) => setLimitInput(event.target.value)}
            type="number"
            value={limitInput}
          />
          <Button type="submit">Apply</Button>
        </form>

        {overviewQuery.isLoading ? (
          <LoadingState className="min-h-44" title="Loading academic overview" />
        ) : overviewQuery.isError ? (
          <EmptyState
            className="min-h-44"
            description={getErrorMessage(overviewQuery.error)}
            title="Overview unavailable"
          />
        ) : !overview ? (
          <EmptyState
            className="min-h-44"
            description="No overview data was returned for this scope."
            title="No overview data"
          />
        ) : (
          <>
            <div className={metricGridClassName}>
              <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-surface-warm text-brand-primary">
                  <GraduationCap size={20} />
                </span>
                <div className="grid gap-1">
                  <span className="text-sm text-muted">Active students</span>
                  <strong className="text-2xl text-foreground">
                    {overview.totalActiveStudents}
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-surface-warm text-brand-primary">
                  <Users size={20} />
                </span>
                <div className="grid gap-1">
                  <span className="text-sm text-muted">Active mentors</span>
                  <strong className="text-2xl text-foreground">
                    {overview.totalActiveMentors}
                  </strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 max-[960px]:grid-cols-[minmax(0,1fr)]">
              <div className="min-w-0 overflow-hidden rounded-xl border border-border">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <BookOpen className="text-brand-primary" size={17} />
                  <h3 className="m-0 text-sm font-bold text-foreground">Top problems</h3>
                </div>
                {overview.topProblems.length === 0 ? (
                  <p className="m-0 px-4 py-5 text-sm text-muted">No problem selections yet.</p>
                ) : (
                  <>
                    <div className={desktopTableClassName}>
                      <table className={tableClassName}>
                        <thead>
                          <tr>
                            <th className={tableHeadCellClassName}>Problem</th>
                            <th className={tableHeadCellClassName}>Selections</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.topProblems.map((problem) => (
                            <tr key={problem.problemId}>
                              <td className={tableCellClassName}>
                                <div className="grid gap-1">
                                  <span className="font-medium">{problem.problemTitle}</span>
                                  <span className="text-xs text-muted">{problem.problemCode}</span>
                                </div>
                              </td>
                              <td className={tableCellClassName}>{problem.selectionCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className={mobileListClassName}>
                      {overview.topProblems.map((problem) => (
                        <article className={mobileCardClassName} key={problem.problemId}>
                          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                            <strong className="min-w-0 flex-1 break-words text-sm text-foreground">
                              {problem.problemTitle}
                            </strong>
                            <Badge tone="brand">{problem.selectionCount} selected</Badge>
                          </div>
                          <span className="break-all text-xs text-muted">
                            {problem.problemCode}
                          </span>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-border">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <BookOpen className="text-brand-primary" size={17} />
                  <h3 className="m-0 text-sm font-bold text-foreground">Top domains</h3>
                </div>
                {overview.topDomains.length === 0 ? (
                  <p className="m-0 px-4 py-5 text-sm text-muted">No domain selections yet.</p>
                ) : (
                  <>
                    <div className={desktopTableClassName}>
                      <table className={tableClassName}>
                        <thead>
                          <tr>
                            <th className={tableHeadCellClassName}>Domain</th>
                            <th className={tableHeadCellClassName}>Selections</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.topDomains.map((domain) => (
                            <tr key={domain.domainId}>
                              <td className={tableCellClassName}>
                                <div className="grid gap-1">
                                  <span className="font-medium">{domain.domainName}</span>
                                  <span className="text-xs text-muted">{domain.domainCode}</span>
                                </div>
                              </td>
                              <td className={tableCellClassName}>{domain.selectionCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className={mobileListClassName}>
                      {overview.topDomains.map((domain) => (
                        <article className={mobileCardClassName} key={domain.domainId}>
                          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                            <strong className="min-w-0 flex-1 break-words text-sm text-foreground">
                              {domain.domainName}
                            </strong>
                            <Badge tone="brand">{domain.selectionCount} selected</Badge>
                          </div>
                          <span className="break-all text-xs text-muted">
                            {domain.domainCode}
                          </span>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

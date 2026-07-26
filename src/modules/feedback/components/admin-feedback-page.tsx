"use client";

import { FormEvent, useMemo, useState } from "react";
import { MessageSquareText } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";
import type { FeedbackStatus, FeedbackTargetType } from "@/shared/types";

import { useAdminFeedback } from "../hooks";
import type { AdminFeedbackResponseDto } from "../types";
import { FeedbackRating } from "./feedback-rating";

const PAGE_SIZE = 20;
const pageClassName = "grid min-w-0 gap-6";
const filterClassName =
  "grid grid-cols-[repeat(3,minmax(0,1fr))] items-end gap-3 max-[860px]:grid-cols-[minmax(0,1fr)]";
const tableWrapClassName = "w-full overflow-x-auto max-[760px]:hidden";
const mobileListClassName =
  "hidden min-w-0 gap-3 p-4 max-[760px]:grid max-[480px]:p-3";
const mobileCardClassName =
  "grid min-w-0 gap-4 rounded-xl border border-border bg-background p-4";
const tableClassName = "w-full min-w-[1180px] border-collapse";
const tableHeadCellClassName =
  "border-b border-border px-4 py-3 text-left text-xs font-bold tracking-[0.04em] text-muted uppercase";
const tableCellClassName =
  "border-b border-border px-4 py-4 align-top text-sm text-foreground";

type FilterDraft = {
  term: string;
  courseCode: string;
  targetType: "" | FeedbackTargetType;
  targetId: string;
  status: "" | FeedbackStatus;
};

const EMPTY_FILTERS: FilterDraft = {
  term: "",
  courseCode: "",
  targetType: "",
  targetId: "",
  status: "",
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load feedback records. Please try again.";
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTargetName(item: AdminFeedbackResponseDto) {
  if (item.targetType === "MENTOR") {
    return item.mentor?.fullName ?? "Unknown mentor";
  }

  return item.instructor?.fullName ?? "Unknown instructor";
}

function getTargetCode(item: AdminFeedbackResponseDto) {
  if (item.targetType === "MENTOR") return item.mentor?.mentorCode ?? "-";
  return item.instructor?.instructorCode ?? "-";
}

export function AdminFeedbackPage() {
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterDraft>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [filterError, setFilterError] = useState("");

  const query = useMemo(() => {
    const targetId = appliedFilters.targetId
      ? Number(appliedFilters.targetId)
      : undefined;

    return {
      page,
      size: PAGE_SIZE,
      term: appliedFilters.term || undefined,
      courseCode: appliedFilters.courseCode || undefined,
      targetType: appliedFilters.targetType || undefined,
      targetId,
      status: appliedFilters.status || undefined,
    };
  }, [appliedFilters, page]);
  const feedbackQuery = useAdminFeedback(query);
  const pageData = feedbackQuery.data?.data;
  const feedbackItems = pageData?.content ?? [];

  function updateDraft<K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilterError("");

    if (draft.targetId && (!Number.isInteger(Number(draft.targetId)) || Number(draft.targetId) < 1)) {
      setFilterError("Target ID must be a positive whole number.");
      return;
    }

    setPage(0);
    setAppliedFilters({
      term: draft.term.trim(),
      courseCode: draft.courseCode.trim(),
      targetType: draft.targetType,
      targetId: draft.targetId.trim(),
      status: draft.status,
    });
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setFilterError("");
    setPage(0);
  }

  return (
    <div className={pageClassName}>
      <PageHeader
        description="Review all feedback records with identities, assignment targets and submission status."
        eyebrow="Admin"
        title="Feedback management"
      />

      <Card>
        <CardContent>
          <form className={filterClassName} onSubmit={handleFilter}>
            <TextInput
              label="Academic term"
              onChange={(event) => updateDraft("term", event.target.value)}
              placeholder="FALL2026"
              value={draft.term}
            />
            <TextInput
              label="Course code"
              onChange={(event) => updateDraft("courseCode", event.target.value)}
              placeholder="EXE101"
              value={draft.courseCode}
            />
            <Select
              label="Target type"
              onChange={(event) =>
                updateDraft("targetType", event.target.value as "" | FeedbackTargetType)
              }
              value={draft.targetType}
            >
              <option value="">All targets</option>
              <option value="MENTOR">Mentor</option>
              <option value="INSTRUCTOR">Instructor</option>
            </Select>
            <TextInput
              label="Target ID"
              min="1"
              onChange={(event) => updateDraft("targetId", event.target.value)}
              placeholder="Optional"
              type="number"
              value={draft.targetId}
            />
            <Select
              label="Status"
              onChange={(event) =>
                updateDraft("status", event.target.value as "" | FeedbackStatus)
              }
              value={draft.status}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Submitted</option>
            </Select>
            <div className="flex flex-wrap gap-2 max-[480px]:grid max-[480px]:grid-cols-1 max-[480px]:[&>button]:w-full">
              <Button type="submit">Apply filters</Button>
              <Button onClick={resetFilters} variant="secondary">
                Reset
              </Button>
            </div>
          </form>
          {filterError && <p className="mt-3 mb-0 text-sm text-red-700">{filterError}</p>}
        </CardContent>
      </Card>

      {feedbackQuery.isLoading ? (
        <LoadingState title="Loading feedback records" />
      ) : feedbackQuery.isError ? (
        <EmptyState
          description={getErrorMessage(feedbackQuery.error)}
          icon={<MessageSquareText size={22} />}
          title="Feedback unavailable"
        />
      ) : feedbackItems.length === 0 ? (
        <EmptyState
          description="No feedback records match the current filters."
          icon={<MessageSquareText size={22} />}
          title="No feedback records"
        />
      ) : (
        <Card>
          <div className={tableWrapClassName}>
            <table className={tableClassName}>
              <thead>
                <tr>
                  <th className={tableHeadCellClassName}>Student</th>
                  <th className={tableHeadCellClassName}>Group / term</th>
                  <th className={tableHeadCellClassName}>Target</th>
                  <th className={tableHeadCellClassName}>Rating</th>
                  <th className={tableHeadCellClassName}>Comment</th>
                  <th className={tableHeadCellClassName}>Status</th>
                  <th className={tableHeadCellClassName}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {feedbackItems.map((item) => (
                  <tr key={item.id}>
                    <td className={tableCellClassName}>
                      <div className="grid gap-1">
                        <span className="font-medium">{item.student.fullName}</span>
                        <span className="text-xs text-muted">
                          {item.student.studentCode} · {item.student.email}
                        </span>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <div className="grid gap-1">
                        <span className="font-medium">{item.group.name}</span>
                        <span className="text-xs text-muted">
                          {item.group.groupNo} · {item.academicTerm.code} · {item.group.courseCode}
                        </span>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <div className="grid gap-1">
                        <Badge tone="neutral">
                          {item.targetType}
                        </Badge>
                        <span className="font-medium">{getTargetName(item)}</span>
                        <span className="text-xs text-muted">{getTargetCode(item)}</span>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <FeedbackRating value={item.rating} />
                    </td>
                    <td className={cn(tableCellClassName, "max-w-80 leading-relaxed text-muted")}>
                      {item.comment || "-"}
                    </td>
                    <td className={tableCellClassName}>
                      <Badge tone={item.status === "SUBMITTED" ? "success" : "warning"}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className={cn(tableCellClassName, "text-muted")}>
                      {formatDateTime(item.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={mobileListClassName}>
            {feedbackItems.map((item) => (
              <article className={mobileCardClassName} key={item.id}>
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <div className="grid min-w-0 gap-1">
                    <h3 className="m-0 break-words text-base font-bold text-foreground">
                      {item.student.fullName}
                    </h3>
                    <span className="break-all text-xs text-muted">
                      {item.student.studentCode} · {item.student.email}
                    </span>
                  </div>
                  <Badge
                    tone={item.status === "SUBMITTED" ? "success" : "warning"}
                  >
                    {item.status}
                  </Badge>
                </div>

                <dl className="m-0 grid min-w-0 grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                  <div className="grid min-w-0 gap-1">
                    <dt className="text-[11px] font-bold text-muted uppercase">
                      Group / term
                    </dt>
                    <dd className="m-0 break-words text-sm text-foreground">
                      {item.group.name}
                    </dd>
                    <dd className="m-0 break-words text-xs text-muted">
                      {item.group.groupNo} · {item.academicTerm.code} ·{" "}
                      {item.group.courseCode}
                    </dd>
                  </div>
                  <div className="grid min-w-0 gap-1">
                    <dt className="text-[11px] font-bold text-muted uppercase">
                      Target
                    </dt>
                    <dd className="m-0 flex min-w-0 flex-wrap items-center gap-2">
                      <Badge tone="neutral">{item.targetType}</Badge>
                      <span className="break-words text-sm text-foreground">
                        {getTargetName(item)}
                      </span>
                    </dd>
                    <dd className="m-0 break-all text-xs text-muted">
                      {getTargetCode(item)}
                    </dd>
                  </div>
                </dl>

                <div className="grid min-w-0 gap-2 border-t border-border pt-3">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-muted uppercase">
                      Rating
                    </span>
                    <FeedbackRating value={item.rating} />
                  </div>
                  <p className="m-0 break-words text-sm leading-relaxed text-muted">
                    {item.comment || "-"}
                  </p>
                  <span className="break-words text-xs text-muted">
                    Submitted {formatDateTime(item.submittedAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
          {pageData && pageData.totalPages > 1 && (
            <div className="flex min-w-0 items-center justify-between gap-4 border-t border-border px-6 py-4 max-[680px]:flex-col max-[680px]:items-stretch max-[480px]:px-4">
              <span className="text-sm text-muted">
                Page {pageData.page + 1} of {pageData.totalPages} ({pageData.totalElements} records)
              </span>
              <div className="flex gap-2 max-[480px]:grid max-[480px]:grid-cols-2 max-[480px]:[&>button]:w-full">
                <Button
                  disabled={!pageData.hasPrevious}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  size="sm"
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  disabled={!pageData.hasNext}
                  onClick={() => setPage((current) => current + 1)}
                  size="sm"
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

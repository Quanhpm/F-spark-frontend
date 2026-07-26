"use client";

import { FormEvent, useState } from "react";
import { BarChart3, MessageSquareText } from "lucide-react";

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
import { ApiError } from "@/shared/lib";

import { useReceivedFeedback } from "../hooks";
import type { FeedbackReceivedSummaryDto } from "../types";
import { FeedbackRating } from "./feedback-rating";

const pageClassName = "grid min-w-0 gap-6";
const filterClassName =
  "grid grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto] items-end gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]";
const summaryGridClassName =
  "grid grid-cols-3 gap-4 max-[760px]:grid-cols-[minmax(0,1fr)]";
const metricClassName = "grid gap-1 rounded-xl border border-border bg-surface p-5";

export type ReceivedFeedbackAudience = "MENTOR" | "INSTRUCTOR";

const audienceContent: Record<
  ReceivedFeedbackAudience,
  { description: string; eyebrow: string }
> = {
  INSTRUCTOR: {
    description:
      "Review anonymous feedback summaries and comments from students in groups assigned to you.",
    eyebrow: "Instructor",
  },
  MENTOR: {
    description:
      "Review anonymous feedback summaries and comments from students in groups you mentor.",
    eyebrow: "Mentor",
  },
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load received feedback. Please try again.";
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function RatingDistribution({ summary }: { summary: FeedbackReceivedSummaryDto }) {
  return (
    <Card>
      <CardHeader
        description="Anonymous rating distribution for the selected term and course."
        title="Rating distribution"
      />
      <CardContent className="grid gap-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = summary.ratingDistribution[String(rating)] ?? 0;
          const percentage = summary.totalCount
            ? Math.round((count / summary.totalCount) * 100)
            : 0;

          return (
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3" key={rating}>
              <span className="text-sm font-medium text-foreground">{rating} stars</span>
              <span className="h-2 overflow-hidden rounded-full bg-background">
                <span
                  className="block h-full rounded-full bg-brand-secondary"
                  style={{ width: `${percentage}%` }}
                />
              </span>
              <span className="text-sm text-muted">{count}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function ReceivedFeedbackPage({
  audience,
}: {
  audience: ReceivedFeedbackAudience;
}) {
  const content = audienceContent[audience];
  const [termInput, setTermInput] = useState("");
  const [courseCodeInput, setCourseCodeInput] = useState("");
  const [filters, setFilters] = useState({ term: "", courseCode: "" });
  const receivedFeedbackQuery = useReceivedFeedback({
    term: filters.term || undefined,
    courseCode: filters.courseCode || undefined,
  });
  const summary = receivedFeedbackQuery.data?.data;

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({
      term: termInput.trim(),
      courseCode: courseCodeInput.trim(),
    });
  }

  return (
    <div className={pageClassName}>
      <PageHeader
        description={content.description}
        eyebrow={content.eyebrow}
        title="Received feedback"
      />

      <Card>
        <CardContent>
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
            <Button className="max-[760px]:w-full" type="submit">
              Apply filters
            </Button>
          </form>
        </CardContent>
      </Card>

      {receivedFeedbackQuery.isLoading ? (
        <LoadingState title="Loading received feedback" />
      ) : receivedFeedbackQuery.isError ? (
        <EmptyState
          description={getErrorMessage(receivedFeedbackQuery.error)}
          icon={<MessageSquareText size={22} />}
          title="Feedback unavailable"
        />
      ) : !summary ? (
        <EmptyState
          description="No received feedback is available for the selected filters."
          icon={<BarChart3 size={22} />}
          title="No feedback summary"
        />
      ) : (
        <>
          <div className={summaryGridClassName}>
            <div className={metricClassName}>
              <span className="text-sm text-muted">Responses</span>
              <strong className="text-3xl text-foreground">{summary.totalCount}</strong>
            </div>
            <div className={metricClassName}>
              <span className="text-sm text-muted">Average rating</span>
              <strong className="text-3xl text-foreground">
                {summary.averageRating?.toFixed(1) ?? "-"}
              </strong>
            </div>
            <div className={metricClassName}>
              <span className="text-sm text-muted">Scope</span>
              <strong className="break-words text-base text-foreground">
                {summary.term || "All terms"} · {summary.courseCode || "All courses"}
              </strong>
            </div>
          </div>

          <RatingDistribution summary={summary} />

          <Card>
            <CardHeader
              description="Entries are intentionally anonymous; student identity is not exposed here."
              title="Anonymous comments"
            />
            <CardContent className="grid gap-3">
              {summary.entries.length === 0 ? (
                <EmptyState
                  className="min-h-44"
                  description="No submitted comments match these filters."
                  title="No comments"
                />
              ) : (
                summary.entries.map((entry) => (
                  <article
                    className="grid gap-3 rounded-xl border border-border bg-background p-4"
                    key={entry.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <FeedbackRating value={entry.rating} />
                      <Badge className="max-w-full whitespace-normal break-words" tone="neutral">
                        {entry.termCode} · {entry.courseCode}
                      </Badge>
                    </div>
                    <p className="m-0 break-words text-sm leading-relaxed text-foreground">
                      {entry.comment || "No comment provided."}
                    </p>
                    <span className="break-words text-xs text-muted">
                      {entry.groupName} · Submitted {formatDateTime(entry.submittedAt)}
                    </span>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

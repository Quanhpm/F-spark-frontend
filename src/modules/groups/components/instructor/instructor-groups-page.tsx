"use client";

import { AlertTriangle, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useInstructorGroups } from "../../hooks";

const PAGE_SIZE = 6;

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function InstructorGroupsPage() {
  const [term, setTerm] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [page, setPage] = useState(0);

  const allGroupsQuery = useInstructorGroups();
  const groupsQuery = useInstructorGroups({
    courseCode: optional(courseCode),
    term: optional(term),
  });

  const allGroups = useMemo(
    () => allGroupsQuery.data?.data ?? [],
    [allGroupsQuery.data?.data],
  );
  const groups = useMemo(
    () => groupsQuery.data?.data ?? [],
    [groupsQuery.data?.data],
  );
  const termOptions = useMemo(
    () =>
      Array.from(new Set(allGroups.map((group) => group.term).filter(Boolean))).sort(),
    [allGroups],
  );
  const courseOptions = useMemo(
    () =>
      Array.from(
        new Set(allGroups.map((group) => group.courseCode).filter(Boolean)),
      ).sort(),
    [allGroups],
  );

  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleGroups = groups.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="View the project groups currently assigned to you."
        eyebrow="Instructor"
        title="Groups"
      />

      <Card>
        <CardHeader
          actions={<Badge tone="neutral">{groups.length} groups</Badge>}
          description="Term and course filters are sent directly to the assigned-groups API."
          title="Assigned groups"
        />
        <CardContent className="grid gap-5">
          <div className="grid grid-cols-[repeat(2,minmax(180px,260px))_minmax(0,1fr)] items-end gap-3 max-[760px]:grid-cols-1">
            <Select
              label="Term"
              onChange={(event) => {
                setTerm(event.target.value);
                setPage(0);
              }}
              value={term}
            >
              <option value="">All terms</option>
              {termOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select
              label="Course code"
              onChange={(event) => {
                setCourseCode(event.target.value);
                setPage(0);
              }}
              value={courseCode}
            >
              <option value="">All courses</option>
              {courseOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            {(term || courseCode) && (
              <Button
                className="w-fit justify-self-end max-[760px]:w-full max-[760px]:justify-self-stretch"
                onClick={() => {
                  setTerm("");
                  setCourseCode("");
                  setPage(0);
                }}
                variant="secondary"
              >
                Clear filters
              </Button>
            )}
          </div>

          {groupsQuery.isLoading ? (
            <LoadingState title="Loading assigned groups" />
          ) : groupsQuery.error ? (
            <EmptyState
              className="border-red-200 bg-red-50"
              description={getErrorMessage(groupsQuery.error)}
              icon={<AlertTriangle size={22} />}
              title="Unable to load groups"
            />
          ) : groups.length === 0 ? (
            <EmptyState
              description="No assigned groups match the selected term and course."
              icon={<Users size={22} />}
              title="No groups found"
            />
          ) : (
            <>
              <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 max-[760px]:grid-cols-1">
                {visibleGroups.map((group) => (
                  <article
                    className="grid min-w-0 gap-4 rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-card-interactive"
                    key={group.id}
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="grid min-w-0 gap-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-brand-primary">
                          Group {group.groupNo}
                        </span>
                        <h2 className="m-0 break-words text-lg font-bold text-foreground">
                          {group.name}
                        </h2>
                        <span className="break-words text-sm text-muted">
                          {group.projectName ?? "No project name"}
                        </span>
                      </div>
                      <Badge tone={group.status === "ACTIVE" ? "success" : "neutral"}>
                        {group.status}
                      </Badge>
                    </div>

                    <dl className="m-0 grid grid-cols-2 gap-3 rounded-xl bg-background p-4 text-sm max-[430px]:grid-cols-1">
                      <div className="grid gap-1">
                        <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                          Scope
                        </dt>
                        <dd className="m-0 break-words text-foreground">
                          {group.term} / {group.courseCode}
                        </dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                          Members
                        </dt>
                        <dd className="m-0 text-foreground">
                          {group.memberCount}
                        </dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                          Leader
                        </dt>
                        <dd className="m-0 break-words text-foreground">
                          {group.leaderName ?? "Not assigned"}
                        </dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className="text-xs font-bold uppercase tracking-wide text-muted">
                          Mentor
                        </dt>
                        <dd className="m-0 break-words text-foreground">
                          {group.mentorName ?? "Not assigned"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              <div className="flex min-w-0 items-center justify-between gap-4 border-t border-border pt-4 max-[480px]:grid max-[480px]:grid-cols-2">
                <span className="text-sm text-muted max-[480px]:col-span-2 max-[480px]:text-center">
                  Page {currentPage + 1} of {totalPages} ({groups.length} groups)
                </span>
                <div className="flex gap-2 max-[480px]:col-span-2 max-[480px]:grid max-[480px]:grid-cols-2">
                  <Button
                    disabled={currentPage === 0}
                    icon={<ChevronLeft size={16} />}
                    onClick={() => setPage((value) => Math.max(0, value - 1))}
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={currentPage >= totalPages - 1}
                    icon={<ChevronRight size={16} />}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages - 1, value + 1))
                    }
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { ChevronDown, Loader2, Search, UserRoundPlus, X } from "lucide-react";

import {
  useAssignGroupInstructor,
  useAssignGroupMentor,
  useGroups,
} from "@/modules/groups";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  PageHeader,
  TextInput,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";
import type { UserRole } from "@/shared/types";

import { useAdminUsers } from "../hooks/use-admin-users";
import type { AdminUserSummaryDto } from "../types";

const PEOPLE_SEARCH_PAGE_SIZE = 20;
const GROUP_PAGE_SIZE = 10;
const pageClassName = "grid min-w-0 gap-6";
const filterClassName =
  "grid grid-cols-[minmax(220px,1fr)_auto] items-end gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]";
const tableWrapClassName = "w-full overflow-x-auto max-[760px]:hidden";
const mobileListClassName =
  "hidden min-w-0 gap-3 p-4 max-[760px]:grid max-[480px]:p-3";
const mobileCardClassName =
  "grid min-w-0 gap-4 rounded-xl border border-border bg-background p-4";
const tableClassName = "w-full min-w-[1180px] border-collapse";
const tableHeadCellClassName =
  "border-b border-border px-4 py-3 text-left text-xs font-bold tracking-[0.04em] text-muted uppercase";
const tableCellClassName =
  "border-b border-border px-4 py-4 align-middle text-sm text-foreground";
const skeletonLineClassName = "h-3 animate-pulse rounded-full bg-border";

type AppliedFilters = {
  groupSearch: string;
};

type RowFeedback = {
  message: string;
  tone: "error" | "success";
};

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function getLoadErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load groups or active instructors/mentors. Please try again.";
}

function getMutationErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to assign the person. Please try again.";
}

function getUserDisplayName(user: AdminUserSummaryDto) {
  return user.fullName ?? user.email;
}

function getRoleLabel(role: Extract<UserRole, "INSTRUCTOR" | "MENTOR">) {
  return role === "INSTRUCTOR" ? "instructor" : "mentor";
}

type UserSearchComboboxProps = {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  role: Extract<UserRole, "INSTRUCTOR" | "MENTOR">;
  value: string;
};

function UserSearchCombobox({
  ariaLabel,
  disabled = false,
  onChange,
  placeholder,
  role,
  value,
}: UserSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserSummaryDto | null>(
    null,
  );
  const roleLabel = getRoleLabel(role);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const usersQuery = useAdminUsers(
    {
      page: 0,
      role,
      search: optional(debouncedSearch),
      size: PEOPLE_SEARCH_PAGE_SIZE,
      status: "ACTIVE",
    },
    { enabled: isOpen && !disabled },
  );
  const users = usersQuery.data?.data.content ?? [];
  const effectiveSelectedUser =
    selectedUser && value === String(selectedUser.id) ? selectedUser : null;

  function handleSelect(user: AdminUserSummaryDto) {
    setSelectedUser(user);
    onChange(String(user.id));
    setSearch("");
    setIsOpen(false);
  }

  function handleClear() {
    setSelectedUser(null);
    onChange("");
    setSearch("");
  }

  return (
    <div
      className="relative min-w-0"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <div
        className={cn(
          "flex min-h-11 min-w-0 items-center rounded-xl border border-border bg-surface text-sm transition-[border-color,box-shadow]",
          isOpen && "border-brand-secondary shadow-[0_0_0_4px_rgba(237,161,47,0.12)]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <button
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 px-3 text-left text-foreground outline-none"
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span
            className={cn(
              "min-w-0 truncate",
              !selectedUser && !value && "text-muted",
            )}
          >
            {effectiveSelectedUser
              ? `${getUserDisplayName(effectiveSelectedUser)} (${effectiveSelectedUser.code ?? "-"})`
              : value
                ? `Selected #${value}`
                : placeholder}
          </span>
          <ChevronDown className="shrink-0 text-muted" size={16} />
        </button>
        {value && !disabled && (
          <button
            aria-label={`Clear selected ${roleLabel}`}
            className="mr-2 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground"
            onClick={handleClear}
            type="button"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-40 mt-2 grid max-h-80 w-full min-w-[280px] overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="border-b border-border p-2">
            <TextInput
              autoFocus
              className="text-sm"
              icon={<Search size={15} />}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${roleLabel} by name, code, email`}
              shellClassName="h-10"
              value={search}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {usersQuery.isLoading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted">
                <Loader2 className="animate-spin" size={16} />
                Searching active {roleLabel}s...
              </div>
            ) : usersQuery.isError ? (
              <div className="px-3 py-3 text-sm text-red-700">
                Unable to load active {roleLabel}s.
              </div>
            ) : users.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted">
                No active {roleLabel}s found.
              </div>
            ) : (
              users.map((user) => (
                <button
                  className={cn(
                    "grid w-full min-w-0 gap-1 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-background",
                    value === String(user.id) && "bg-background",
                  )}
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  type="button"
                >
                  <span className="min-w-0 truncate font-semibold text-foreground">
                    {getUserDisplayName(user)}
                  </span>
                  <span className="min-w-0 truncate text-xs text-muted">
                    {user.code ?? "No code"} · {user.email}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentResultsSkeleton({ rowCount }: { rowCount: number }) {
  const visibleRowCount = Math.max(1, rowCount);
  const mobileRowCount = Math.min(visibleRowCount, 3);

  return (
    <Card aria-busy="true" aria-label="Saving instructor assignment">
      <span className="sr-only" role="status">
        Saving instructor assignment and refreshing groups
      </span>

      <div className={tableWrapClassName} aria-hidden="true">
        <div className="min-w-[1180px]">
          <div className="grid grid-cols-[1.35fr_1fr_1fr_1.35fr_2fr_100px] border-b border-border px-4 py-3">
            {["Group", "Term / course", "Mentor", "Current instructor", "Assign new instructor", "Action"].map(
              (label) => (
                <div className="px-4" key={label}>
                  <div className={cn(skeletonLineClassName, "w-24")} />
                </div>
              ),
            )}
          </div>
          {Array.from({ length: visibleRowCount }, (_, rowIndex) => (
            <div
              className="grid min-h-[92px] grid-cols-[1.35fr_1fr_1fr_1.35fr_2fr_100px] items-center border-b border-border px-4 last:border-b-0"
              key={`assignment-skeleton-row-${rowIndex}`}
            >
              <div className="grid gap-2 px-4">
                <div className={cn(skeletonLineClassName, "w-32")} />
                <div className={cn(skeletonLineClassName, "w-20")} />
              </div>
              <div className="grid gap-2 px-4">
                <div className={cn(skeletonLineClassName, "w-20")} />
                <div className={cn(skeletonLineClassName, "w-16")} />
              </div>
              <div className="px-4">
                <div className={cn(skeletonLineClassName, "h-6 w-24")} />
              </div>
              <div className="grid gap-2 px-4">
                <div className={cn(skeletonLineClassName, "w-32")} />
                <div className={cn(skeletonLineClassName, "w-20")} />
              </div>
              <div className="px-4">
                <div className={cn(skeletonLineClassName, "h-10 w-full rounded-xl")} />
              </div>
              <div className="px-4">
                <div className={cn(skeletonLineClassName, "h-9 w-16 rounded-xl")} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={mobileListClassName} aria-hidden="true">
        {Array.from({ length: mobileRowCount }, (_, rowIndex) => (
          <div
            className={cn(mobileCardClassName, "animate-pulse")}
            key={`assignment-mobile-skeleton-${rowIndex}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid flex-1 gap-2">
                <div className="h-4 w-2/3 rounded-full bg-border" />
                <div className="h-3 w-1/3 rounded-full bg-border" />
              </div>
              <div className="h-6 w-16 rounded-full bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
              <div className="grid gap-2">
                <div className="h-3 w-20 rounded-full bg-border" />
                <div className="h-3 w-28 rounded-full bg-border" />
              </div>
              <div className="grid gap-2">
                <div className="h-3 w-16 rounded-full bg-border" />
                <div className="h-3 w-24 rounded-full bg-border" />
              </div>
            </div>
            <div className="grid gap-2 border-t border-border pt-3">
              <div className="h-3 w-28 rounded-full bg-border" />
              <div className="h-3 w-2/3 rounded-full bg-border" />
              <div className="h-3 w-1/3 rounded-full bg-border" />
            </div>
            <div className="grid gap-3 border-t border-border pt-3">
              <div className="h-11 w-full rounded-xl bg-border" />
              <div className="h-11 w-full rounded-xl bg-border" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AdminGroupInstructorPage() {
  const [groupSearchInput, setGroupSearchInput] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    groupSearch: "",
  });
  const [groupPage, setGroupPage] = useState(0);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<
    Record<number, string>
  >({});
  const [selectedMentorIds, setSelectedMentorIds] = useState<
    Record<number, string>
  >({});
  const [assigningGroupId, setAssigningGroupId] = useState<number | null>(null);
  const [rowFeedback, setRowFeedback] = useState<
    Record<number, RowFeedback | undefined>
  >({});

  const groupsQuery = useGroups({
    search: optional(appliedFilters.groupSearch),
  });
  const assignInstructorMutation = useAssignGroupInstructor();
  const assignMentorMutation = useAssignGroupMentor();
  const groups = groupsQuery.data?.data ?? [];
  const groupTotalPages = Math.ceil(groups.length / GROUP_PAGE_SIZE);
  const paginatedGroups = groups.slice(
    groupPage * GROUP_PAGE_SIZE,
    (groupPage + 1) * GROUP_PAGE_SIZE,
  );

  function clearSelections() {
    setSelectedInstructorIds({});
    setSelectedMentorIds({});
    setRowFeedback({});
  }

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({
      groupSearch: groupSearchInput.trim(),
    });
    setGroupPage(0);
    clearSelections();
  }

  function handleResetFilters() {
    setGroupSearchInput("");
    setAppliedFilters({ groupSearch: "" });
    setGroupPage(0);
    clearSelections();
  }

  function handleGroupPageChange(nextPage: number) {
    setGroupPage(nextPage);
    clearSelections();
  }

  function setFeedback(groupId: number, feedback: RowFeedback) {
    setRowFeedback((current) => ({ ...current, [groupId]: feedback }));
  }

  async function handleAssign(
    groupId: number,
    currentInstructorAccountId: number | null,
  ) {
    const instructorId = Number(selectedInstructorIds[groupId]);

    if (!Number.isInteger(instructorId) || instructorId < 1) {
      setFeedback(groupId, {
        message: "Choose an active instructor before assigning the group.",
        tone: "error",
      });
      return;
    }

    if (instructorId === currentInstructorAccountId) {
      setFeedback(groupId, {
        message: "This instructor is already assigned to the group.",
        tone: "error",
      });
      return;
    }

    setAssigningGroupId(groupId);
    setRowFeedback((current) => ({ ...current, [groupId]: undefined }));

    try {
      await assignInstructorMutation.mutateAsync({
        groupId,
        payload: { instructorId },
      });
      setSelectedInstructorIds((current) => ({ ...current, [groupId]: "" }));
      await groupsQuery.refetch();
      setFeedback(groupId, {
        message: "Instructor assignment saved.",
        tone: "success",
      });
    } catch (mutationError) {
      setFeedback(groupId, {
        message: getMutationErrorMessage(mutationError),
        tone: "error",
      });
    } finally {
      setAssigningGroupId(null);
    }
  }

  async function handleAssignMentor(
    groupId: number,
    currentMentorAccountId: number | null,
  ) {
    const mentorId = Number(selectedMentorIds[groupId]);

    if (!Number.isInteger(mentorId) || mentorId < 1) {
      setFeedback(groupId, {
        message: "Choose an active mentor before assigning the group.",
        tone: "error",
      });
      return;
    }

    if (mentorId === currentMentorAccountId) {
      setFeedback(groupId, {
        message: "This mentor is already assigned to the group.",
        tone: "error",
      });
      return;
    }

    setAssigningGroupId(groupId);
    setRowFeedback((current) => ({ ...current, [groupId]: undefined }));

    try {
      await assignMentorMutation.mutateAsync({
        groupId,
        payload: { mentorId },
      });
      setSelectedMentorIds((current) => ({ ...current, [groupId]: "" }));
      await groupsQuery.refetch();
      setFeedback(groupId, {
        message: "Mentor assignment saved.",
        tone: "success",
      });
    } catch (mutationError) {
      setFeedback(groupId, {
        message: getMutationErrorMessage(mutationError),
        tone: "error",
      });
    } finally {
      setAssigningGroupId(null);
    }
  }

  return (
    <div className={pageClassName}>
      <PageHeader
        description="Review the current assignment and choose active Instructor or Mentor accounts for each group."
        eyebrow="Admin"
        title="Assign instructors & mentors"
      />

      <Card>
        <CardContent className="grid gap-4">
          <form className={filterClassName} onSubmit={handleApplyFilters}>
            <TextInput
              icon={<Search size={16} />}
              label="Search groups"
              onChange={(event) => setGroupSearchInput(event.target.value)}
              placeholder="Group name, term, or course"
              value={groupSearchInput}
            />
            <div className="flex flex-wrap gap-2 max-[480px]:grid max-[480px]:grid-cols-1 max-[480px]:[&>button]:w-full">
              <Button type="submit">Apply filters</Button>
              <Button onClick={handleResetFilters} variant="secondary">
                Reset
              </Button>
            </div>
          </form>

          <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm text-muted">
            <UserRoundPlus className="mt-0.5 shrink-0" size={18} />
            <span className="break-words">
              Search Mentor and Instructor directly inside each assignment row.
              Results are filtered by active accounts only.
            </span>
          </div>
        </CardContent>
      </Card>

      {groupsQuery.isLoading ? (
        <LoadingState title="Loading groups" />
      ) : groupsQuery.isError ? (
        <EmptyState
          description={getLoadErrorMessage(groupsQuery.error)}
          title="Assignment data unavailable"
        />
      ) : groups.length === 0 ? (
        <EmptyState
          description="No groups match the current group filter."
          title="No groups found"
        />
      ) : assigningGroupId !== null ? (
        <AssignmentResultsSkeleton rowCount={paginatedGroups.length} />
      ) : (
        <Card>
          <div className={tableWrapClassName}>
            <table className={tableClassName}>
              <thead>
                <tr>
                  <th className={tableHeadCellClassName}>Group</th>
                  <th className={tableHeadCellClassName}>Term / course</th>
                  <th className={tableHeadCellClassName}>Mentor</th>
                  <th className={tableHeadCellClassName}>Current instructor</th>
                  <th className={tableHeadCellClassName}>Assign new instructor</th>
                  <th className={tableHeadCellClassName} aria-label="Assign" />
                </tr>
              </thead>
              <tbody>
                {paginatedGroups.map((group) => {
                  const selectedInstructorId = selectedInstructorIds[group.id] ?? "";
                  const selectedMentorId = selectedMentorIds[group.id] ?? "";
                  const currentInstructorAccountId =
                    group.instructorAccountId ?? group.instructorId;
                  const currentMentorAccountId =
                    group.mentorAccountId ?? group.mentorId;
                  const isSameInstructor =
                    Boolean(selectedInstructorId) &&
                    Number(selectedInstructorId) === currentInstructorAccountId;
                  const isSameMentor =
                    Boolean(selectedMentorId) &&
                    Number(selectedMentorId) === currentMentorAccountId;
                  const isCurrentRowPending = assigningGroupId === group.id;
                  const feedback = rowFeedback[group.id];

                  return (
                    <tr key={group.id}>
                      <td className={tableCellClassName}>
                        <div className="grid gap-1">
                          <span className="font-bold">{group.name}</span>
                          <span className="text-xs text-muted">{group.groupNo}</span>
                        </div>
                      </td>
                      <td className={tableCellClassName}>
                        <div className="grid gap-1">
                          <span>{group.term}</span>
                          <span className="text-xs text-muted">
                            {group.courseCode}
                          </span>
                        </div>
                      </td>
                      <td className={tableCellClassName}>
                        <div className="grid gap-2">
                          {group.mentorName ? (
                            <Badge tone="neutral">{group.mentorName}</Badge>
                          ) : (
                            <span className="text-muted">Unassigned</span>
                          )}
                          <UserSearchCombobox
                            ariaLabel={`New mentor for ${group.name}`}
                            disabled={assigningGroupId !== null}
                            onChange={(event) => {
                              setSelectedMentorIds((current) => ({
                                ...current,
                                [group.id]: event,
                              }));
                              setRowFeedback((current) => ({
                                ...current,
                                [group.id]: undefined,
                              }));
                            }}
                            placeholder="Search active mentor"
                            role="MENTOR"
                            value={selectedMentorId}
                          />
                          <Button
                            disabled={
                              assigningGroupId !== null ||
                              !selectedMentorId ||
                              isSameMentor
                            }
                            onClick={() =>
                              handleAssignMentor(group.id, currentMentorAccountId)
                            }
                            size="sm"
                            variant="secondary"
                          >
                            Assign mentor
                          </Button>
                        </div>
                      </td>
                      <td className={tableCellClassName}>
                        {group.instructorName || group.instructorCode ? (
                          <div className="grid min-w-0 gap-1">
                            <span className="min-w-0 break-words font-medium">
                              {group.instructorName ?? "Assigned instructor"}
                            </span>
                            <span className="break-all text-xs text-muted">
                              {group.instructorCode ?? "No instructor code"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td className={cn(tableCellClassName, "min-w-[280px]")}>
                        <div className="grid gap-2">
                          <UserSearchCombobox
                            ariaLabel={`New instructor for ${group.name}`}
                            disabled={assigningGroupId !== null}
                            onChange={(event) => {
                              setSelectedInstructorIds((current) => ({
                                ...current,
                                [group.id]: event,
                              }));
                              setRowFeedback((current) => ({
                                ...current,
                                [group.id]: undefined,
                              }));
                            }}
                            placeholder="Search active instructor"
                            role="INSTRUCTOR"
                            value={selectedInstructorId}
                          />
                          {feedback && (
                            <span
                              className={cn(
                                "text-xs",
                                feedback.tone === "success"
                                  ? "text-green-800"
                                  : "text-red-700",
                              )}
                            >
                              {feedback.message}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tableCellClassName}>
                        <Button
                          disabled={
                            assigningGroupId !== null ||
                            !selectedInstructorId ||
                            isSameInstructor
                          }
                          onClick={() =>
                            handleAssign(group.id, currentInstructorAccountId)
                          }
                          size="sm"
                        >
                          {isCurrentRowPending ? "Saving..." : "Assign"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={mobileListClassName}>
            {paginatedGroups.map((group) => {
              const selectedInstructorId =
                selectedInstructorIds[group.id] ?? "";
              const selectedMentorId = selectedMentorIds[group.id] ?? "";
              const currentInstructorAccountId =
                group.instructorAccountId ?? group.instructorId;
              const currentMentorAccountId =
                group.mentorAccountId ?? group.mentorId;
              const isSameInstructor =
                Boolean(selectedInstructorId) &&
                Number(selectedInstructorId) === currentInstructorAccountId;
              const isSameMentor =
                Boolean(selectedMentorId) &&
                Number(selectedMentorId) === currentMentorAccountId;
              const isCurrentRowPending = assigningGroupId === group.id;
              const feedback = rowFeedback[group.id];

              return (
                <article className={mobileCardClassName} key={group.id}>
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className="grid min-w-0 gap-1">
                      <h3 className="m-0 break-words text-base font-bold text-foreground">
                        {group.name}
                      </h3>
                      <span className="break-all text-xs text-muted">
                        {group.groupNo}
                      </span>
                    </div>
                    <Badge tone="neutral">{group.status}</Badge>
                  </div>

                  <dl className="m-0 grid min-w-0 grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                    <div className="grid min-w-0 gap-1">
                      <dt className="text-[11px] font-bold text-muted uppercase">
                        Term / course
                      </dt>
                      <dd className="m-0 break-words text-sm text-foreground">
                        {group.term} · {group.courseCode}
                      </dd>
                    </div>
                    <div className="grid min-w-0 gap-1">
                      <dt className="text-[11px] font-bold text-muted uppercase">
                        Mentor
                      </dt>
                      <dd className="m-0 break-words text-sm text-foreground">
                        {group.mentorName ?? "Unassigned"}
                      </dd>
                    </div>
                  </dl>

                  <div className="grid min-w-0 gap-3 border-t border-border pt-3">
                    <UserSearchCombobox
                      ariaLabel={`New mentor for ${group.name}`}
                      disabled={assigningGroupId !== null}
                      onChange={(event) => {
                        setSelectedMentorIds((current) => ({
                          ...current,
                          [group.id]: event,
                        }));
                        setRowFeedback((current) => ({
                          ...current,
                          [group.id]: undefined,
                        }));
                      }}
                      placeholder="Search active mentor"
                      role="MENTOR"
                      value={selectedMentorId}
                    />
                    <Button
                      className="w-full"
                      disabled={
                        assigningGroupId !== null ||
                        !selectedMentorId ||
                        isSameMentor
                      }
                      onClick={() =>
                        handleAssignMentor(group.id, currentMentorAccountId)
                      }
                      variant="secondary"
                    >
                      Assign mentor
                    </Button>
                  </div>

                  <div className="grid min-w-0 gap-1 border-t border-border pt-3">
                    <span className="text-[11px] font-bold text-muted uppercase">
                      Current instructor
                    </span>
                    <span className="break-words text-sm font-medium text-foreground">
                      {group.instructorName ?? "Unassigned"}
                    </span>
                    <span className="break-all text-xs text-muted">
                      {group.instructorCode ?? "No instructor code"}
                    </span>
                  </div>

                  <div className="grid min-w-0 gap-3 border-t border-border pt-3">
                    <UserSearchCombobox
                      ariaLabel={`New instructor for ${group.name}`}
                      disabled={assigningGroupId !== null}
                      onChange={(event) => {
                        setSelectedInstructorIds((current) => ({
                          ...current,
                          [group.id]: event,
                        }));
                        setRowFeedback((current) => ({
                          ...current,
                          [group.id]: undefined,
                        }));
                      }}
                      placeholder="Search active instructor"
                      role="INSTRUCTOR"
                      value={selectedInstructorId}
                    />
                    {feedback && (
                      <span
                        className={cn(
                          "break-words text-xs",
                          feedback.tone === "success"
                            ? "text-green-800"
                            : "text-red-700",
                        )}
                        role="status"
                      >
                        {feedback.message}
                      </span>
                    )}
                    <Button
                      className="w-full"
                      disabled={
                        assigningGroupId !== null ||
                        !selectedInstructorId ||
                        isSameInstructor
                      }
                      onClick={() =>
                        handleAssign(group.id, currentInstructorAccountId)
                      }
                    >
                      {isCurrentRowPending ? "Saving..." : "Assign instructor"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          {groupTotalPages > 1 && (
            <div className="flex min-w-0 items-center justify-between gap-4 border-t border-border px-6 py-4 max-[680px]:flex-col max-[680px]:items-stretch max-[480px]:px-4">
              <span className="text-sm text-muted">
                Page {groupPage + 1} of {groupTotalPages} ({groups.length} groups)
              </span>
              <div className="flex gap-2 max-[480px]:grid max-[480px]:grid-cols-2 max-[480px]:[&>button]:w-full">
                <Button
                  disabled={assigningGroupId !== null || groupPage === 0}
                  onClick={() => handleGroupPageChange(Math.max(0, groupPage - 1))}
                  size="sm"
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  disabled={
                    assigningGroupId !== null || groupPage >= groupTotalPages - 1
                  }
                  onClick={() => handleGroupPageChange(groupPage + 1)}
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

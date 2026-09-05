"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Pencil,
  Search,
  UserRoundPlus,
  UserRoundX,
  Users,
  X,
} from "lucide-react";

import {
  type AdminGroupStatusFilter,
  useAssignGroupInstructor,
  useAssignGroupMentor,
  useAdminGroups,
  useUnassignGroupInstructor,
  useUnassignGroupMentor,
} from "@/modules/groups";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
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
const skeletonLineClassName = "h-3 animate-pulse rounded-full bg-border";

const GROUP_STATUS_FILTERS: Array<{
  label: string;
  value: AdminGroupStatusFilter;
}> = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "All", value: "ALL" },
];

type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }
  if (currentPage <= 3) {
    return [0, 1, 2, 3, 4, "end-ellipsis", totalPages - 1];
  }
  if (currentPage >= totalPages - 4) {
    return [
      0,
      "start-ellipsis",
      totalPages - 5,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
    ];
  }
  return [
    0,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages - 1,
  ];
}

type AppliedFilters = {
  groupSearch: string;
};

type RowFeedback = {
  message: string;
  tone: "error" | "success";
};

type PendingUnassignment = {
  groupId: number;
  groupName: string;
  personName: string;
  role: "instructor" | "mentor";
};

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function getPersonInitials(name: string | null | undefined, fallback: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return fallback.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getLoadErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load groups or active instructors/mentors. Please try again.";
}

function getMutationErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to save the assignment change. Please try again.";
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
  const visibleCardCount = Math.min(Math.max(1, rowCount), 6);

  return (
    <div
      aria-busy="true"
      aria-label="Saving group assignment"
      className="grid min-w-0 grid-cols-2 gap-4 max-[980px]:grid-cols-1"
    >
      <span className="sr-only" role="status">
        Saving assignment and refreshing groups
      </span>
      {Array.from({ length: visibleCardCount }, (_, cardIndex) => (
        <Card className="overflow-visible" key={`assignment-card-${cardIndex}`}>
          <CardContent className="grid animate-pulse gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 gap-2">
                <div className={cn(skeletonLineClassName, "h-5 w-2/3")} />
                <div className={cn(skeletonLineClassName, "w-1/3")} />
              </div>
              <div className={cn(skeletonLineClassName, "h-7 w-20")} />
            </div>
            <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
              {[0, 1].map((section) => (
                <div
                  className="grid gap-3 rounded-2xl border border-border bg-background p-4"
                  key={section}
                >
                  <div className={cn(skeletonLineClassName, "w-24")} />
                  <div className={cn(skeletonLineClassName, "h-5 w-1/2")} />
                  <div className={cn(skeletonLineClassName, "h-11 w-full rounded-xl")} />
                  <div className={cn(skeletonLineClassName, "h-10 w-full rounded-xl")} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type AssignmentPanelProps = {
  blockedReason?: string;
  currentCode?: string | null;
  currentName?: string | null;
  disabled: boolean;
  groupName: string;
  isSameSelection: boolean;
  onAssign: () => Promise<boolean>;
  onChange: (value: string) => void;
  onUnassign?: () => void;
  pending: boolean;
  role: Extract<UserRole, "INSTRUCTOR" | "MENTOR">;
  value: string;
};

function AssignmentPanel({
  blockedReason,
  currentCode,
  currentName,
  disabled,
  groupName,
  isSameSelection,
  onAssign,
  onChange,
  onUnassign,
  pending,
  role,
  value,
}: AssignmentPanelProps) {
  const isInstructor = role === "INSTRUCTOR";
  const roleLabel = isInstructor ? "Instructor" : "Mentor";
  const hasCurrentAssignment = Boolean(currentName || currentCode);
  const [isEditing, setIsEditing] = useState(false);
  const displayName =
    currentName ?? `No ${roleLabel.toLowerCase()} assigned`;

  async function handleSave() {
    if (await onAssign()) setIsEditing(false);
  }

  function handleCancel() {
    onChange("");
    setIsEditing(false);
  }

  return (
    <section className="grid h-full min-w-0 content-start gap-4 rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
            isInstructor
              ? "bg-orange-100 text-brand-primary"
              : "bg-amber-100 text-amber-800",
          )}
        >
          {isInstructor ? <GraduationCap size={20} /> : <BookOpen size={20} />}
        </span>
        <div className="grid min-w-0 gap-0.5">
          <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
            {roleLabel}
          </span>
          <span className="text-sm font-semibold text-foreground">
            Current assignment
          </span>
        </div>
      </div>

      <div
        className={cn(
          "grid min-h-24 min-w-0 gap-3 rounded-xl border p-3",
          hasCurrentAssignment
            ? "border-border bg-surface"
            : "border-dashed border-border bg-surface/50",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              hasCurrentAssignment
                ? isInstructor
                  ? "bg-orange-100 text-brand-primary"
                  : "bg-amber-100 text-amber-800"
                : "bg-border text-muted",
            )}
          >
            {getPersonInitials(currentName, roleLabel)}
          </span>
          <div className="grid min-w-0 flex-1 gap-1">
            <span
              className={cn(
                "line-clamp-2 break-words text-sm leading-5",
                hasCurrentAssignment
                  ? "font-semibold text-foreground"
                  : "text-muted",
              )}
              title={currentName ?? undefined}
            >
              {displayName}
            </span>
            {currentCode && (
              <span className="break-all text-xs text-muted">{currentCode}</span>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={disabled || Boolean(blockedReason)}
              icon={
                hasCurrentAssignment ? (
                  <Pencil size={14} />
                ) : (
                  <UserRoundPlus size={14} />
                )
              }
              onClick={() => setIsEditing(true)}
              size="sm"
              variant="primary"
            >
              {hasCurrentAssignment
                ? "Change"
                : `Assign ${roleLabel.toLowerCase()}`}
            </Button>
            {hasCurrentAssignment && onUnassign && (
              <Button
                disabled={disabled}
                icon={<UserRoundX size={14} />}
                onClick={onUnassign}
                size="sm"
                variant="danger"
              >
                Unassign
              </Button>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="grid gap-2 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
          <UserSearchCombobox
            ariaLabel={`New ${roleLabel.toLowerCase()} for ${groupName}`}
            disabled={disabled || Boolean(blockedReason)}
            onChange={onChange}
            placeholder={`Search active ${roleLabel.toLowerCase()}`}
            role={role}
            value={value}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={disabled}
              onClick={handleCancel}
              size="sm"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={
                disabled || Boolean(blockedReason) || !value || isSameSelection
              }
              onClick={handleSave}
              size="sm"
              variant="primary"
            >
              {pending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export function AdminGroupInstructorPage() {
  const [groupSearchInput, setGroupSearchInput] = useState("");
  const [groupStatus, setGroupStatus] =
    useState<AdminGroupStatusFilter>("ACTIVE");
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
  const [pendingUnassignment, setPendingUnassignment] =
    useState<PendingUnassignment | null>(null);
  const [rowFeedback, setRowFeedback] = useState<
    Record<number, RowFeedback | undefined>
  >({});

  const groupsQuery = useAdminGroups({
    page: groupPage,
    search: optional(appliedFilters.groupSearch),
    size: GROUP_PAGE_SIZE,
    status: groupStatus,
  });
  const assignInstructorMutation = useAssignGroupInstructor();
  const assignMentorMutation = useAssignGroupMentor();
  const unassignInstructorMutation = useUnassignGroupInstructor();
  const unassignMentorMutation = useUnassignGroupMentor();
  const groupsPage = groupsQuery.data?.data;
  const groups = groupsPage?.content ?? [];
  const groupTotalPages = groupsPage?.totalPages ?? 0;
  const paginationItems = getPaginationItems(groupPage, groupTotalPages);

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
    setGroupStatus("ACTIVE");
    setGroupPage(0);
    clearSelections();
  }

  function handleStatusChange(status: AdminGroupStatusFilter) {
    setGroupStatus(status);
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
      return false;
    }

    if (instructorId === currentInstructorAccountId) {
      setFeedback(groupId, {
        message: "This instructor is already assigned to the group.",
        tone: "error",
      });
      return false;
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
      return true;
    } catch (mutationError) {
      setFeedback(groupId, {
        message: getMutationErrorMessage(mutationError),
        tone: "error",
      });
      return false;
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
      return false;
    }

    if (mentorId === currentMentorAccountId) {
      setFeedback(groupId, {
        message: "This mentor is already assigned to the group.",
        tone: "error",
      });
      return false;
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
      return true;
    } catch (mutationError) {
      setFeedback(groupId, {
        message: getMutationErrorMessage(mutationError),
        tone: "error",
      });
      return false;
    } finally {
      setAssigningGroupId(null);
    }
  }

  async function handleConfirmUnassign() {
    if (!pendingUnassignment) return;

    const { groupId, role } = pendingUnassignment;
    setAssigningGroupId(groupId);
    setRowFeedback((current) => ({ ...current, [groupId]: undefined }));

    try {
      if (role === "instructor") {
        await unassignInstructorMutation.mutateAsync({ groupId });
      } else {
        await unassignMentorMutation.mutateAsync({ groupId });
      }
      setPendingUnassignment(null);
      await groupsQuery.refetch();
      setFeedback(groupId, {
        message: `${role === "instructor" ? "Instructor" : "Mentor"} unassigned successfully.`,
        tone: "success",
      });
    } catch (mutationError) {
      setPendingUnassignment(null);
      setFeedback(groupId, {
        message: getMutationErrorMessage(mutationError),
        tone: "error",
      });
    } finally {
      setAssigningGroupId(null);
    }
  }

  const isUnassigning =
    unassignInstructorMutation.isPending || unassignMentorMutation.isPending;

  return (
    <div className={pageClassName}>
      <PageHeader
        description="Review group status and manage Instructor or Mentor assignments safely."
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

          <div className="grid gap-2 border-t border-border pt-4">
            <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
              Group status
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter groups by status">
              {GROUP_STATUS_FILTERS.map((filter) => (
                <Button
                  aria-pressed={groupStatus === filter.value}
                  key={filter.value}
                  onClick={() => handleStatusChange(filter.value)}
                  size="sm"
                  variant={groupStatus === filter.value ? "primary" : "secondary"}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm text-muted">
            <UserRoundPlus className="mt-0.5 shrink-0" size={18} />
            <span className="break-words">
              Only active groups with at least one member can receive a new
              assignment. Existing assignments can still be removed from
              inactive or empty groups.
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
        <AssignmentResultsSkeleton rowCount={groups.length} />
      ) : (
        <div className="grid min-w-0 gap-5">
          <div className="grid min-w-0 grid-cols-2 gap-4 max-[980px]:grid-cols-1">
            {groups.map((group) => {
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
              const blockedReason =
                group.status !== "ACTIVE"
                  ? "This group is inactive. Remove an existing assignment if needed."
                  : group.memberCount === 0
                    ? "This group has no members and cannot receive a new assignment."
                    : undefined;

              return (
                <Card
                  className={cn(
                    "overflow-visible transition-opacity",
                    group.status === "INACTIVE" && "opacity-80",
                  )}
                  key={group.id}
                >
                  <CardContent className="grid gap-5">
                    <header className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                      <div className="grid min-w-0 gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <h2 className="m-0 min-w-0 break-words text-xl font-bold text-foreground">
                            {group.name}
                          </h2>
                          <Badge tone="neutral">Group {group.groupNo}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen size={15} />
                            {group.term} · {group.courseCode}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={15} />
                            {group.memberCount}{" "}
                            {group.memberCount === 1 ? "member" : "members"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge
                          tone={group.status === "ACTIVE" ? "success" : "danger"}
                        >
                          {group.status === "ACTIVE" ? "Active" : "Inactive"}
                        </Badge>
                        {group.memberCount === 0 && (
                          <Badge tone="warning">Empty group</Badge>
                        )}
                      </div>
                    </header>

                    {blockedReason && (
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm leading-5 text-yellow-800">
                        {blockedReason} You can still remove an existing
                        assignment below.
                      </div>
                    )}

                    <div className="grid min-w-0 grid-cols-2 gap-3 max-[620px]:grid-cols-1">
                      <AssignmentPanel
                        blockedReason={blockedReason}
                        currentCode={group.mentorCode}
                        currentName={
                          group.mentorName ??
                          (currentMentorAccountId ? "Assigned mentor" : null)
                        }
                        disabled={assigningGroupId !== null}
                        groupName={group.name}
                        isSameSelection={isSameMentor}
                        onAssign={() =>
                          handleAssignMentor(group.id, currentMentorAccountId)
                        }
                        onChange={(value) => {
                          setSelectedMentorIds((current) => ({
                            ...current,
                            [group.id]: value,
                          }));
                          setRowFeedback((current) => ({
                            ...current,
                            [group.id]: undefined,
                          }));
                        }}
                        onUnassign={
                          currentMentorAccountId
                            ? () =>
                                setPendingUnassignment({
                                  groupId: group.id,
                                  groupName: group.name,
                                  personName:
                                    group.mentorName ??
                                    group.mentorCode ??
                                    "the current mentor",
                                  role: "mentor",
                                })
                            : undefined
                        }
                        pending={isCurrentRowPending}
                        role="MENTOR"
                        value={selectedMentorId}
                      />
                      <AssignmentPanel
                        blockedReason={blockedReason}
                        currentCode={group.instructorCode}
                        currentName={
                          group.instructorName ??
                          (currentInstructorAccountId
                            ? "Assigned instructor"
                            : null)
                        }
                        disabled={assigningGroupId !== null}
                        groupName={group.name}
                        isSameSelection={isSameInstructor}
                        onAssign={() =>
                          handleAssign(group.id, currentInstructorAccountId)
                        }
                        onChange={(value) => {
                          setSelectedInstructorIds((current) => ({
                            ...current,
                            [group.id]: value,
                          }));
                          setRowFeedback((current) => ({
                            ...current,
                            [group.id]: undefined,
                          }));
                        }}
                        onUnassign={
                          currentInstructorAccountId
                            ? () =>
                                setPendingUnassignment({
                                  groupId: group.id,
                                  groupName: group.name,
                                  personName:
                                    group.instructorName ??
                                    group.instructorCode ??
                                    "the current instructor",
                                  role: "instructor",
                                })
                            : undefined
                        }
                        pending={isCurrentRowPending}
                        role="INSTRUCTOR"
                        value={selectedInstructorId}
                      />
                    </div>

                    {feedback && (
                      <div
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm",
                          feedback.tone === "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-700",
                        )}
                        role="status"
                      >
                        {feedback.message}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {groupTotalPages > 1 && (
            <Card>
              <CardContent className="flex min-w-0 flex-wrap items-center justify-between gap-4 max-[680px]:justify-center">
                <span className="text-sm text-muted max-[680px]:w-full max-[680px]:text-center">
                  Page {groupPage + 1} of {groupTotalPages} ({groupsPage?.totalElements ?? 0} groups)
                </span>
                <nav
                  aria-label="Assignment group pagination"
                  className="flex flex-wrap items-center justify-center gap-2"
                >
                  <Button
                    disabled={assigningGroupId !== null || groupPage === 0}
                    icon={<ChevronLeft size={16} />}
                    onClick={() =>
                      handleGroupPageChange(Math.max(0, groupPage - 1))
                    }
                    size="sm"
                    variant="secondary"
                  >
                    Previous
                  </Button>

                  {paginationItems.map((item) =>
                    typeof item === "number" ? (
                      <Button
                        aria-current={item === groupPage ? "page" : undefined}
                        aria-label={`Go to page ${item + 1}`}
                        className="min-w-9 px-3"
                        disabled={assigningGroupId !== null}
                        key={item}
                        onClick={() => handleGroupPageChange(item)}
                        size="sm"
                        variant={item === groupPage ? "primary" : "secondary"}
                      >
                        {item + 1}
                      </Button>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="px-1 text-sm font-semibold text-muted"
                        key={item}
                      >
                        …
                      </span>
                    ),
                  )}

                  <Button
                    disabled={
                      assigningGroupId !== null ||
                      groupPage >= groupTotalPages - 1
                    }
                    icon={<ChevronRight size={16} />}
                    onClick={() => handleGroupPageChange(groupPage + 1)}
                    size="sm"
                    variant="secondary"
                  >
                    Next
                  </Button>
                </nav>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {pendingUnassignment && (
        <ResponsiveDialog
          closeLabel="Cancel unassignment"
          closeOnBackdrop={!isUnassigning}
          closeOnEscape={!isUnassigning}
          description={`${pendingUnassignment.groupName} · ${pendingUnassignment.personName}`}
          footer={
            <>
              <Button
                disabled={isUnassigning}
                onClick={() => setPendingUnassignment(null)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                disabled={isUnassigning}
                icon={<UserRoundX size={16} />}
                onClick={handleConfirmUnassign}
                variant="danger"
              >
                {isUnassigning ? "Unassigning..." : "Confirm unassign"}
              </Button>
            </>
          }
          onClose={() => {
            if (!isUnassigning) setPendingUnassignment(null);
          }}
          title={`Unassign ${pendingUnassignment.role}`}
        >
          <p className="m-0 text-sm leading-6 text-muted">
            This removes the current assignment only. Existing meetings,
            milestone grades, and contribution history will be preserved.
          </p>
        </ResponsiveDialog>
      )}
    </div>
  );
}

"use client";

import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAvailableAcademicTerms } from "@/modules/feedback";
import { useGroupMeetings } from "@/modules/mentoring";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";

import {
  useClaimInstructorGroup,
  useInstructorGroupBoard,
} from "../../hooks";
import type {
  InstructorGroupAssignmentFilter,
  InstructorGroupBoardItemDto,
  InstructorGroupBoardSummaryDto,
} from "../../types/instructor-groups.types";
import { ConfirmDialog } from "../student/confirm-dialog";

const PAGE_SIZE = 12;
const EMPTY_SUMMARY: InstructorGroupBoardSummaryDto = {
  availableGroups: 0,
  myGroups: 0,
  otherGroups: 0,
  totalGroups: 0,
};

const ASSIGNMENT_FILTERS: Array<{
  label: string;
  value: InstructorGroupAssignmentFilter;
}> = [
  { label: "All groups", value: "ALL" },
  { label: "Available", value: "AVAILABLE" },
  { label: "My groups", value: "MINE" },
  { label: "Other instructors", value: "OTHER" },
];

type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
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

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function MeetingReportsDialog({
  groupId,
  groupName,
  onClose,
}: {
  groupId: number;
  groupName: string;
  onClose: () => void;
}) {
  const query = useGroupMeetings(groupId);
  const meetings = query.data?.data ?? [];

  return (
    <ResponsiveDialog
      description={groupName}
      onClose={onClose}
      title="Mentor meeting reports"
    >
      {query.isLoading ? (
        <LoadingState title="Loading meeting reports" />
      ) : query.isError ? (
        <EmptyState title="Unable to load reports" />
      ) : meetings.length === 0 ? (
        <EmptyState title="No meetings reported" />
      ) : (
        <div className="grid gap-3">
          {meetings.map((meeting) => (
            <article
              className="grid gap-2 rounded-xl border border-border bg-background p-4"
              key={meeting.id}
            >
              <div className="flex flex-wrap justify-between gap-2">
                <strong>
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(meeting.startAt))}
                </strong>
                <Badge
                  tone={
                    meeting.status === "COMPLETED"
                      ? "success"
                      : meeting.status === "CANCELED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {meeting.status}
                </Badge>
              </div>
              <span className="text-sm text-muted">
                {meeting.mentorName} · {meeting.note || "No note"}
              </span>
              {meeting.evidenceImageUrl ? (
                <a
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary"
                  href={meeting.evidenceImageUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink size={14} /> View evidence
                </a>
              ) : (
                <span className="text-xs text-muted">
                  No evidence submitted.
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </ResponsiveDialog>
  );
}

function SummaryCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "brand" | "neutral" | "success" | "warning";
  value: number;
}) {
  return (
    <Card>
      <CardContent className="grid gap-2 p-5">
        <Badge className="w-fit" tone={tone}>
          {label}
        </Badge>
        <strong className="text-3xl text-foreground">{value}</strong>
      </CardContent>
    </Card>
  );
}

function AssignmentBadge({ group }: { group: InstructorGroupBoardItemDto }) {
  if (group.assignmentState === "AVAILABLE") {
    return <Badge tone="success">Available</Badge>;
  }
  if (group.assignmentState === "MINE") {
    return <Badge tone="brand">My group</Badge>;
  }
  return <Badge tone="neutral">Assigned</Badge>;
}

function GroupCard({
  group,
  isClaiming,
  onClaim,
  onViewMeetings,
}: {
  group: InstructorGroupBoardItemDto;
  isClaiming: boolean;
  onClaim: () => void;
  onViewMeetings: () => void;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-card-interactive">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-primary">
            {group.term} · {group.courseCode} · Group {group.groupNo}
          </span>
          <h2 className="m-0 break-words text-xl font-bold text-foreground">
            {group.name}
          </h2>
          <span className="break-words text-sm text-muted">
            {group.projectName || "No project name"}
          </span>
        </div>
        <AssignmentBadge group={group} />
      </div>

      <dl className="m-0 grid grid-cols-2 gap-3 rounded-xl bg-background p-4 text-sm max-[520px]:grid-cols-1">
        <div className="grid gap-1">
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">
            Research domain
          </dt>
          <dd className="m-0 break-words text-foreground">
            {group.researchDomain || "Not provided"}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">
            Mentor
          </dt>
          <dd className="m-0 break-words text-foreground">
            {group.mentorName || "Not assigned"}
          </dd>
        </div>
        <div className="col-span-2 grid gap-1 max-[520px]:col-span-1">
          <dt className="text-xs font-bold uppercase tracking-wide text-muted">
            Idea description
          </dt>
          <dd className="m-0 line-clamp-3 break-words text-foreground">
            {group.ideaDescription || "Not provided"}
          </dd>
        </div>
      </dl>

      <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <strong className="inline-flex items-center gap-2 text-sm text-foreground">
            <Users size={16} /> Members
          </strong>
          <div className="flex items-center gap-2">
            {group.isLock && (
              <Badge tone="warning">
                <Lock size={12} /> Locked
              </Badge>
            )}
            <Badge tone="neutral">{group.memberCount}</Badge>
          </div>
        </div>

        {group.members.length === 0 ? (
          <span className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            This group has no members.
          </span>
        ) : (
          <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
            {group.members.map((member) => (
              <div
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border border-border bg-background p-3"
                key={member.studentId}
              >
                <div className="grid min-w-0 gap-1">
                  <span className="break-words text-sm font-semibold text-foreground">
                    {member.fullName}
                  </span>
                  <span className="break-all text-xs text-muted">
                    {member.studentCode}
                    {member.email ? ` · ${member.email}` : ""}
                  </span>
                  <span className="break-words text-xs text-muted">
                    {[member.className, member.major].filter(Boolean).join(" · ") ||
                      "Class and major not provided"}
                  </span>
                </div>
                {member.role === "LEADER" && <Badge tone="brand">Leader</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto grid gap-3 border-t border-border pt-4">
        {group.assignmentState === "AVAILABLE" ? (
          <Button
            disabled={isClaiming}
            icon={<UserCheck size={16} />}
            onClick={onClaim}
          >
            {isClaiming ? "Claiming..." : "Claim this group"}
          </Button>
        ) : group.assignmentState === "MINE" ? (
          <>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <ShieldCheck className="text-brand-primary" size={17} />
              <span>
                You are responsible for this group
                {group.instructorCode ? ` (${group.instructorCode})` : ""}.
              </span>
            </div>
            <Button
              icon={<CalendarClock size={15} />}
              onClick={onViewMeetings}
              variant="secondary"
            >
              View meeting reports
            </Button>
          </>
        ) : (
          <div className="grid gap-1 text-sm">
            <span className="font-semibold text-foreground">
              {group.instructorName || "Assigned instructor"}
            </span>
            <span className="text-muted">
              {group.instructorCode || "No instructor code"}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export function InstructorGroupsPage() {
  const [term, setTerm] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState("");
  const [assignment, setAssignment] =
    useState<InstructorGroupAssignmentFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [claimGroup, setClaimGroup] =
    useState<InstructorGroupBoardItemDto | null>(null);
  const [meetingGroup, setMeetingGroup] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const termsQuery = useAvailableAcademicTerms();
  const availableTerms = termsQuery.data?.data ?? [];
  const selectedTerm = term ?? availableTerms[0]?.code ?? "";
  const canLoadBoard =
    !termsQuery.isLoading && !termsQuery.isError && selectedTerm.length > 0;
  const boardQuery = useInstructorGroupBoard(
    {
      assignment,
      courseCode: optional(courseCode),
      page,
      search: optional(search),
      size: PAGE_SIZE,
      term: optional(selectedTerm),
    },
    canLoadBoard,
  );
  const claimMutation = useClaimInstructorGroup();

  const board = boardQuery.data?.data;
  const summary = board?.summary ?? EMPTY_SUMMARY;
  const groups = board?.groups.content ?? [];
  const courseOptions = useMemo(
    () => board?.courses ?? [],
    [board?.courses],
  );
  const totalPages = board?.groups.totalPages ?? 0;
  const currentPage = board?.groups.page ?? page;
  const paginationItems = useMemo(
    () => getPaginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  }

  function resetFilters() {
    setCourseCode("");
    setAssignment("ALL");
    setSearchInput("");
    setSearch("");
    setPage(0);
  }

  async function handleClaim(group: InstructorGroupBoardItemDto) {
    try {
      await claimMutation.mutateAsync(group.id);
      toast.success(`You are now responsible for ${group.name}.`);
      await boardQuery.refetch();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await boardQuery.refetch();
        throw new ApiError(
          "This group was just claimed by another instructor. The board has been refreshed.",
          409,
          error.payload,
        );
      }
      throw error;
    }
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        actions={
          <Button
            disabled={boardQuery.isFetching}
            icon={
              <RefreshCw
                className={cn(boardQuery.isFetching && "animate-spin")}
                size={16}
              />
            }
            onClick={() => boardQuery.refetch()}
            variant="secondary"
          >
            Refresh
          </Button>
        }
        description="Browse active groups in open terms and claim an available group to supervise."
        eyebrow="Instructor"
        title="Group board"
      />

      <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
        <SummaryCard label="Total groups" tone="neutral" value={summary.totalGroups} />
        <SummaryCard label="Available" tone="success" value={summary.availableGroups} />
        <SummaryCard label="My groups" tone="brand" value={summary.myGroups} />
        <SummaryCard label="Other instructors" tone="warning" value={summary.otherGroups} />
      </div>

      <Card>
        <CardContent className="grid gap-5">
          <form
            className="grid grid-cols-[minmax(180px,260px)_minmax(240px,1fr)_auto] items-end gap-3 max-[760px]:grid-cols-1"
            onSubmit={handleSearch}
          >
            <Select
              disabled={termsQuery.isLoading || availableTerms.length === 0}
              label="Open term"
              onChange={(event) => {
                setTerm(event.target.value);
                setCourseCode("");
                setPage(0);
              }}
              value={selectedTerm}
            >
              {availableTerms.length === 0 && (
                <option value="">No open terms</option>
              )}
              {availableTerms.map((item) => (
                <option key={item.id} value={item.code}>
                  {item.code}
                </option>
              ))}
            </Select>
            <TextInput
              icon={<Search size={16} />}
              label="Search groups or students"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Group, project, student ID, email, class..."
              value={searchInput}
            />
            <div className="flex gap-2 max-[760px]:grid max-[760px]:grid-cols-2">
              <Button type="submit">Search</Button>
              <Button onClick={resetFilters} type="button" variant="secondary">
                Reset
              </Button>
            </div>
          </form>

          <div className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Course
            </span>
            <div className="flex flex-wrap gap-2" role="tablist">
              <Button
                onClick={() => {
                  setCourseCode("");
                  setPage(0);
                }}
                size="sm"
                variant={courseCode === "" ? "primary" : "secondary"}
              >
                All ({courseOptions.reduce((sum, item) => sum + item.totalGroups, 0)})
              </Button>
              {courseOptions.map((course) => (
                <Button
                  key={course.courseCode}
                  onClick={() => {
                    setCourseCode(course.courseCode);
                    setPage(0);
                  }}
                  size="sm"
                  variant={
                    courseCode === course.courseCode ? "primary" : "secondary"
                  }
                >
                  {course.courseCode} ({course.totalGroups})
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Assignment
            </span>
            <div className="flex flex-wrap gap-2">
              {ASSIGNMENT_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  onClick={() => {
                    setAssignment(filter.value);
                    setPage(0);
                  }}
                  size="sm"
                  variant={assignment === filter.value ? "primary" : "secondary"}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {termsQuery.isLoading || (canLoadBoard && boardQuery.isLoading) ? (
        <LoadingState title="Loading group board" />
      ) : termsQuery.isError ? (
        <EmptyState
          className="border-red-200 bg-red-50"
          description={getErrorMessage(termsQuery.error)}
          icon={<AlertTriangle size={22} />}
          title="Unable to load group board"
        />
      ) : availableTerms.length === 0 ? (
        <EmptyState
          description="The group board becomes available when an academic term is open."
          icon={<CalendarClock size={22} />}
          title="No open academic terms"
        />
      ) : boardQuery.isError ? (
        <EmptyState
          className="border-red-200 bg-red-50"
          description={getErrorMessage(boardQuery.error)}
          icon={<AlertTriangle size={22} />}
          title="Unable to load group board"
        />
      ) : groups.length === 0 ? (
        <EmptyState
          description="No active groups match the selected term, course, search, and assignment filters."
          icon={<Users size={22} />}
          title="No groups found"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
            {groups.map((group) => (
              <GroupCard
                group={group}
                isClaiming={claimMutation.isPending}
                key={group.id}
                onClaim={() => setClaimGroup(group)}
                onViewMeetings={() =>
                  setMeetingGroup({ id: group.id, name: group.name })
                }
              />
            ))}
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 border-t border-border pt-4 max-[640px]:justify-center">
            <span className="text-sm text-muted max-[640px]:w-full max-[640px]:text-center">
              Page {currentPage + 1} of {Math.max(totalPages, 1)} (
              {board?.groups.totalElements ?? 0} matching groups)
            </span>
            <nav
              aria-label="Group board pagination"
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <Button
                disabled={!board?.groups.hasPrevious || claimMutation.isPending}
                icon={<ChevronLeft size={16} />}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                size="sm"
                variant="secondary"
              >
                Previous
              </Button>

              {paginationItems.map((item) =>
                typeof item === "number" ? (
                  <Button
                    aria-current={item === currentPage ? "page" : undefined}
                    aria-label={`Go to page ${item + 1}`}
                    className="min-w-9 px-3"
                    disabled={claimMutation.isPending}
                    key={item}
                    onClick={() => setPage(item)}
                    size="sm"
                    variant={item === currentPage ? "primary" : "secondary"}
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
                disabled={!board?.groups.hasNext || claimMutation.isPending}
                icon={<ChevronRight size={16} />}
                onClick={() => setPage((value) => value + 1)}
                size="sm"
                variant="secondary"
              >
                Next
              </Button>
            </nav>
          </div>
        </>
      )}

      {claimGroup && (
        <ConfirmDialog
          confirmLabel="Claim group"
          description={`You will become the instructor responsible for ${claimGroup.name}. Only an admin can change this assignment later.`}
          onClose={() => setClaimGroup(null)}
          onConfirm={() => handleClaim(claimGroup)}
          title="Claim this group?"
        >
          <div className="rounded-xl border border-border bg-background p-4 text-sm">
            <strong className="block text-foreground">{claimGroup.name}</strong>
            <span className="text-muted">
              {claimGroup.term} · {claimGroup.courseCode} · Group {claimGroup.groupNo}
            </span>
          </div>
        </ConfirmDialog>
      )}

      {meetingGroup && (
        <MeetingReportsDialog
          groupId={meetingGroup.id}
          groupName={meetingGroup.name}
          onClose={() => setMeetingGroup(null)}
        />
      )}
    </div>
  );
}

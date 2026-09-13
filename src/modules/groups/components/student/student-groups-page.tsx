"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";

import { useAuthStore } from "@/modules/auth";
import {
  Button,
  Badge,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";

import {
  useAcceptInvitation,
  useCancelJoinRequest,
  useCreateGroup,
  useCreateJoinRequest,
  useDeclineInvitation,
  useDiscoverGroups,
  useGroup,
  useMyGroups,
  useMyInvitations,
  useMyJoinRequests,
  useRecruitmentRoles,
} from "../../hooks";
import { resolveActiveGroup, useActiveGroupStore } from "../../stores";
import type {
  GroupJoinRequestDto,
  GroupRecruitmentNeedDto,
  GroupSummaryDto,
  InvitationDto,
} from "../../types";
import { ActiveGroupWorkspace } from "./active-group-workspace";
import { ConfirmDialog } from "./confirm-dialog";
import { DiscoverGroupCard } from "./discover-group-card";
import { DiscoverGroupDetail } from "./discover-group-detail";
import { GroupDetailModal } from "./group-detail-modal";
import { GroupFormModal } from "./group-form-modal";
import { InvitationList } from "./invitation-list";
import { MyJoinRequestsSection } from "./join-request-section";

type ConfirmAction = {
  confirmLabel: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  title: string;
  tone?: "default" | "danger";
};

type GroupsSection = "workspace" | "discover" | "invitations";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function buildPendingRequestMap(requests: GroupJoinRequestDto[]) {
  return new Map(
    requests
      .filter((request) => request.status === "PENDING")
      .map((request) => [request.groupId, request]),
  );
}

type StudentGroupsPageProps = {
  initialGroupId?: number | null;
  initialSection?: GroupsSection;
};

export function StudentGroupsPage({
  initialGroupId,
  initialSection = "workspace",
}: StudentGroupsPageProps) {
  const sessionEmail = useAuthStore((state) => state.session?.user.email);
  const [activeSection, setActiveSection] =
    useState<GroupsSection>(initialSection);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [studentGpa, setStudentGpa] = useState("");
  const [neededRole, setNeededRole] = useState<
    "" | GroupRecruitmentNeedDto["role"]
  >("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const discoverListRef = useRef<HTMLDivElement>(null);
  const discoverSentinelRef = useRef<HTMLDivElement>(null);
  const storedActiveGroupId = useActiveGroupStore(
    (state) => state.activeGroupId,
  );
  const setActiveGroupId = useActiveGroupStore(
    (state) => state.setActiveGroupId,
  );

  const myGroupsQuery = useMyGroups();
  const myInvitationsQuery = useMyInvitations();
  const recruitmentRolesQuery = useRecruitmentRoles();
  const discoverGroupsQuery = useDiscoverGroups(
    {
      name: debouncedSearch || undefined,
      neededRole: neededRole || undefined,
      studentGpa: studentGpa ? Number(studentGpa) : undefined,
    },
    activeSection === "discover",
  );
  const {
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
  } = discoverGroupsQuery;
  const myJoinRequestsQuery = useMyJoinRequests();
  const createGroupMutation = useCreateGroup();
  const createJoinRequestMutation = useCreateJoinRequest();
  const cancelJoinRequestMutation = useCancelJoinRequest();
  const acceptInvitationMutation = useAcceptInvitation();
  const declineInvitationMutation = useDeclineInvitation();

  const myGroups = useMemo(
    () => myGroupsQuery.data?.data ?? [],
    [myGroupsQuery.data?.data],
  );
  const activeGroupSummary = resolveActiveGroup(
    myGroups,
    initialGroupId ?? storedActiveGroupId ?? null,
  );
  const effectiveGroupId = activeGroupSummary?.id ?? null;
  const activeGroupQuery = useGroup(effectiveGroupId);
  const activeGroup = activeGroupQuery.data?.data ?? null;
  const invitations = myInvitationsQuery.data?.data ?? [];
  const joinRequests = useMemo(
    () => myJoinRequestsQuery.data?.data ?? [],
    [myJoinRequestsQuery.data?.data],
  );
  const pendingRequests = useMemo(
    () => buildPendingRequestMap(joinRequests),
    [joinRequests],
  );
  const recruitmentRoles = recruitmentRolesQuery.data?.data ?? [];
  const pendingInvitationCount = invitations.filter(
    (invitation) => invitation.status === "PENDING",
  ).length;
  const pendingRequestCount = joinRequests.filter(
    (request) => request.status === "PENDING",
  ).length;

  useEffect(() => {
    if (
      initialGroupId &&
      activeGroupSummary?.id === initialGroupId &&
      storedActiveGroupId !== initialGroupId
    ) {
      setActiveGroupId(activeGroupSummary.id);
    }
  }, [
    activeGroupSummary,
    initialGroupId,
    setActiveGroupId,
    storedActiveGroupId,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const recruitingGroups = useMemo(() => {
    const groupsById = new Map<number, GroupSummaryDto>();
    discoverGroupsQuery.data?.pages.forEach((page) => {
      page.data.content.forEach((group) => groupsById.set(group.id, group));
    });
    return Array.from(groupsById.values());
  }, [discoverGroupsQuery.data?.pages]);

  useEffect(() => {
    if (activeSection !== "discover") return;

    const root = discoverListRef.current;
    const sentinel = discoverSentinelRef.current;
    if (!root || !sentinel || !hasNextPage || isFetchNextPageError) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry?.isIntersecting &&
          hasNextPage &&
          !isFetchNextPageError &&
          !isFetchingNextPage
        ) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: "240px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    activeSection,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    recruitingGroups.length,
  ]);

  function resetDiscoverSelection() {
    discoverListRef.current?.scrollTo({ top: 0 });
    setSelectedGroupId(null);
  }
  function updateDiscoverSearch(value: string) {
    resetDiscoverSelection();
    setSearch(value);
  }

  function updateStudentGpa(value: string) {
    resetDiscoverSelection();
    if (!value) {
      setStudentGpa("");
      return;
    }

    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue)) return;
    if (parsedValue < 0) {
      setStudentGpa("0");
      return;
    }
    if (parsedValue > 4) {
      setStudentGpa("4");
      return;
    }
    setStudentGpa(value);
  }

  function updateNeededRole(value: "" | GroupRecruitmentNeedDto["role"]) {
    resetDiscoverSelection();
    setNeededRole(value);
  }

  function clearDiscoverFilters() {
    resetDiscoverSelection();
    setSearch("");
    setDebouncedSearch("");
    setStudentGpa("");
    setNeededRole("");
  }

  const hasDiscoverFilters = Boolean(
    search.trim() || studentGpa || neededRole,
  );


  function confirmAcceptInvitation(invitation: InvitationDto) {
    setConfirmAction({
      confirmLabel: "Accept invitation",
      description: `Join ${invitation.groupName}?`,
      onConfirm: () => acceptInvitationMutation.mutateAsync(invitation.id),
      title: "Accept invitation",
    });
  }

  function confirmDeclineInvitation(invitation: InvitationDto) {
    setConfirmAction({
      confirmLabel: "Decline invitation",
      description: `Decline invitation from ${invitation.groupName}?`,
      onConfirm: () => declineInvitationMutation.mutateAsync(invitation.id),
      title: "Decline invitation",
      tone: "danger",
    });
  }

  async function requestJoin(group: GroupSummaryDto, message?: string) {
    await createJoinRequestMutation.mutateAsync({
      groupId: group.id,
      payload: { message },
    });
  }

  if (myGroupsQuery.isLoading) {
    return (
      <LoadingState
        description="Checking your current group membership."
        title="Loading groups"
      />
    );
  }

  if (myGroupsQuery.error) {
    return (
      <EmptyState
        className="border-red-200 bg-red-50"
        description={getErrorMessage(myGroupsQuery.error)}
        icon={<AlertTriangle size={22} />}
        title="Unable to load groups"
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-6">
      <div
        aria-label="Group sections"
        className="flex w-fit max-w-full snap-x snap-mandatory items-center gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-border bg-surface p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[480px]:w-full"
        role="tablist"
      >
        {(
          [
            {
              count: myGroups.length,
              icon: <LayoutDashboard size={16} />,
              id: "workspace",
              label: "My Groups",
            },
            {
              count: 0,
              icon: <Search size={16} />,
              id: "discover",
              label: "Discover Groups",
            },
            {
              count: pendingInvitationCount + pendingRequestCount,
              icon: <Inbox size={16} />,
              id: "invitations",
              label: "Invitations",
            },
          ] as const
        ).map((section) => (
          <button
            aria-selected={activeSection === section.id}
            className={cn(
              "inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-lg px-3 text-sm font-bold text-muted transition-[background,color,box-shadow]",
              activeSection === section.id
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-background/70 hover:text-foreground",
            )}
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              setSelectedGroupId(null);
            }}
            role="tab"
            type="button"
          >
            {section.icon}
            {section.label}
            {typeof section.count === "number" && section.count > 0 && (
              <Badge tone={section.id === "invitations" ? "warning" : "neutral"}>
                {section.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {activeSection === "workspace" &&
        (myGroups.length === 0 ? (
          <div className="grid gap-6">
            <PageHeader
              actions={
                <Button
                  icon={<Plus size={16} />}
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create group
                </Button>
              }
              description="Create a group or discover an active group to join."
              eyebrow="Student"
              title="My Group Workspace"
            />
            <EmptyState
              description="Create your own group or browse recruiting groups to send a join request."
              icon={<Users size={22} />}
              title="You do not have a group yet"
            />
          </div>
        ) : activeGroupQuery.isLoading ? (
          <LoadingState title="Loading group workspace" />
        ) : !activeGroup ? (
          <EmptyState
            className="border-red-200 bg-red-50"
            description="Your group summary loaded, but the detail endpoint did not return a group."
            icon={<AlertTriangle size={22} />}
            title="Group detail unavailable"
          />
        ) : (
          <ActiveGroupWorkspace
            group={activeGroup}
            key={activeGroup.id}
            sessionEmail={sessionEmail}
          />
        ))}

      {activeSection === "discover" && (
        <div className="grid gap-6">
          <PageHeader
            actions={
              <Button
                icon={<Plus size={16} />}
                onClick={() => setIsCreateOpen(true)}
              >
                Create group
              </Button>
            }
            description="Find an active group that fits your project goals or create another workspace."
            eyebrow="Student"
            title="Discover Groups"
          />

          <Card className="grid min-h-[640px] grid-cols-[minmax(320px,2fr)_minmax(0,3fr)] overflow-hidden max-[1080px]:grid-cols-1">
            {/* ===== LEFT PANEL: Scrollable group list ===== */}
            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] border-r border-border max-[1080px]:max-h-[460px] max-[1080px]:border-r-0 max-[1080px]:border-b">
              {/* Filters */}
              <div className="border-b border-border p-4">
                <div className="grid gap-3 min-[640px]:grid-cols-3 min-[1081px]:grid-cols-1">
                  <TextInput
                    icon={<Search size={16} />}
                    label="Group name"
                    onChange={(event) =>
                      updateDiscoverSearch(event.target.value)
                    }
                    placeholder="Search by group name"
                    value={search}
                  />
                  <TextInput
                    hint="Max 4"
                    label="Your GPA"
                    max={4}
                    min={0}
                    onChange={(event) => updateStudentGpa(event.target.value)}
                    placeholder="3.0"
                    step="0.01"
                    type="number"
                    value={studentGpa}
                  />
                  <Select
                    disabled={recruitmentRolesQuery.isLoading}
                    label="Recruiting position"
                    onChange={(event) =>
                      updateNeededRole(
                        event.target.value as
                          | ""
                          | GroupRecruitmentNeedDto["role"],
                      )
                    }
                    value={neededRole}
                  >
                    <option value="">
                      {recruitmentRolesQuery.isLoading
                        ? "Loading positions..."
                        : "All positions"}
                    </option>
                    {recruitmentRoles.map((role) => (
                      <option key={role.code} value={role.code}>
                        {role.displayNameEn || role.displayNameVi || role.code}
                      </option>
                    ))}
                  </Select>
                  {hasDiscoverFilters && (
                    <Button
                      className="justify-self-start"
                      icon={<RotateCcw size={15} />}
                      onClick={clearDiscoverFilters}
                      size="sm"
                      variant="secondary"
                    >
                      Clear filters
                    </Button>
                  )}
                  {recruitmentRolesQuery.isError && (
                    <p className="m-0 text-xs text-red-600 min-[640px]:col-span-full min-[1081px]:col-span-1">
                      Recruiting positions could not be loaded. Try refreshing
                      the page.
                    </p>
                  )}
                </div>
              </div>

              {/* Group list with scroll */}
              <div
                className="min-h-0 max-h-[calc(100vh-320px)] overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-[1080px]:max-h-[380px]"
                ref={discoverListRef}
              >
                {discoverGroupsQuery.isPending ? (
                  <LoadingState className="min-h-48" title="Loading groups" />
                ) : discoverGroupsQuery.isError &&
                  recruitingGroups.length === 0 ? (
                  <EmptyState
                    className="min-h-48 border-red-200 bg-red-50"
                    description={getErrorMessage(discoverGroupsQuery.error)}
                    icon={<AlertTriangle size={22} />}
                    title="Unable to load recruiting groups"
                  />
                ) : recruitingGroups.length === 0 ? (
                  <EmptyState
                    className="min-h-48"
                    description="Try changing or clearing the filters, or create your own group."
                    icon={<Users size={22} />}
                    title="No recruiting groups found"
                  />
                ) : (
                  <div className="grid gap-3">
                    {recruitingGroups.map((group) => (
                      <DiscoverGroupCard
                        active={selectedGroupId === group.id}
                        group={group}
                        key={group.id}
                        onClick={setSelectedGroupId}
                      />
                    ))}
                    <div
                      aria-hidden="true"
                      className="h-px w-full"
                      ref={discoverSentinelRef}
                    />
                    {isFetchingNextPage && (
                      <div
                        aria-live="polite"
                        className="inline-flex min-h-14 items-center justify-center gap-2 text-sm text-muted"
                      >
                        <LoaderCircle className="animate-spin" size={17} />
                        Loading more groups...
                      </div>
                    )}
                    {isFetchNextPageError && (
                      <div className="grid justify-items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                        <p className="m-0 text-sm text-red-700">
                          {getErrorMessage(discoverGroupsQuery.error)}
                        </p>
                        <Button
                          onClick={() => void fetchNextPage()}
                          size="sm"
                          variant="secondary"
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                    {!hasNextPage && !isFetchNextPageError && (
                      <p className="m-0 py-2 text-center text-xs text-muted">
                        You have reached the end of the list.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ===== RIGHT PANEL: Group detail (inline) ===== */}
            <div className="min-h-0 max-h-[calc(100vh-320px)] overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-[1080px]:max-h-none">
              <DiscoverGroupDetail
                groupId={selectedGroupId}
                onCancelRequest={(request) =>
                  cancelJoinRequestMutation.mutateAsync({
                    groupId: request.groupId,
                    requestId: request.id,
                  })
                }
                onRequestJoin={requestJoin}
                pendingRequest={
                  selectedGroupId
                    ? pendingRequests.get(selectedGroupId) ?? null
                    : null
                }
              />
            </div>
          </Card>
        </div>
      )}

      {activeSection === "invitations" && (
        <div className="grid gap-6">
          <PageHeader
            description="Review invitations and track requests you have sent to other groups."
            eyebrow="Student"
            title="Invitations & Requests"
          />
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)] gap-6 max-[1080px]:grid-cols-1">
            <InvitationList
              emptyDescription="Invitations from group leaders will appear here."
              invitations={invitations}
              mode="received"
              onAccept={confirmAcceptInvitation}
              onDecline={confirmDeclineInvitation}
              title="Invitations"
            />
            <MyJoinRequestsSection />
          </div>
        </div>
      )}

      {isCreateOpen && (
        <GroupFormModal
          mode="create"
          onClose={() => setIsCreateOpen(false)}
          onSubmit={async (payload) => {
            const response = await createGroupMutation.mutateAsync(payload);
            setActiveGroupId(response.data.id);
            setActiveSection("workspace");
          }}
        />
      )}

      {selectedGroupId && activeSection !== "discover" && (
        <GroupDetailModal
          groupId={selectedGroupId}
          onCancelRequest={(request) =>
            cancelJoinRequestMutation.mutateAsync({
              groupId: request.groupId,
              requestId: request.id,
            })
          }
          onClose={() => setSelectedGroupId(null)}
          onRequestJoin={requestJoin}
          pendingRequest={pendingRequests.get(selectedGroupId) ?? null}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          confirmLabel={confirmAction.confirmLabel}
          description={confirmAction.description}
          onClose={() => setConfirmAction(null)}
          onConfirm={confirmAction.onConfirm}
          title={confirmAction.title}
          tone={confirmAction.tone}
        />
      )}
    </div>
  );
}

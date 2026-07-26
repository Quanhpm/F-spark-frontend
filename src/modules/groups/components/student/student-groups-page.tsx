"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Inbox,
  LayoutDashboard,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/modules/auth";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  TextInput,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";

import {
  useAcceptInvitation,
  useCancelJoinRequest,
  useCreateGroup,
  useCreateJoinRequest,
  useDeclineInvitation,
  useGroup,
  useGroups,
  useMyGroups,
  useMyInvitations,
  useMyJoinRequests,
} from "../../hooks";
import type {
  GroupJoinRequestDto,
  GroupSummaryDto,
  InvitationDto,
} from "../../types";
import { ActiveGroupWorkspace } from "./active-group-workspace";
import { ConfirmDialog } from "./confirm-dialog";
import { GroupCard } from "./group-card";
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

const DISCOVER_PAGE_SIZE = 8;

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
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
};

export function StudentGroupsPage({ initialGroupId }: StudentGroupsPageProps) {
  const router = useRouter();
  const sessionEmail = useAuthStore((state) => state.session?.user.email);
  const [activeSection, setActiveSection] =
    useState<GroupsSection>("workspace");
  const [search, setSearch] = useState("");
  const [discoverPage, setDiscoverPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const myGroupsQuery = useMyGroups();
  const myInvitationsQuery = useMyInvitations();
  const groupsQuery = useGroups({ search: optional(search) });
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
  const [activeGroupId, setActiveGroupId] = useState<number | null>(
    initialGroupId ?? null,
  );
  const effectiveGroupId = myGroups.some((group) => group.id === activeGroupId)
    ? activeGroupId
    : (myGroups[0]?.id ?? null);
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
  const myGroupIds = useMemo(
    () => new Set(myGroups.map((group) => group.id)),
    [myGroups],
  );
  const pendingInvitationCount = invitations.filter(
    (invitation) => invitation.status === "PENDING",
  ).length;
  const pendingRequestCount = joinRequests.filter(
    (request) => request.status === "PENDING",
  ).length;

  function selectActiveGroup(groupId: number) {
    setActiveGroupId(groupId);
    router.replace(`/student/groups?groupId=${groupId}`, { scroll: false });
  }

  const recruitingGroups = useMemo(() => {
    const groups = groupsQuery.data?.data ?? [];
    return groups.filter(
      (group) => group.status === "ACTIVE" && !myGroupIds.has(group.id),
    );
  }, [groupsQuery.data?.data, myGroupIds]);
  const discoverTotalPages = Math.max(
    1,
    Math.ceil(recruitingGroups.length / DISCOVER_PAGE_SIZE),
  );
  const effectiveDiscoverPage = Math.min(
    discoverPage,
    discoverTotalPages - 1,
  );
  const visibleRecruitingGroups = useMemo(() => {
    const start = effectiveDiscoverPage * DISCOVER_PAGE_SIZE;
    return recruitingGroups.slice(start, start + DISCOVER_PAGE_SIZE);
  }, [effectiveDiscoverPage, recruitingGroups]);

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

  function confirmCancelJoinRequest(request: GroupJoinRequestDto) {
    setConfirmAction({
      confirmLabel: "Cancel request",
      description: `Cancel your request to join ${request.groupName}?`,
      onConfirm: () =>
        cancelJoinRequestMutation.mutateAsync({
          groupId: request.groupId,
          requestId: request.id,
        }),
      title: "Cancel join request",
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
            onClick={() => setActiveSection(section.id)}
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
            groups={myGroups}
            key={activeGroup.id}
            onGroupChange={selectActiveGroup}
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

          <Card>
            <CardHeader
              description="Open a group to review its details and send a join request."
              title="Recruiting Groups"
            />
            <CardContent>
              <div className="grid gap-4">
                <TextInput
                  icon={<Search size={16} />}
                  label="Search groups"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setDiscoverPage(0);
                  }}
                  placeholder="Search by group name"
                  value={search}
                />

                {groupsQuery.isLoading ? (
                  <LoadingState className="min-h-48" title="Loading groups" />
                ) : groupsQuery.error ? (
                  <EmptyState
                    className="min-h-48 border-red-200 bg-red-50"
                    description={getErrorMessage(groupsQuery.error)}
                    icon={<AlertTriangle size={22} />}
                    title="Unable to load recruiting groups"
                  />
                ) : recruitingGroups.length === 0 ? (
                  <EmptyState
                    className="min-h-48"
                    description="Try a different search term or create your own group."
                    icon={<Users size={22} />}
                    title="No recruiting groups found"
                  />
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
                    {visibleRecruitingGroups.map((group) => (
                      <GroupCard
                        group={group}
                        key={group.id}
                        onCancelRequest={confirmCancelJoinRequest}
                        onRequestJoin={(selectedGroup) =>
                          setSelectedGroupId(selectedGroup.id)
                        }
                        onViewDetails={setSelectedGroupId}
                        pendingRequest={pendingRequests.get(group.id) ?? null}
                      />
                    ))}
                  </div>
                )}

                {recruitingGroups.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 max-[560px]:grid">
                    <span className="break-words text-xs font-medium text-muted">
                      Showing{" "}
                      {effectiveDiscoverPage * DISCOVER_PAGE_SIZE + 1}-
                      {Math.min(
                        (effectiveDiscoverPage + 1) * DISCOVER_PAGE_SIZE,
                        recruitingGroups.length,
                      )}{" "}
                      of {recruitingGroups.length} groups
                    </span>
                    <div className="flex items-center gap-2 max-[560px]:grid max-[560px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] max-[560px]:[&>button]:min-w-0">
                      <Button
                        disabled={effectiveDiscoverPage === 0}
                        onClick={() =>
                          setDiscoverPage(effectiveDiscoverPage - 1)
                        }
                        size="sm"
                        variant="secondary"
                      >
                        Previous
                      </Button>
                      <span className="min-w-20 text-center text-xs font-medium text-muted">
                        Page {effectiveDiscoverPage + 1} of {discoverTotalPages}
                      </span>
                      <Button
                        disabled={
                          effectiveDiscoverPage >= discoverTotalPages - 1
                        }
                        onClick={() =>
                          setDiscoverPage(effectiveDiscoverPage + 1)
                        }
                        size="sm"
                        variant="secondary"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
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
            selectActiveGroup(response.data.id);
            setActiveSection("workspace");
          }}
        />
      )}

      {selectedGroupId && (
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

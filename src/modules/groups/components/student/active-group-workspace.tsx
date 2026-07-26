"use client";

import { useState } from "react";
import { Lock, LogOut, Pencil, Unlock, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  PageHeader,
  Select,
} from "@/shared/components";

import {
  useCancelInvitation,
  useGroupInvitations,
  useLeaveGroup,
  useRemoveMember,
  useTransferLeadership,
  useUpdateGroup,
  useUpdateGroupLock,
} from "../../hooks";
import type {
  GroupDetailDto,
  GroupMemberDto,
  GroupSummaryDto,
} from "../../types";
import { ConfirmDialog } from "./confirm-dialog";
import { GroupFormModal } from "./group-form-modal";
import { InvitationList } from "./invitation-list";
import { JoinRequestSection } from "./join-request-section";
import { MeetingBookingSection } from "./meeting-booking-section";
import { MemberList } from "./member-list";
import { RecruitmentNeeds } from "../recruitment-needs";

type ConfirmAction = {
  confirmLabel: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  title: string;
  tone?: "default" | "danger";
};

type ActiveGroupWorkspaceProps = {
  group: GroupDetailDto;
  groups: GroupSummaryDto[];
  onGroupChange: (groupId: number) => void;
  sessionEmail?: string;
};

function formatNullable(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function isCurrentUserLeader(group: GroupDetailDto, email: string | undefined) {
  if (!email) return false;

  if (group.leader?.email === email) return true;

  return group.members.some(
    (member) => member.email === email && member.role === "LEADER",
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <dt className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
        {label}
      </dt>
      <dd className="m-0 mt-1 break-words text-sm leading-relaxed text-foreground">
        {formatNullable(value)}
      </dd>
    </div>
  );
}

export function ActiveGroupWorkspace({
  group,
  groups,
  onGroupChange,
  sessionEmail,
}: ActiveGroupWorkspaceProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateGroupMutation = useUpdateGroup();
  const cancelInvitationMutation = useCancelInvitation();
  const leaveGroupMutation = useLeaveGroup();
  const removeMemberMutation = useRemoveMember();
  const transferLeadershipMutation = useTransferLeadership();
  const updateGroupLockMutation = useUpdateGroupLock();
  const invitationsQuery = useGroupInvitations(group.id);

  const invitations = invitationsQuery.data?.data ?? [];
  const isLeader = isCurrentUserLeader(group, sessionEmail);

  function requestLeaveGroup() {
    setLocalError("");
    setSuccessMessage("");

    if (isLeader && group.members.length > 1) {
      setLocalError("Transfer leadership before leaving this group.");
      return;
    }

    setConfirmAction({
      confirmLabel: "Leave group",
      description: "Are you sure you want to leave this group?",
      onConfirm: () => leaveGroupMutation.mutateAsync(group.id),
      title: "Leave group",
      tone: "danger",
    });
  }

  function requestRemoveMember(member: GroupMemberDto) {
    setLocalError("");
    setSuccessMessage("");

    if (group.isLock) {
      setLocalError("Unlock group membership before removing members.");
      return;
    }

    setConfirmAction({
      confirmLabel: "Remove member",
      description: `Remove ${member.fullName} from this group?`,
      onConfirm: () =>
        removeMemberMutation.mutateAsync({
          groupId: group.id,
          studentId: member.studentId,
        }),
      title: "Remove member",
      tone: "danger",
    });
  }

  function requestTransferLeadership(member: GroupMemberDto) {
    setConfirmAction({
      confirmLabel: "Transfer leadership",
      description: `Make ${member.fullName} the new group leader?`,
      onConfirm: () =>
        transferLeadershipMutation.mutateAsync({
          groupId: group.id,
          payload: { studentId: member.studentId },
        }),
      title: "Transfer leadership",
    });
  }

  function requestToggleGroupLock() {
    const isLock = !group.isLock;

    setLocalError("");
    setSuccessMessage("");
    setConfirmAction({
      confirmLabel: isLock ? "Lock group" : "Unlock group",
      description: isLock
        ? "Lock membership? Students will no longer be able to join, and member changes will be disabled."
        : "Unlock membership so students can join and members can be managed again?",
      onConfirm: async () => {
        await updateGroupLockMutation.mutateAsync({
          groupId: group.id,
          payload: { isLock },
        });
        setSuccessMessage(
          isLock
            ? "Group membership is now locked."
            : "Group membership is now unlocked.",
        );
      },
      title: isLock ? "Lock group membership" : "Unlock group membership",
      tone: isLock ? "danger" : "default",
    });
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        actions={
          <div className="grid justify-items-end gap-3 max-[760px]:justify-items-stretch">
            <Select
              fieldClassName="w-full min-[761px]:w-[280px]"
              id="group-workspace-selector"
              label="Group workspace"
              onChange={(event) => onGroupChange(Number(event.target.value))}
              value={group.id}
            >
              {groups.map((groupOption) => (
                <option key={groupOption.id} value={groupOption.id}>
                  {groupOption.groupNo} - {groupOption.name} (
                  {groupOption.courseCode})
                </option>
              ))}
            </Select>

            <div className="flex flex-wrap justify-end gap-2 max-[760px]:justify-start max-[480px]:grid max-[480px]:[&>button]:w-full">
              {isLeader && (
                <>
                  <Button
                    icon={<Pencil size={16} />}
                    onClick={() => setIsEditOpen(true)}
                    variant="secondary"
                  >
                    Edit group
                  </Button>
                  <Button
                    icon={<UserPlus size={16} />}
                    disabled={group.isLock}
                    onClick={() =>
                      router.push(`/student/groups/invite?groupId=${group.id}`)
                    }
                  >
                    Invite member
                  </Button>
                  <Button
                    icon={group.isLock ? <Unlock size={16} /> : <Lock size={16} />}
                    onClick={requestToggleGroupLock}
                    variant={group.isLock ? "secondary" : "danger"}
                  >
                    {group.isLock ? "Unlock group" : "Lock group"}
                  </Button>
                </>
              )}
              <Button
                icon={<LogOut size={16} />}
                onClick={requestLeaveGroup}
                variant="danger"
              >
                Leave group
              </Button>
            </div>
          </div>
        }
        description="Manage your group profile, members, invitations, join requests, and mentor meetings."
        eyebrow="Student"
        title="My Group Workspace"
      />

      {localError && (
        <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {localError}
        </p>
      )}
      {successMessage && (
        <p className="m-0 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {successMessage}
        </p>
      )}

      <Card>
        <CardHeader
          actions={
            <div className="flex flex-wrap justify-end gap-2">
              <Badge tone={group.isLock ? "neutral" : "success"}>
                {group.isLock ? "Closed" : "Recruiting"}
              </Badge>
            </div>
          }
          description={`${group.term} - ${group.courseCode} - ${group.groupNo}`}
          title={group.name}
        />
        <CardContent>
          <div className="grid gap-5">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 max-[480px]:grid-cols-1">
              <InfoItem label="Project" value={group.projectName} />
              <InfoItem label="Research domain" value={group.researchDomain} />
              <InfoItem label="Required GPA" value={group.requiredGpa} />
              <InfoItem label="Target grade" value={group.targetGrade} />
              <InfoItem label="Leader" value={group.leader?.fullName} />
              <InfoItem label="Mentor" value={group.mentor?.fullName} />
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <h3 className="m-0 break-words text-sm font-bold text-foreground">
                Idea description
              </h3>
              <p className="m-0 mt-2 break-words text-sm leading-relaxed text-muted">
                {group.ideaDescription ?? "No idea description yet."}
              </p>
            </div>
            <RecruitmentNeeds needs={group.recruitmentNeeds} />
          </div>
        </CardContent>
      </Card>

      <MemberList
        group={group}
        isMembershipLocked={group.isLock}
        isLeader={isLeader}
        onRemoveMember={requestRemoveMember}
        onTransferLeadership={requestTransferLeadership}
      />

      {isLeader && (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] gap-6 max-[1080px]:grid-cols-1">
          <JoinRequestSection
            groupId={group.id}
            isMembershipLocked={group.isLock}
          />
          <InvitationList
            emptyDescription="No sent invitations for this group."
            invitations={invitations}
            mode="sent"
            onCancel={(invitation) =>
              setConfirmAction({
                confirmLabel: "Cancel invitation",
                description: `Cancel invitation for ${invitation.studentName}?`,
                onConfirm: () =>
                  cancelInvitationMutation.mutateAsync(invitation.id),
                title: "Cancel invitation",
              })
            }
            title="Sent Invitations"
          />
        </div>
      )}

      <MeetingBookingSection canBook={isLeader} group={group} />

      {isEditOpen && (
        <GroupFormModal
          group={group}
          mode="edit"
          onClose={() => setIsEditOpen(false)}
          onSubmit={(payload) =>
            updateGroupMutation.mutateAsync({ groupId: group.id, payload })
          }
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

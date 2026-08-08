"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  Users,
  XCircle,
} from "lucide-react";

import { MentorDashboardSection } from "@/modules/dashboards";
import { useCancelMeeting, useGroupMeetings, useConfirmMeeting } from "@/modules/mentoring";
import type { MentorMeetingDto } from "@/modules/mentoring";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { GroupStatus } from "@/shared/types";

import { useGroup, useMentorGroups } from "../../hooks";
import type { GroupDetailDto, GroupSummaryDto } from "../../types";
import { ConfirmDialog } from "../student/confirm-dialog";

const pageClassName = "grid min-w-0 gap-6";
const errorPanelClassName =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-normal text-red-700";
const detailGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 max-[480px]:grid-cols-1";
const labelClassName = "text-xs font-bold tracking-[0.04em] text-muted uppercase";
const valueClassName = "mt-1 break-words text-sm leading-[1.5] text-foreground";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatNullable(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getGroupStatusTone(status: GroupStatus) {
  return status === "ACTIVE" ? "success" : "neutral";
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface px-4 py-3">
      <div className={labelClassName}>{label}</div>
      <div className={valueClassName}>{formatNullable(value)}</div>
    </div>
  );
}

function MentorGroupDetail({ group }: { group: GroupDetailDto }) {
  const meetingsQuery = useGroupMeetings(group.id);
  const confirmMeetingMutation = useConfirmMeeting();
  const cancelMeetingMutation = useCancelMeeting();
  const meetings = meetingsQuery.data?.data ?? [];
  const [now, setNow] = useState(() => Date.now());
  const [meetingToCancel, setMeetingToCancel] =
    useState<MentorMeetingDto | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="grid gap-5">
      <div className={detailGridClassName}>
        <InfoItem label="Project" value={group.projectName} />
        <InfoItem label="Domain" value={group.researchDomain} />
        <InfoItem label="Required GPA" value={group.requiredGpa} />
        <InfoItem label="Target grade" value={group.targetGrade} />
      </div>

      {group.ideaDescription && (
        <div className="break-words rounded-xl border border-border bg-background px-4 py-3 text-sm leading-[1.55] text-foreground">
          {group.ideaDescription}
        </div>
      )}

      <div className="grid gap-3">
        <h3 className="m-0 text-sm font-bold text-foreground">Members</h3>
        {group.members.map((member) => (
          <div
            className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 max-[480px]:grid"
            key={member.studentId}
          >
            <div className="min-w-0">
              <div className="break-words font-bold text-foreground">
                {member.fullName}
              </div>
              <p className="mt-1 mb-0 break-all text-[13px] text-muted">
                {member.studentCode} - {member.email}
              </p>
            </div>
            <Badge tone={member.role === "LEADER" ? "brand" : "neutral"}>
              {member.role}
            </Badge>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        <h3 className="m-0 text-sm font-bold text-foreground">
          Upcoming meetings
        </h3>
        {successMessage && (
          <p className="m-0 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
            {successMessage}
          </p>
        )}
        {meetingsQuery.isLoading ? (
          <LoadingState title="Loading meetings" />
        ) : meetingsQuery.isError ? (
          <div className={errorPanelClassName}>
            {getErrorMessage(meetingsQuery.error)}
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState
            description="No meetings are scheduled for this group."
            title="No meetings"
          />
        ) : (
          <div className="grid gap-3">
            {meetings.map((meeting) => {
              const leaderConfirmed = meeting.leaderConfirmedAt !== null;
              const mentorConfirmed = meeting.mentorConfirmedAt !== null;
              const hasStarted = new Date(meeting.startAt).getTime() <= now;
              const canConfirm =
                meeting.status === "SCHEDULED" && hasStarted && !mentorConfirmed;
              const canCancel = meeting.status === "SCHEDULED";

              return (
                <div
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 max-[480px]:grid"
                  key={meeting.id}
                >
                  <div className="min-w-0">
                    <div className="break-words font-bold text-foreground">
                      {formatDateTime(meeting.startAt)}
                    </div>
                    <p className="mt-1 mb-2 break-words text-[13px] text-muted">
                      Booked by {meeting.bookedByStudentName}
                    </p>

                    {/* Confirmation Status */}
                    <div className="flex flex-col gap-1.5 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <span>Leader:</span>
                        <Badge
                          icon={
                            leaderConfirmed ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <Clock3 size={13} />
                            )
                          }
                          size="sm"
                          tone={leaderConfirmed ? "success" : "warning"}
                        >
                          {leaderConfirmed ? "Confirmed" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Mentor:</span>
                        <Badge
                          icon={
                            mentorConfirmed ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <Clock3 size={13} />
                            )
                          }
                          size="sm"
                          tone={mentorConfirmed ? "success" : "warning"}
                        >
                          {mentorConfirmed ? "Confirmed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 max-[480px]:grid max-[480px]:[&>button]:min-h-11 max-[480px]:[&>button]:w-full">
                    <Badge
                      tone={
                        meeting.status === "COMPLETED"
                          ? "success"
                          : meeting.status === "SCHEDULED"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {meeting.status}
                    </Badge>
                    <Button
                      icon={<CalendarClock size={15} />}
                      onClick={() => window.open(meeting.meetLink, "_blank")}
                      size="sm"
                      variant="secondary"
                    >
                      Meet
                    </Button>
                    {meeting.status === "SCHEDULED" && (
                      <Button
                        onClick={() =>
                          confirmMeetingMutation.mutate({
                            groupId: group.id,
                            meetingId: meeting.id,
                          })
                        }
                        disabled={!canConfirm || confirmMeetingMutation.isPending}
                        size="sm"
                      >
                        {confirmMeetingMutation.isPending
                          ? "Confirming..."
                          : mentorConfirmed
                            ? "Confirmed"
                            : "Confirm"}
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        disabled={cancelMeetingMutation.isPending}
                        icon={<XCircle size={15} />}
                        onClick={() => {
                          setSuccessMessage("");
                          setCancelReason("");
                          setMeetingToCancel(meeting);
                        }}
                        size="sm"
                        variant="danger"
                      >
                        Cancel meeting
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {meetingToCancel && (
        <ConfirmDialog
          confirmLabel="Cancel meeting"
          confirmDisabled={!cancelReason.trim()}
          description={`Cancel the meeting scheduled for ${formatDateTime(
            meetingToCancel.startAt,
          )}?`}
          onClose={() => {
            setCancelReason("");
            setMeetingToCancel(null);
          }}
          onConfirm={async () => {
            await cancelMeetingMutation.mutateAsync({
              groupId: group.id,
              meetingId: meetingToCancel.id,
              reason: cancelReason.trim(),
            });
            setSuccessMessage("Meeting canceled successfully.");
          }}
          title="Cancel mentor meeting"
          tone="danger"
        >
          <TextInput
            autoFocus
            id="mentor-meeting-cancel-reason"
            label="Cancellation reason"
            maxLength={500}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Enter a reason for canceling this meeting"
            required
            value={cancelReason}
          />
        </ConfirmDialog>
      )}
    </div>
  );
}

function MentorGroupDetailModal({
  groupId,
  onClose,
}: {
  groupId: number;
  onClose: () => void;
}) {
  const groupDetailQuery = useGroup(groupId);
  const group = groupDetailQuery.data?.data;

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[920px]"
      closeLabel="Close group details"
      description={
        group
          ? `${group.groupNo} · ${group.term} · ${group.courseCode}`
          : "Review group members, project context, and meetings."
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={group?.name ?? "Group details"}
    >
          {groupDetailQuery.isLoading ? (
            <LoadingState title="Loading group detail" />
          ) : groupDetailQuery.isError ? (
            <div className={errorPanelClassName}>
              {getErrorMessage(groupDetailQuery.error)}
            </div>
          ) : group ? (
            <MentorGroupDetail group={group} />
          ) : (
            <EmptyState
              description="The selected group could not be loaded."
              title="Group detail unavailable"
            />
          )}
    </ResponsiveDialog>
  );
}

function MentorGroupsTable({
  groups,
  onViewDetails,
}: {
  groups: GroupSummaryDto[];
  onViewDetails: (groupId: number, trigger: HTMLButtonElement) => void;
}) {
  return (
    <Card>
      <CardHeader
        actions={<Badge tone="neutral">{groups.length} groups</Badge>}
        description="Compare the groups you currently mentor and open a row for full details."
        title="Mentor hosted groups"
      />
      <CardContent className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="bg-background">
              <tr className="border-b border-border">
                <th
                  className="px-5 py-3 text-xs font-bold tracking-[0.04em] text-muted uppercase"
                  scope="col"
                >
                  Group
                </th>
                <th
                  className="px-5 py-3 text-xs font-bold tracking-[0.04em] text-muted uppercase"
                  scope="col"
                >
                  Term / course
                </th>
                <th
                  className="px-5 py-3 text-xs font-bold tracking-[0.04em] text-muted uppercase"
                  scope="col"
                >
                  Leader
                </th>
                <th
                  className="px-5 py-3 text-xs font-bold tracking-[0.04em] text-muted uppercase"
                  scope="col"
                >
                  Members
                </th>
                <th
                  className="px-5 py-3 text-xs font-bold tracking-[0.04em] text-muted uppercase"
                  scope="col"
                >
                  Project
                </th>
                <th
                  className="px-5 py-3 text-xs font-bold tracking-[0.04em] text-muted uppercase"
                  scope="col"
                >
                  Status
                </th>
                <th className="px-5 py-3" scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr
                  className="border-b border-border last:border-b-0"
                  key={group.id}
                >
                  <td className="px-5 py-4 align-top">
                    <div className="grid min-w-[140px] gap-1">
                      <strong className="break-words text-sm text-foreground">
                        {group.name}
                      </strong>
                      <span className="text-xs text-muted">
                        {group.groupNo}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="grid gap-1 text-sm text-foreground">
                      <span>{group.term}</span>
                      <span className="text-xs text-muted">
                        {group.courseCode}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-foreground">
                    {formatNullable(group.leaderName)}
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-foreground">
                    {group.memberCount}
                  </td>
                  <td className="max-w-[220px] px-5 py-4 align-top">
                    <div className="grid gap-1 text-sm text-foreground">
                      <span className="break-words">
                        {formatNullable(group.projectName)}
                      </span>
                      {group.selectedProblem && (
                        <span className="break-words text-xs text-muted">
                          {group.selectedProblem.code}: {group.selectedProblem.title}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <Badge tone={getGroupStatusTone(group.status)}>
                      {group.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <Button
                      icon={<Eye size={16} />}
                      onClick={(event) =>
                        onViewDetails(group.id, event.currentTarget)
                      }
                      size="sm"
                      variant="secondary"
                    >
                      View details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function MentorGroupsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mentorGroupsQuery = useMentorGroups();
  const groups = mentorGroupsQuery.data?.data ?? [];
  const closeGroupDetail = useCallback(() => {
    setSelectedGroupId(null);
    detailTriggerRef.current?.focus();
  }, []);

  return (
    <div className={pageClassName}>
      <PageHeader
        description="Review assigned groups, members, selected problems, and scheduled meetings."
        eyebrow="Mentor"
        title="My Groups"
      />

      <MentorDashboardSection />

      {mentorGroupsQuery.isLoading ? (
        <Card isPadded>
          <LoadingState title="Loading assigned groups" />
        </Card>
      ) : mentorGroupsQuery.isError ? (
        <Card isPadded>
          <div className={errorPanelClassName}>
            {getErrorMessage(mentorGroupsQuery.error)}
          </div>
        </Card>
      ) : groups.length === 0 ? (
        <Card isPadded>
          <EmptyState
            description="Assigned groups will appear here once the admin connects you with teams."
            icon={<Users size={22} />}
            title="No assigned groups"
          />
        </Card>
      ) : (
        <MentorGroupsTable
          groups={groups}
          onViewDetails={(groupId, trigger) => {
            detailTriggerRef.current = trigger;
            setSelectedGroupId(groupId);
          }}
        />
      )}

      {selectedGroupId && (
        <MentorGroupDetailModal
          groupId={selectedGroupId}
          onClose={closeGroupDetail}
        />
      )}
    </div>
  );
}

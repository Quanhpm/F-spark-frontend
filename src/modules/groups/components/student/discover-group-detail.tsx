"use client";

import { useState } from "react";
import { MousePointerClick, Send } from "lucide-react";

import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";

import { useGroup } from "../../hooks";
import type { GroupJoinRequestDto, GroupSummaryDto } from "../../types";
import { RecruitmentNeeds } from "../recruitment-needs";

type DiscoverGroupDetailProps = {
  groupId: number | null;
  onCancelRequest?: (request: GroupJoinRequestDto) => Promise<unknown>;
  onRequestJoin?: (group: GroupSummaryDto, message?: string) => Promise<unknown>;
  pendingRequest?: GroupJoinRequestDto | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatNullable(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
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

function GroupDetailContent({
  groupId,
  onCancelRequest,
  onRequestJoin,
  pendingRequest,
}: Required<Pick<DiscoverGroupDetailProps, "groupId">> &
  Omit<DiscoverGroupDetailProps, "groupId">) {
  const groupQuery = useGroup(groupId);
  const group = groupQuery.data?.data;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestJoin() {
    if (!group || !onRequestJoin || group.isLock || group.studentReadOnly)
      return;

    setError("");
    setIsSubmitting(true);

    try {
      await onRequestJoin(
        {
          courseCode: group.courseCode,
          groupNo: group.groupNo,
          id: group.id,
          instructorAccountId: group.instructorAccountId,
          instructorCode: group.instructorCode,
          instructorId: group.instructorId,
          instructorName: group.instructorName,
          isLock: group.isLock,
          leaderName: group.leader?.fullName ?? null,
          memberCount: group.members.length,
          mentorAccountId: group.mentorAccountId,
          mentorCode: group.mentor?.mentorCode ?? null,
          mentorId: group.mentor?.id ?? null,
          mentorName: group.mentor?.fullName ?? null,
          name: group.name,
          projectName: group.projectName,
          recruitmentNeeds: group.recruitmentNeeds,
          requiredGpa: group.requiredGpa,
          selectedProblem: group.selectedProblem,
          status: group.status,
          targetGrade: group.targetGrade,
          term: group.term,
          termStatus: group.termStatus,
          termClosedAt: group.termClosedAt,
          studentReadOnly: group.studentReadOnly,
        },
        message.trim() || undefined,
      );
      setMessage("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelRequest() {
    if (!pendingRequest || !onCancelRequest) return;

    setError("");
    setIsSubmitting(true);

    try {
      await onCancelRequest(pendingRequest);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (groupQuery.isLoading) {
    return <LoadingState className="min-h-48" title="Loading group details" />;
  }

  if (!group) {
    return (
      <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Group could not be loaded.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <h2 className="m-0 break-words text-xl font-bold text-foreground">
            {group.name}
          </h2>
          <p className="m-0 mt-1 break-words text-sm text-muted">
            {group.term} · {group.courseCode} · {group.groupNo}
          </p>
        </div>
        <Badge tone={group.isLock ? "neutral" : "success"}>
          {group.isLock ? "Closed" : "Recruiting"}
        </Badge>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 max-[480px]:grid-cols-1">
        <InfoItem label="Term" value={group.term} />
        <InfoItem label="Course" value={group.courseCode} />
        <InfoItem label="Group No" value={group.groupNo} />
        <InfoItem label="Members" value={group.members.length} />
        <InfoItem label="Leader" value={group.leader?.fullName} />
        <InfoItem
          label="Instructor"
          value={
            group.instructorName
              ? `${group.instructorName}${group.instructorCode ? ` (${group.instructorCode})` : ""}`
              : "Not assigned"
          }
        />
        <InfoItem label="Mentor" value={group.mentor?.fullName} />
        <InfoItem label="Required GPA" value={group.requiredGpa} />
        <InfoItem label="Target grade" value={group.targetGrade} />
      </div>

      <section className="grid gap-3 rounded-xl border border-border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-base font-bold text-foreground">Project</h3>
        </div>
        <p className="m-0 break-words text-sm leading-relaxed text-muted">
          {group.projectName ?? "No project name yet."}
        </p>
        <p className="m-0 break-words text-sm leading-relaxed text-muted">
          {group.ideaDescription ?? "No idea description yet."}
        </p>
        {group.researchDomain && (
          <span className="break-words text-sm text-muted">
            Domain: {group.researchDomain}
          </span>
        )}
      </section>

      <RecruitmentNeeds needs={group.recruitmentNeeds} />

      {onRequestJoin && (
        <section className="grid gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="m-0 text-base font-bold text-foreground">
              Join request
            </h3>
            {pendingRequest && (
              <Badge tone="warning">{pendingRequest.status}</Badge>
            )}
          </div>
          {pendingRequest ? (
            <div className="flex flex-wrap items-center justify-between gap-3 max-[480px]:grid">
              <p className="m-0 break-words text-sm text-muted">
                Your request is pending. You can cancel it while it has not been
                reviewed.
              </p>
              {onCancelRequest && (
                <Button
                  className="max-[480px]:w-full"
                  disabled={isSubmitting}
                  onClick={cancelRequest}
                  variant="secondary"
                >
                  Cancel request
                </Button>
              )}
            </div>
          ) : group.isLock ? (
            <p className="m-0 break-words text-sm leading-relaxed text-muted">
              This group has locked membership and is not accepting join
              requests.
            </p>
          ) : (
            <>
              <textarea
                className={cn(
                  "min-h-24 min-w-0 resize-y rounded-xl border border-border bg-surface px-3.5 py-3 font-sans text-base text-foreground outline-0 transition-[border-color,box-shadow] duration-[160ms] min-[761px]:text-sm",
                  "focus:border-brand-secondary focus:shadow-[0_0_0_4px_rgba(237,161,47,0.12)]",
                )}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Optional message to the leader."
                value={message}
              />
              <div className="flex justify-end max-[480px]:grid max-[480px]:[&>button]:w-full">
                <Button
                  disabled={isSubmitting}
                  icon={<Send size={16} />}
                  onClick={requestJoin}
                >
                  {isSubmitting ? "Sending..." : "Request to join"}
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      {error && (
        <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function DiscoverGroupDetail({
  groupId,
  onCancelRequest,
  onRequestJoin,
  pendingRequest,
}: DiscoverGroupDetailProps) {
  if (groupId === null) {
    return (
      <div className="grid h-full min-h-[400px] place-items-center">
        <EmptyState
          className="border-0 bg-transparent shadow-none"
          description="Click on a group from the list to view its full details and send a join request."
          icon={<MousePointerClick size={22} />}
          title="Select a group"
        />
      </div>
    );
  }

  return (
    <GroupDetailContent
      groupId={groupId}
      key={groupId}
      onCancelRequest={onCancelRequest}
      onRequestJoin={onRequestJoin}
      pendingRequest={pendingRequest}
    />
  );
}

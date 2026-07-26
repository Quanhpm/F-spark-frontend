"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Check, ClipboardList, Send, X } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { JoinRequestStatus } from "@/shared/types";

import {
  useApproveJoinRequest,
  useCancelJoinRequest,
  useGroupJoinRequests,
  useMyJoinRequests,
  useRejectJoinRequest,
} from "../../hooks";
import type { GroupJoinRequestDto } from "../../types";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function getJoinRequestTone(status: JoinRequestStatus) {
  if (status === "ACCEPTED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "REJECTED" || status === "CANCELED") return "danger" as const;
  return "neutral" as const;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function RequestCard({
  actions,
  request,
}: {
  actions?: ReactNode;
  request: GroupJoinRequestDto;
}) {
  return (
    <article className="grid gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h3 className="m-0 break-words text-sm font-bold text-foreground">
            {request.studentName} - {request.studentCode}
          </h3>
          <p className="m-0 break-words text-xs text-muted">
            {request.groupName} - {request.courseCode}
          </p>
        </div>
        <Badge tone={getJoinRequestTone(request.status)}>
          {request.status}
        </Badge>
      </div>
      <p className="m-0 break-words text-sm leading-relaxed text-muted">
        {request.message ?? "No message"}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2 max-[480px]:grid">
        <span className="break-words text-xs text-muted">
          Sent {formatDateTime(request.createdAt)}
        </span>
        {actions}
      </div>
    </article>
  );
}

export function JoinRequestSection({
  groupId,
  isMembershipLocked = false,
}: {
  groupId: number;
  isMembershipLocked?: boolean;
}) {
  const requestsQuery = useGroupJoinRequests(groupId);
  const approveMutation = useApproveJoinRequest();
  const rejectMutation = useRejectJoinRequest();
  const [error, setError] = useState("");
  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  const requests = requestsQuery.data?.data ?? [];
  const pendingRequests = requests.filter((request) => request.status === "PENDING");

  async function runAction(action: () => Promise<unknown>) {
    setError("");

    try {
      await action();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    }
  }

  return (
    <Card>
      <CardHeader
        actions={
          pendingRequests.length > 0 ? (
            <Badge tone="warning">{pendingRequests.length} new</Badge>
          ) : undefined
        }
        description={
          isMembershipLocked
            ? "Membership is locked. Unlock the group before approving requests."
            : "Approve or reject students asking to join your group."
        }
        title="Join Requests"
      />
      <CardContent>
        {requestsQuery.isLoading ? (
          <LoadingState className="min-h-40" title="Loading join requests" />
        ) : error ? (
          <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : pendingRequests.length === 0 ? (
          <EmptyState
            className="min-h-40"
            icon={<ClipboardList size={22} />}
            title="No pending requests"
          />
        ) : (
          <div className="grid gap-3">
            {pendingRequests.map((request) => (
              <RequestCard
                actions={
                  <div className="flex flex-wrap gap-2 max-[480px]:grid max-[480px]:[&>button]:min-h-11 max-[480px]:[&>button]:w-full">
                    <Button
                      disabled={isMembershipLocked || isMutating}
                      icon={<Check size={16} />}
                      onClick={() =>
                        runAction(() =>
                          approveMutation.mutateAsync({
                            groupId,
                            requestId: request.id,
                          }),
                        )
                      }
                      size="sm"
                    >
                      Approve
                    </Button>
                    <Button
                      disabled={isMutating}
                      icon={<X size={16} />}
                      onClick={() =>
                        runAction(() =>
                          rejectMutation.mutateAsync({
                            groupId,
                            requestId: request.id,
                          }),
                        )
                      }
                      size="sm"
                      variant="secondary"
                    >
                      Reject
                    </Button>
                  </div>
                }
                key={request.id}
                request={request}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MyJoinRequestsSection() {
  const requestsQuery = useMyJoinRequests();
  const cancelMutation = useCancelJoinRequest();
  const [error, setError] = useState("");

  const requests = requestsQuery.data?.data ?? [];

  async function cancelRequest(request: GroupJoinRequestDto) {
    setError("");

    try {
      await cancelMutation.mutateAsync({
        groupId: request.groupId,
        requestId: request.id,
      });
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    }
  }

  return (
    <Card>
      <CardHeader
        description="Track requests you have sent to other groups."
        title="My Join Requests"
      />
      <CardContent>
        {requestsQuery.isLoading ? (
          <LoadingState className="min-h-40" title="Loading requests" />
        ) : error ? (
          <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : requests.length === 0 ? (
          <EmptyState
            className="min-h-40"
            icon={<Send size={22} />}
            title="No join requests"
          />
        ) : (
          <div className="grid gap-3">
            {requests.map((request) => (
              <RequestCard
                actions={
                  request.status === "PENDING" ? (
                    <Button
                      className="max-[480px]:min-h-11 max-[480px]:w-full"
                      disabled={cancelMutation.isPending}
                      icon={<X size={16} />}
                      onClick={() => cancelRequest(request)}
                      size="sm"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  ) : undefined
                }
                key={request.id}
                request={request}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

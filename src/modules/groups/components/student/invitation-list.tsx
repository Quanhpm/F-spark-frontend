"use client";

import { Check, Mail, X } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
} from "@/shared/components";
import type { InvitationStatus } from "@/shared/types";

import type { InvitationDto } from "../../types";

type InvitationListProps = {
  emptyDescription?: string;
  invitations: InvitationDto[];
  mode: "received" | "sent";
  onAccept?: (invitation: InvitationDto) => void;
  onCancel?: (invitation: InvitationDto) => void;
  onDecline?: (invitation: InvitationDto) => void;
  title: string;
};

function getInvitationTone(status: InvitationStatus) {
  if (status === "ACCEPTED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "DECLINED" || status === "CANCELED") return "danger" as const;
  return "neutral" as const;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function InvitationList({
  emptyDescription = "No invitations to show.",
  invitations,
  mode,
  onAccept,
  onCancel,
  onDecline,
  title,
}: InvitationListProps) {
  return (
    <Card>
      <CardHeader
        actions={
          invitations.length > 0 ? (
            <Badge tone="neutral">{invitations.length} total</Badge>
          ) : undefined
        }
        description={
          mode === "received"
            ? "Review invitations from other groups."
            : "Track invitations sent by your group."
        }
        title={title}
      />
      <CardContent>
        {invitations.length === 0 ? (
          <EmptyState
            className="min-h-40"
            description={emptyDescription}
            icon={<Mail size={22} />}
            title="No invitations"
          />
        ) : (
          <div className="grid gap-3">
            {invitations.map((invitation) => (
              <article
                className="grid gap-3 rounded-xl border border-border bg-surface p-4"
                key={invitation.id}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="grid min-w-0 gap-1">
                    <h3 className="m-0 break-words text-sm font-bold text-foreground">
                      {mode === "received"
                        ? invitation.groupName
                        : invitation.studentName}
                    </h3>
                    <p className="m-0 break-words text-xs text-muted">
                      {invitation.term} - {invitation.courseCode} -{" "}
                      {mode === "received"
                        ? invitation.groupNo
                        : invitation.studentCode}
                    </p>
                  </div>
                  <Badge tone={getInvitationTone(invitation.status)}>
                    {invitation.status}
                  </Badge>
                </div>
                <p className="m-0 break-words text-sm leading-relaxed text-muted">
                  {invitation.message ?? "No message"}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 max-[480px]:grid">
                  <span className="break-words text-xs text-muted">
                    Sent {formatDateTime(invitation.createdAt)}
                  </span>
                  {invitation.status === "PENDING" && (
                    <div className="flex flex-wrap gap-2 max-[480px]:grid max-[480px]:[&>button]:min-h-11 max-[480px]:[&>button]:w-full">
                      {mode === "received" && onAccept && (
                        <Button
                          icon={<Check size={16} />}
                          onClick={() => onAccept(invitation)}
                          size="sm"
                        >
                          Accept
                        </Button>
                      )}
                      {mode === "received" && onDecline && (
                        <Button
                          icon={<X size={16} />}
                          onClick={() => onDecline(invitation)}
                          size="sm"
                          variant="secondary"
                        >
                          Decline
                        </Button>
                      )}
                      {mode === "sent" && onCancel && (
                        <Button
                          icon={<X size={16} />}
                          onClick={() => onCancel(invitation)}
                          size="sm"
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

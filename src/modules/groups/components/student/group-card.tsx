"use client";

import { Eye, Send, X } from "lucide-react";

import { Badge, Button, Card } from "@/shared/components";
import { cn } from "@/shared/lib";

import type { GroupJoinRequestDto, GroupSummaryDto } from "../../types";
import { RecruitmentNeeds } from "../recruitment-needs";

type GroupCardProps = {
  group: GroupSummaryDto;
  onCancelRequest?: (request: GroupJoinRequestDto) => void;
  onRequestJoin?: (group: GroupSummaryDto) => void;
  onViewDetails: (groupId: number) => void;
  pendingRequest?: GroupJoinRequestDto | null;
};

function formatNullable(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export function GroupCard({
  group,
  onCancelRequest,
  onRequestJoin,
  onViewDetails,
  pendingRequest,
}: GroupCardProps) {
  return (
    <Card className="relative grid gap-4 overflow-hidden p-5 transition-all duration-200 hover:shadow-card-interactive">
      <div
        aria-label={group.isLock ? "Closed" : "Recruiting"}
        className={cn(
          "pointer-events-none absolute top-[18px] right-[-34px] z-10 flex h-7 w-[128px] rotate-45 items-center justify-center text-[11px] font-bold text-white uppercase shadow-sm",
          group.isLock ? "bg-neutral-500" : "bg-brand-primary",
        )}
      >
        {group.isLock ? "Closed" : "Recruiting"}
      </div>

      <div className="flex min-w-0 items-start justify-between gap-3 pr-14">
        <div className="grid min-w-0 gap-1">
          <h3 className="m-0 break-words text-lg leading-snug font-bold text-foreground">
            {group.name}
          </h3>
          <p className="m-0 break-words text-sm text-muted">
            {group.term} - {group.courseCode} - {group.groupNo}
          </p>
        </div>
      </div>

      <dl className="grid gap-2 text-sm">
        <div className="flex min-w-0 justify-between gap-3">
          <dt className="text-muted">Members</dt>
          <dd className="m-0 font-medium text-foreground">
            {group.memberCount}/6
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Leader</dt>
          <dd className="m-0 min-w-0 break-words text-right font-medium text-foreground">
            {formatNullable(group.leaderName)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">GPA</dt>
          <dd className="m-0 font-medium text-foreground">
            {formatNullable(group.requiredGpa)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Target</dt>
          <dd className="m-0 font-medium text-foreground">
            {formatNullable(group.targetGrade)}
          </dd>
        </div>
      </dl>

      <RecruitmentNeeds needs={group.recruitmentNeeds} />

      <div className="flex flex-wrap items-center gap-2 max-[480px]:grid max-[480px]:[&>button]:w-full">
        <Button
          icon={<Eye size={16} />}
          onClick={() => onViewDetails(group.id)}
          variant="secondary"
        >
          View details
        </Button>
        {pendingRequest ? (
          <>
            <Badge className="max-w-full break-words" tone="warning">
              Request pending
            </Badge>
            {onCancelRequest && (
              <Button
                icon={<X size={16} />}
                onClick={() => onCancelRequest(pendingRequest)}
                variant="ghost"
              >
                Cancel
              </Button>
            )}
          </>
        ) : group.isLock ? (
          <p className="m-0 self-center text-sm text-muted">
            Membership is locked.
          </p>
        ) : (
          onRequestJoin && (
            <Button
              icon={<Send size={16} />}
              onClick={() => onRequestJoin(group)}
            >
              Request to join
            </Button>
          )
        )}
      </div>
    </Card>
  );
}

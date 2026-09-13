"use client";

import { Briefcase, UserCheck, Users } from "lucide-react";

import { Badge, Card } from "@/shared/components";
import { cn } from "@/shared/lib";

import { useRecruitmentRoles } from "../../hooks";
import type { GroupSummaryDto } from "../../types";

type DiscoverGroupCardProps = {
  active?: boolean;
  group: GroupSummaryDto;
  onClick: (groupId: number) => void;
};

function getTotalOpenings(group: GroupSummaryDto) {
  return group.recruitmentNeeds.reduce(
    (total, need) => total + need.quantity,
    0,
  );
}

export function DiscoverGroupCard({
  active = false,
  group,
  onClick,
}: DiscoverGroupCardProps) {
  const recruitmentRolesQuery = useRecruitmentRoles();
  const roles = recruitmentRolesQuery.data?.data ?? [];
  const rolesByCode = new Map(roles.map((role) => [role.code, role]));

  const totalOpenings = getTotalOpenings(group);
  const needs = group.recruitmentNeeds;
  const visibleNeeds = needs.slice(0, 4);
  const remainingCount = needs.length - visibleNeeds.length;

  return (
    <Card
      aria-pressed={active}
      className={cn(
        "relative cursor-pointer gap-3 overflow-hidden p-4 text-left transition-all duration-200 outline-none hover:shadow-card-interactive",
        active
          ? "border-brand-primary bg-brand-primary/[0.04] ring-2 ring-brand-primary/25 shadow-card-interactive"
          : "hover:border-border-warm",
      )}
      onClick={() => onClick(group.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(group.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div
        aria-label={group.isLock ? "Closed" : "Recruiting"}
        className={cn(
          "pointer-events-none absolute top-[14px] right-[-34px] z-10 flex h-6 w-[120px] rotate-45 items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm",
          group.isLock ? "bg-neutral-500" : "bg-brand-primary",
        )}
      >
        {group.isLock ? "Closed" : "Recruiting"}
      </div>

      <div className="grid min-w-0 gap-1 pr-12">
        <h3 className="m-0 truncate text-base leading-snug font-bold text-foreground">
          {group.name}
        </h3>
        <p className="m-0 truncate text-xs text-muted">
          {group.term} · {group.courseCode} · {group.groupNo}
        </p>
      </div>

      <dl className="m-0 grid gap-2 text-sm">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <dt className="inline-flex items-center gap-1.5 text-muted">
            <UserCheck className="size-3.5 shrink-0 text-muted" />
            <span>Leader</span>
          </dt>
          <dd className="m-0 min-w-0 truncate font-medium text-foreground">
            {group.leaderName ?? "-"}
          </dd>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2">
          <dt className="inline-flex items-center gap-1.5 text-muted">
            <Users className="size-3.5 shrink-0 text-muted" />
            <span>Members</span>
          </dt>
          <dd className="m-0 font-medium text-foreground">
            {group.memberCount}/6
          </dd>
        </div>
      </dl>

      <div className="grid gap-2 border-t border-border/70 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Briefcase className="size-3.5 text-muted" />
            <span>Recruiting Needs</span>
          </span>
          {totalOpenings > 0 ? (
            <Badge size="sm" tone="brand">
              {totalOpenings} openings
            </Badge>
          ) : (
            <span className="text-xs text-muted">-</span>
          )}
        </div>

        {needs.length === 0 ? (
          <p className="m-0 text-xs text-muted">Not recruiting right now</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleNeeds.map((need) => {
              const role = rolesByCode.get(need.role);
              const displayName =
                role?.displayNameEn || need.displayNameEn || role?.displayNameVi;

              return (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-brand-primary/40"
                  key={need.role}
                  title={`${displayName} (${need.quantity} openings)`}
                >
                  <span className="truncate max-w-[140px]">{displayName}</span>
                  <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-[10px] font-bold text-brand-primary">
                    {need.quantity}
                  </span>
                </span>
              );
            })}
            {remainingCount > 0 && (
              <span className="inline-flex items-center rounded-lg border border-dashed border-border px-2 py-1 text-xs font-medium text-muted">
                +{remainingCount} more
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

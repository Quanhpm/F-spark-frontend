import { Badge } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useRecruitmentRoles } from "../hooks";
import type { GroupRecruitmentNeedDto } from "../types";

type RecruitmentNeedsProps = {
  needs: GroupRecruitmentNeedDto[];
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load the recruitment role catalog.";
}

export function RecruitmentNeeds({ needs }: RecruitmentNeedsProps) {
  const recruitmentRolesQuery = useRecruitmentRoles();
  const roles = recruitmentRolesQuery.data?.data ?? [];
  const rolesByCode = new Map(roles.map((role) => [role.code, role]));

  return (
    <section className="grid gap-3 rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 break-words text-sm font-bold text-foreground">
          Recruitment needs
        </h3>
        {needs.length > 0 && (
          <Badge size="sm" tone="brand">
            {needs.reduce((total, need) => total + need.quantity, 0)} openings
          </Badge>
        )}
      </div>

      {recruitmentRolesQuery.isLoading ? (
        <p className="m-0 text-sm text-muted">Loading role catalog...</p>
      ) : recruitmentRolesQuery.isError ? (
        <p className="m-0 text-sm text-red-700" role="status">
          {getErrorMessage(recruitmentRolesQuery.error)}
        </p>
      ) : null}

      {needs.length === 0 ? (
        <p className="m-0 text-sm leading-relaxed text-muted">
          This group is not recruiting any roles right now.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {needs.map((need) => {
            const role = rolesByCode.get(need.role);
            const displayName =
              role?.displayNameVi || need.displayNameVi || role?.displayNameEn;

            return (
              <Badge
                className="max-w-full whitespace-normal break-words"
                key={need.role}
                tone="neutral"
              >
                {displayName} · {need.quantity}
              </Badge>
            );
          })}
        </div>
      )}
    </section>
  );
}

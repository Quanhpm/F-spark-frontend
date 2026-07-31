import { COLORS } from "@/shared/constants/colors";

import type { TvShowcaseRecruitmentPositionDto } from "../types";

type RecruitmentPositionChipProps = {
  position: TvShowcaseRecruitmentPositionDto;
};

export function RecruitmentPositionChip({
  position,
}: RecruitmentPositionChipProps) {
  return (
    <div
      className="flex min-w-0 items-center justify-between gap-4 rounded-xl border px-4 py-2.5"
      style={{
        backgroundColor: COLORS.surfaceWarm,
        borderColor: COLORS.brandSecondary,
      }}
    >
      <span
        className="truncate text-sm font-bold"
        style={{ color: COLORS.brandPrimary }}
      >
        {position.displayNameVi}
      </span>
      <strong
        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
        style={{
          backgroundColor: COLORS.brandSecondary,
          color: COLORS.foreground,
        }}
      >
        x{position.quantity}
      </strong>
    </div>
  );
}

import { cn } from "@/shared/lib";
import { COLORS } from "@/shared/constants/colors";

import type { RecruitmentDisplayItem } from "../types";
import { RecruitmentPositionChip } from "./recruitment-position-chip";

type RecruitmentCardProps = {
  active: boolean;
  item: RecruitmentDisplayItem;
  onClick: () => void;
};

export function RecruitmentCard({
  active,
  item,
  onClick,
}: RecruitmentCardProps) {
  const visiblePositions = item.positions.slice(0, 3);

  return (
    <button
      aria-label={`Xem chi tiết tuyển thành viên của ${item.projectName}`}
      className={cn(
        "grid min-h-[270px] w-full cursor-pointer content-between gap-4 rounded-2xl border border-l-4 border-border-warm border-l-brand-secondary bg-surface p-6 text-left shadow-card transition-[border-color,box-shadow] duration-200 outline-none min-[1440px]:min-h-[310px] min-[1440px]:p-8",
        active &&
          "border-brand-secondary shadow-card-interactive focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]",
      )}
      onClick={onClick}
      tabIndex={active ? 0 : -1}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="rounded-full px-3 py-1.5 text-xs font-bold"
          style={{
            backgroundColor: COLORS.brandPrimary,
            color: COLORS.surface,
          }}
        >
          {item.totalOpenings} vị trí đang mở
        </span>
        <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
          {item.courseCode}
        </span>
      </div>
      <div className="min-w-0">
        <p className="m-0 text-xs font-bold tracking-[0.08em] text-brand-primary uppercase">
          Bảng tin tuyển thành viên
        </p>
        <h3 className="mt-2 mb-0 line-clamp-2 break-words text-[clamp(22px,2vw,34px)] leading-[1.15] font-bold text-foreground">
          {item.projectName}
        </h3>
        <p className="mt-2 mb-0 truncate text-sm text-muted">
          {item.groupLabel} · Instructor {item.instructorName}
        </p>
      </div>
      <div className="grid gap-2">
        {visiblePositions.map((position) => (
          <RecruitmentPositionChip key={position.role} position={position} />
        ))}
        {item.positions.length > visiblePositions.length && (
          <p className="m-0 text-right text-xs text-muted">
            +{item.positions.length - visiblePositions.length} nhóm vị trí khác
          </p>
        )}
      </div>
    </button>
  );
}

import { GraduationCap, UserRound } from "lucide-react";

import { cn } from "@/shared/lib";

import type { ProjectDisplayItem } from "../types";
import { PersonSummary } from "./person-summary";

type ProjectCardProps = {
  active: boolean;
  item: ProjectDisplayItem;
  onClick: () => void;
};

export function ProjectCard({ active, item, onClick }: ProjectCardProps) {
  return (
    <button
      aria-label={`Xem chi tiết ${item.projectName}`}
      className={cn(
        "grid min-h-[270px] w-full cursor-pointer content-between gap-5 rounded-2xl border border-l-4 border-border border-l-brand-primary bg-surface p-6 text-left shadow-card transition-[border-color,box-shadow] duration-200 outline-none min-[1440px]:min-h-[310px] min-[1440px]:p-8",
        active &&
          "border-brand-secondary shadow-card-interactive focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]",
      )}
      onClick={onClick}
      tabIndex={active ? 0 : -1}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-surface-warm px-3 py-1.5 text-xs font-bold tracking-[0.04em] text-brand-primary uppercase">
          {item.groupLabel}
        </span>
        <span className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
          {item.courseCode}
        </span>
      </div>
      <div className="min-w-0">
        <p className="m-0 text-xs font-bold tracking-[0.08em] text-brand-primary uppercase">
          Dự án đang triển khai
        </p>
        <h3 className="mt-2 mb-0 line-clamp-2 break-words text-[clamp(22px,2vw,34px)] leading-[1.15] font-bold text-foreground">
          {item.projectName}
        </h3>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-3">
        <PersonSummary
          icon={<UserRound size={21} />}
          label="Leader"
          name={item.leaderName}
        />
        <PersonSummary
          className="border-l border-border pl-3"
          icon={<GraduationCap size={21} />}
          label="Instructor"
          name={item.instructorName}
        />
      </div>
      <div className="grid gap-2.5">
        <div className="flex items-end justify-between gap-4 text-sm text-muted">
          <span>
            {item.totalTasks > 0
              ? `${item.completedTasks}/${item.totalTasks} nhiệm vụ hoàn tất`
              : "Chưa có nhiệm vụ"}
          </span>
          <strong className="text-xl font-bold text-foreground">
            {item.progressPercent}%
          </strong>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-background">
          <span
            className="block h-full rounded-full bg-brand-secondary"
            style={{ width: `${item.progressPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
}

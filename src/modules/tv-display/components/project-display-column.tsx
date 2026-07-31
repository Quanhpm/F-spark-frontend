import { BriefcaseBusiness, Sparkles } from "lucide-react";

import { EmptyState } from "@/shared/components";

import type { ProjectDisplayItem } from "../types";
import { ProjectCard } from "./project-card";
import { VerticalCarousel } from "./vertical-carousel";

type ProjectDisplayColumnProps = {
  advanceSignal: number;
  cancelAnimationSignal: number;
  hasMoreItems: boolean;
  ignoreCancelAnimation: boolean;
  items: ProjectDisplayItem[];
  onActiveIndexChange: (activeIndex: number) => void;
  onApproachingEnd: (activeIndex: number) => void;
  onManualInteraction: () => void;
  onSelect: (item: ProjectDisplayItem) => void;
  paused: boolean;
  totalProjects: number;
};

export function ProjectDisplayColumn({
  advanceSignal,
  cancelAnimationSignal,
  hasMoreItems,
  ignoreCancelAnimation,
  items,
  onActiveIndexChange,
  onApproachingEnd,
  onManualInteraction,
  onSelect,
  paused,
  totalProjects,
}: ProjectDisplayColumnProps) {
  return (
    <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 px-6 pt-3 pb-0 min-[761px]:px-12 min-[761px]:pt-4 min-[1440px]:pt-5 max-[760px]:min-h-[620px]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-warm text-brand-primary">
          <BriefcaseBusiness size={21} />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.08em] text-brand-primary uppercase">
            Đang triển khai
          </p>
          <h2 className="m-0 mt-1 text-2xl font-bold text-foreground">
            Tiến độ dự án
          </h2>
        </div>
        <span className="ml-auto rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted">
          {totalProjects} dự án
        </span>
      </div>

      <VerticalCarousel
        advanceSignal={advanceSignal}
        cancelAnimationSignal={cancelAnimationSignal}
        emptyState={
          <EmptyState
            className="h-full border-0 bg-transparent shadow-none"
            icon={<Sparkles size={22} />}
            title="Chưa có dự án đang triển khai"
          />
        }
        hasMoreItems={hasMoreItems}
        ignoreCancelAnimation={ignoreCancelAnimation}
        items={items}
        label="Danh sách tiến độ dự án. Cuộn lên hoặc xuống để chuyển dự án."
        onActiveIndexChange={onActiveIndexChange}
        onApproachingEnd={onApproachingEnd}
        onManualInteraction={onManualInteraction}
        onSelect={onSelect}
        paused={paused}
        renderItem={(item, active, selectItem) => (
          <ProjectCard active={active} item={item} onClick={selectItem} />
        )}
      />
    </section>
  );
}

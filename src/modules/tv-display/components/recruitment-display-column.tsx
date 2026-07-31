import { Sparkles, UsersRound } from "lucide-react";

import { EmptyState } from "@/shared/components";

import type { RecruitmentDisplayItem } from "../types";
import { RecruitmentCard } from "./recruitment-card";
import { VerticalCarousel } from "./vertical-carousel";

type RecruitmentDisplayColumnProps = {
  advanceSignal: number;
  cancelAnimationSignal: number;
  hasMoreItems: boolean;
  ignoreCancelAnimation: boolean;
  items: RecruitmentDisplayItem[];
  onActiveIndexChange: (activeIndex: number) => void;
  onApproachingEnd: (activeIndex: number) => void;
  onManualInteraction: () => void;
  onSelect: (item: RecruitmentDisplayItem) => void;
  paused: boolean;
  totalRecruitments: number;
};

export function RecruitmentDisplayColumn({
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
  totalRecruitments,
}: RecruitmentDisplayColumnProps) {
  return (
    <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 border-l border-border-warm bg-surface-warm px-6 pt-3 pb-0 min-[761px]:px-12 min-[761px]:pt-4 min-[1440px]:pt-5 max-[760px]:min-h-[620px] max-[760px]:border-t max-[760px]:border-l-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-brand-primary">
          <UsersRound size={21} />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold tracking-[0.08em] text-brand-primary uppercase">
            Cơ hội tham gia
          </p>
          <h2 className="m-0 mt-1 text-2xl font-bold text-foreground">
            Tuyển thành viên
          </h2>
        </div>
        <span className="ml-auto rounded-full border border-border-warm bg-surface px-3 py-1.5 text-xs font-medium text-muted">
          {totalRecruitments} tin tuyển
        </span>
      </div>

      <VerticalCarousel
        advanceSignal={advanceSignal}
        cancelAnimationSignal={cancelAnimationSignal}
        emptyState={
          <EmptyState
            className="h-full border-0 bg-transparent shadow-none"
            icon={<Sparkles size={22} />}
            title="Chưa có thông báo tuyển thành viên"
          />
        }
        hasMoreItems={hasMoreItems}
        ignoreCancelAnimation={ignoreCancelAnimation}
        items={items}
        label="Danh sách tuyển thành viên. Cuộn lên hoặc xuống để chuyển dự án."
        onActiveIndexChange={onActiveIndexChange}
        onApproachingEnd={onApproachingEnd}
        onManualInteraction={onManualInteraction}
        onSelect={onSelect}
        paused={paused}
        renderItem={(item, active, selectItem) => (
          <RecruitmentCard active={active} item={item} onClick={selectItem} />
        )}
      />
    </section>
  );
}

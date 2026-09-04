"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState, LoadingState } from "@/shared/components";

import {
  useSynchronizedCarousels,
  useTvDisplay,
} from "../hooks";
import { GroupDetailDialog } from "./group-detail-dialog";
import { ProjectDisplayColumn } from "./project-display-column";
import { RecruitmentDisplayColumn } from "./recruitment-display-column";
import { TvDisplayHeader } from "./tv-display-header";

const PREFETCH_THRESHOLD = 5;

export function TvDisplayPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const displayQuery = useTvDisplay();
  const data = displayQuery.data;
  const projects = data?.projects ?? [];
  const recruitments = data?.recruitments ?? [];
  const {
    fetchNextPage: fetchNextProjectsPage,
    hasNextPage: hasNextProjectsPage,
    isFetchingNextPage: isFetchingNextProjectsPage,
  } = displayQuery.projectQuery;
  const {
    fetchNextPage: fetchNextRecruitmentsPage,
    hasNextPage: hasNextRecruitmentsPage,
    isFetchingNextPage: isFetchingNextRecruitmentsPage,
  } = displayQuery.recruitmentQuery;
  const carouselSync = useSynchronizedCarousels({
    dialogOpen: selectedGroupId !== null,
    hasNextProjectsPage: Boolean(hasNextProjectsPage),
    hasNextRecruitmentsPage: Boolean(hasNextRecruitmentsPage),
    projectCount: projects.length,
    recruitmentCount: recruitments.length,
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const selectedProgress = useMemo(
    () => data?.projects.find((item) => item.groupId === selectedGroupId),
    [data?.projects, selectedGroupId],
  );
  const handleProjectsApproachingEnd = useCallback(
    (activeIndex: number) => {
      const remainingProjects = projects.length - activeIndex - 1;
      if (
        remainingProjects > PREFETCH_THRESHOLD ||
        !hasNextProjectsPage ||
        isFetchingNextProjectsPage
      ) {
        return;
      }

      void fetchNextProjectsPage();
    },
    [
      fetchNextProjectsPage,
      hasNextProjectsPage,
      isFetchingNextProjectsPage,
      projects.length,
    ],
  );
  const handleRecruitmentsApproachingEnd = useCallback(
    (activeIndex: number) => {
      const remainingRecruitments = recruitments.length - activeIndex - 1;
      if (
        remainingRecruitments > PREFETCH_THRESHOLD ||
        !hasNextRecruitmentsPage ||
        isFetchingNextRecruitmentsPage
      ) {
        return;
      }

      void fetchNextRecruitmentsPage();
    },
    [
      fetchNextRecruitmentsPage,
      hasNextRecruitmentsPage,
      isFetchingNextRecruitmentsPage,
      recruitments.length,
    ],
  );

  if (displayQuery.isPending && !data) {
    return (
      <main className="fixed inset-0 z-40 grid place-items-center bg-background p-6">
        <LoadingState
          className="w-[min(520px,100%)]"
          description="Dữ liệu dự án đang được đồng bộ."
          title="Đang chuẩn bị bảng trình chiếu"
        />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="fixed inset-0 z-40 grid place-items-center bg-background p-6">
        <EmptyState
          className="w-[min(520px,100%)]"
          description="Hãy kiểm tra phiên đăng nhập ADMIN và kết nối mạng."
          title="Chưa thể tải dữ liệu trình chiếu"
        />
      </main>
    );
  }

  if (!data.activeTermCode) {
    return (
      <main className="fixed inset-0 z-40 grid place-items-center bg-background p-6">
        <EmptyState
          className="w-[min(520px,100%)]"
          description="TV Display sẽ tự hiển thị lại khi Admin mở học kỳ mới."
          title="Không có học kỳ đang hoạt động"
        />
      </main>
    );
  }

  return (
    <>
      <main className="fixed inset-0 z-40 grid min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background font-sans text-foreground max-[760px]:overflow-y-auto">
        <TvDisplayHeader activeTermCode={data.activeTermCode} />

        <div className="grid min-h-0 grid-cols-2 max-[760px]:grid-cols-1">
          <ProjectDisplayColumn
            advanceSignal={carouselSync.advanceSignal}
            cancelAnimationSignal={carouselSync.cancelAnimationSignal}
            hasMoreItems={Boolean(hasNextProjectsPage)}
            ignoreCancelAnimation={carouselSync.ignoreProjectCancel}
            items={projects}
            onActiveIndexChange={carouselSync.setProjectActiveIndex}
            onApproachingEnd={handleProjectsApproachingEnd}
            onManualInteraction={carouselSync.handleProjectManualInteraction}
            onSelect={(item) => setSelectedGroupId(item.groupId)}
            paused={carouselSync.carouselsPaused}
            totalProjects={data.totalProjects}
          />

          <RecruitmentDisplayColumn
            advanceSignal={carouselSync.advanceSignal}
            cancelAnimationSignal={carouselSync.cancelAnimationSignal}
            hasMoreItems={Boolean(hasNextRecruitmentsPage)}
            ignoreCancelAnimation={carouselSync.ignoreRecruitmentCancel}
            items={recruitments}
            onActiveIndexChange={carouselSync.setRecruitmentActiveIndex}
            onApproachingEnd={handleRecruitmentsApproachingEnd}
            onManualInteraction={
              carouselSync.handleRecruitmentManualInteraction
            }
            onSelect={(item) => setSelectedGroupId(item.groupId)}
            paused={carouselSync.carouselsPaused}
            totalRecruitments={data.totalRecruitments}
          />
        </div>
      </main>

      {selectedGroupId !== null && (
        <GroupDetailDialog
          groupId={selectedGroupId}
          onClose={() => setSelectedGroupId(null)}
          progress={selectedProgress}
        />
      )}
    </>
  );
}

import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  getTvShowcaseProjects,
  getTvShowcaseRecruitments,
} from "../api";
import type {
  ProjectDisplayItem,
  RecruitmentDisplayItem,
  TvDisplayData,
  TvShowcaseFilters,
  TvShowcaseProjectDto,
  TvShowcaseProjectPageDto,
  TvShowcaseRecruitmentDto,
  TvShowcaseRecruitmentPageDto,
} from "../types";

const TV_SHOWCASE_PAGE_SIZE = 20;

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeFilter(value?: string) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
}

function dedupeByGroupId<TItem extends { groupId: number }>(items: TItem[]) {
  const seenGroupIds = new Set<number>();

  return items.filter((item) => {
    if (seenGroupIds.has(item.groupId)) return false;
    seenGroupIds.add(item.groupId);
    return true;
  });
}

function buildProjects(items: TvShowcaseProjectDto[]) {
  return items.map(
    (item): ProjectDisplayItem => ({
      completedTasks: item.completedTasks,
      courseCode: item.courseCode,
      groupId: item.groupId,
      groupLabel: item.groupNo,
      groupName: item.groupName,
      id: `project-${item.groupId}`,
      inProgressTasks: item.inProgressTasks,
      instructorName: item.instructorName ?? "Chưa phân công",
      memberCount: item.memberCount,
      nextDueAt: item.nextDueAt,
      overdueTasks: item.overdueTasks,
      progressPercent: clampPercent(item.progressPercent),
      projectName: item.projectName,
      totalTasks: item.totalTasks,
    }),
  );
}

function buildRecruitments(items: TvShowcaseRecruitmentDto[]) {
  return items.map(
    (item): RecruitmentDisplayItem => ({
      courseCode: item.courseCode,
      groupId: item.groupId,
      groupLabel: item.groupNo,
      groupName: item.groupName,
      id: `recruitment-${item.groupId}`,
      instructorName: item.instructorName ?? "Chưa phân công",
      positions: item.positions,
      projectName: item.projectName,
      totalOpenings: item.totalOpenings,
    }),
  );
}

export function useTvDisplay(filters: TvShowcaseFilters = {}) {
  const term = normalizeFilter(filters.term);
  const courseCode = normalizeFilter(filters.courseCode);
  const filterKey = { courseCode, size: TV_SHOWCASE_PAGE_SIZE, term };
  const projectQueryKey = [
    "tv-display",
    "showcase",
    "projects",
    filterKey,
  ] as const;
  const recruitmentQueryKey = [
    "tv-display",
    "showcase",
    "recruitments",
    filterKey,
  ] as const;

  const projectQuery = useInfiniteQuery<
    TvShowcaseProjectPageDto,
    Error,
    InfiniteData<TvShowcaseProjectPageDto>,
    typeof projectQueryKey,
    number
  >({
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.number + 1 : undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getTvShowcaseProjects({
        courseCode,
        page: pageParam,
        size: TV_SHOWCASE_PAGE_SIZE,
        term,
      }),
    queryKey: projectQueryKey,
  });

  const recruitmentQuery = useInfiniteQuery<
    TvShowcaseRecruitmentPageDto,
    Error,
    InfiniteData<TvShowcaseRecruitmentPageDto>,
    typeof recruitmentQueryKey,
    number
  >({
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.number + 1 : undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getTvShowcaseRecruitments({
        courseCode,
        page: pageParam,
        size: TV_SHOWCASE_PAGE_SIZE,
        term,
      }),
    queryKey: recruitmentQueryKey,
  });

  const data = useMemo<TvDisplayData | undefined>(() => {
    if (!projectQuery.data || !recruitmentQuery.data) return undefined;

    const projectItems = dedupeByGroupId(
      projectQuery.data.pages.flatMap((page) => page.content),
    );
    const recruitmentItems = dedupeByGroupId(
      recruitmentQuery.data.pages.flatMap((page) => page.content),
    );
    const allPages = [
      ...projectQuery.data.pages,
      ...recruitmentQuery.data.pages,
    ];
    const refreshedAt = allPages.reduce((latest, page) => {
      const pageRefreshedAt = Date.parse(page.refreshedAt);
      return Number.isFinite(pageRefreshedAt)
        ? Math.max(latest, pageRefreshedAt)
        : latest;
    }, 0);

    return {
      projects: buildProjects(projectItems),
      recruitments: buildRecruitments(recruitmentItems),
      refreshedAt,
      totalProjects:
        projectQuery.data.pages[projectQuery.data.pages.length - 1]
          ?.totalElements ?? projectItems.length,
      totalRecruitments:
        recruitmentQuery.data.pages[recruitmentQuery.data.pages.length - 1]
          ?.totalElements ?? recruitmentItems.length,
    };
  }, [projectQuery.data, recruitmentQuery.data]);

  return {
    data,
    isError: projectQuery.isError || recruitmentQuery.isError,
    isPending: projectQuery.isPending || recruitmentQuery.isPending,
    projectQuery,
    recruitmentQuery,
  };
}

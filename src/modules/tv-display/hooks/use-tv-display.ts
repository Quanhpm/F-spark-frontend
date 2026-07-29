import { useQuery } from "@tanstack/react-query";

import {
  getAdminDashboardGroups,
  type AdminDashboardGroupProgressDto,
} from "@/modules/dashboards";
import { listGroups, type GroupSummaryDto } from "@/modules/groups";
import type { ISODateTimeString } from "@/shared/types";

import type {
  ProjectDisplayItem,
  RecruitmentDisplayItem,
  TvDisplayData,
} from "../types";

const REFRESH_INTERVAL_MS = 60_000;
const tvDisplayQueryKey = ["tv-display"] as const;

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function dateTimeValue(value: unknown): ISODateTimeString | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mergeProjectData(
  dashboardGroups: AdminDashboardGroupProgressDto[],
  groups: GroupSummaryDto[],
) {
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  return dashboardGroups
    .map((dashboardGroup): ProjectDisplayItem | null => {
      const groupId = numberValue(dashboardGroup.groupId ?? dashboardGroup.id);
      if (!groupId) return null;

      const group = groupsById.get(groupId);
      const status = group?.status ?? dashboardGroup.status;
      if (status !== "ACTIVE") return null;

      return {
        completedTasks: numberValue(
          dashboardGroup.completedTasks ?? dashboardGroup.completedTaskCount,
        ),
        courseCode: group?.courseCode ?? dashboardGroup.courseCode ?? "F-SPARK",
        groupId,
        groupLabel:
          group?.groupNo ?? dashboardGroup.groupNo ?? `Nhóm ${groupId}`,
        groupName:
          group?.name ?? dashboardGroup.groupName ?? `Nhóm ${groupId}`,
        id: `project-${groupId}`,
        inProgressTasks: numberValue(dashboardGroup.inProgressTasks),
        instructorName: group?.instructorName ?? "Chưa phân công",
        memberCount: group?.memberCount ?? numberValue(dashboardGroup.memberCount),
        nextDueAt: dateTimeValue(dashboardGroup.nextDueAt),
        overdueTasks: numberValue(
          dashboardGroup.overdueTasks ?? dashboardGroup.overdueTaskCount,
        ),
        progressPercent: clampPercent(
          numberValue(dashboardGroup.progressPercent),
        ),
        projectName:
          group?.projectName ??
          dashboardGroup.projectName ??
          group?.name ??
          dashboardGroup.groupName ??
          "Dự án chưa đặt tên",
        totalTasks: numberValue(
          dashboardGroup.totalTasks ?? dashboardGroup.totalTaskCount,
        ),
      };
    })
    .filter((item): item is ProjectDisplayItem => item !== null)
    .sort((first, second) =>
      first.projectName.localeCompare(second.projectName, "vi"),
    );
}

function buildRecruitmentData(groups: GroupSummaryDto[]) {
  return groups
    .filter(
      (group) =>
        group.status === "ACTIVE" &&
        group.recruitmentNeeds.some((need) => need.quantity > 0),
    )
    .map((group): RecruitmentDisplayItem => ({
      courseCode: group.courseCode,
      groupId: group.id,
      groupLabel: group.groupNo,
      groupName: group.name,
      id: `recruitment-${group.id}`,
      instructorName: group.instructorName ?? "Chưa phân công",
      positions: group.recruitmentNeeds.filter((need) => need.quantity > 0),
      projectName: group.projectName ?? group.name,
      totalOpenings: group.recruitmentNeeds.reduce(
        (total, need) => total + Math.max(0, need.quantity),
        0,
      ),
    }))
    .sort((first, second) => second.totalOpenings - first.totalOpenings);
}

export function useTvDisplay() {
  return useQuery({
    queryFn: async (): Promise<TvDisplayData> => {
      const [dashboardResponse, groupsResponse] = await Promise.all([
        getAdminDashboardGroups(),
        listGroups(),
      ]);

      return {
        projects: mergeProjectData(
          dashboardResponse.data,
          groupsResponse.data,
        ),
        recruitments: buildRecruitmentData(groupsResponse.data),
        refreshedAt: Date.now(),
      };
    },
    queryKey: tvDisplayQueryKey,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });
}

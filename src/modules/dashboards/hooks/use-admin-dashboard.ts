import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  getAdminDashboardOverview,
  getAdminDashboardExecutionStatus,
  getAdminDashboardGroups,
  getAdminDashboardMentors,
  getAdminDashboardProjects,
  getAdminDashboardTimeline,
} from "../api";
import type { AdminDashboardOverviewQuery } from "../types";

export function useAdminDashboardOverview(
  query: AdminDashboardOverviewQuery = {},
) {
  return useQuery({
    queryFn: () => getAdminDashboardOverview(query),
    queryKey: queryKeys.dashboard.admin.overview(query),
  });
}

export function useAdminDashboardTimeline() {
  return useQuery({
    queryFn: getAdminDashboardTimeline,
    queryKey: queryKeys.dashboard.admin.timeline(),
  });
}

export function useAdminDashboardProjects() {
  return useQuery({
    queryFn: getAdminDashboardProjects,
    queryKey: queryKeys.dashboard.admin.projects(),
  });
}

export function useAdminDashboardMentors() {
  return useQuery({
    queryFn: getAdminDashboardMentors,
    queryKey: queryKeys.dashboard.admin.mentors(),
  });
}

export function useAdminDashboardGroups() {
  return useQuery({
    queryFn: getAdminDashboardGroups,
    queryKey: queryKeys.dashboard.admin.groups(),
  });
}

export function useAdminDashboardExecutionStatus() {
  return useQuery({
    queryFn: getAdminDashboardExecutionStatus,
    queryKey: queryKeys.dashboard.admin.executionStatus(),
  });
}

export function useAdminDashboard() {
  const timelineQuery = useAdminDashboardTimeline();
  const projectsQuery = useAdminDashboardProjects();
  const mentorsQuery = useAdminDashboardMentors();
  const groupsQuery = useAdminDashboardGroups();
  const executionStatusQuery = useAdminDashboardExecutionStatus();

  return {
    executionStatusQuery,
    groupsQuery,
    mentorsQuery,
    projectsQuery,
    timelineQuery,
  };
}

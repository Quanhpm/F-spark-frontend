import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  getStudentDashboardGroups,
  getStudentDashboardProgress,
  getStudentDashboardProjects,
  getStudentMilestoneDashboard,
} from "../api";

export function useStudentDashboardGroups() {
  return useQuery({
    queryFn: getStudentDashboardGroups,
    queryKey: queryKeys.dashboard.studentGroups(),
  });
}

export function useStudentDashboardProjects() {
  return useQuery({
    queryFn: getStudentDashboardProjects,
    queryKey: queryKeys.dashboard.studentProjects(),
  });
}

export function useStudentDashboardProgress() {
  return useQuery({
    queryFn: getStudentDashboardProgress,
    queryKey: queryKeys.dashboard.studentProgress(),
  });
}

export function useStudentMilestoneDashboard(groupId: number | null | undefined) {
  return useQuery({
    enabled: typeof groupId === "number",
    queryFn: () => getStudentMilestoneDashboard(groupId!),
    queryKey: typeof groupId === "number" ? queryKeys.dashboard.studentMilestones(groupId) : ["dashboard", "student", "milestones", "empty"],
  });
}

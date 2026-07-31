import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import {
  exportGradesCsv,
  getGroupGradeMatrix,
  gradeGroup,
  updateContributions,
} from "../api";
import type {
  ExportGradesQuery,
  UpsertMilestoneContributionsRequest,
  UpsertMilestoneGroupGradeRequest,
} from "../types";

export function useGroupGradeMatrix(groupId: number | null | undefined) {
  return useQuery({
    enabled: typeof groupId === "number",
    queryFn: () => {
      if (typeof groupId !== "number") {
        throw new Error("Group ID is required.");
      }
      return getGroupGradeMatrix(groupId);
    },
    queryKey: typeof groupId === "number" ? queryKeys.grading.groupGradeMatrix(groupId) : ["grading", "groups", "empty"],
  });
}

export function useGradeGroup(milestoneId: number, groupId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertMilestoneGroupGradeRequest) =>
      gradeGroup(milestoneId, groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.grading.groupGradeMatrix(groupId),
      });
      // Invalidate instructor milestone dashboard as well
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.dashboard.all, "instructor", "milestones"],
      });
    },
  });
}

export function useUpdateContributions(groupId: number, milestoneId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertMilestoneContributionsRequest) =>
      updateContributions(groupId, milestoneId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.grading.groupGradeMatrix(groupId),
      });
    },
  });
}

export function useExportGradesCsv() {
  return useMutation({
    mutationFn: (query: ExportGradesQuery) => exportGradesCsv(query),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grades_export.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}

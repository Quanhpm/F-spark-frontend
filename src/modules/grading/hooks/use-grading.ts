import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import {
  exportGrades,
  getGradeModeration,
  getGroupGradeMatrix,
  gradeGroup,
  listArchivedGradeTerms,
  updateContributions,
  respondToContributions,
  saveGradeModeration,
  selectModeratedMilestone,
} from "../api";
import type {
  ExportGradesQuery,
  GradeModerationScope,
  GradeModerationSetting,
  UpsertMilestoneContributionsRequest,
  UpsertMilestoneGroupGradeRequest,
  UpsertContributionAgreementRequest,
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

export function useRespondToContributions(groupId: number, milestoneId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertContributionAgreementRequest) => respondToContributions(groupId, milestoneId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.grading.groupGradeMatrix(groupId) }),
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

export function useArchivedGradeTerms() {
  return useQuery({
    queryFn: listArchivedGradeTerms,
    queryKey: queryKeys.grading.archivedTerms(),
  });
}

export function useExportGrades() {
  return useMutation({
    mutationFn: (query: ExportGradesQuery) => exportGrades(query),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grades_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useGradeModeration(scope: GradeModerationScope, preview: GradeModerationSetting | null) {
  return useQuery({
    enabled: Boolean(scope.term),
    // Keeps the form in place while a preview loads.
    placeholderData: keepPreviousData,
    queryFn: () => getGradeModeration(scope, preview),
    queryKey: queryKeys.grading.moderation(scope.term, scope.courseCode, preview),
  });
}

function useInvalidateModeratedGrades() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.grading.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}

export function useSaveGradeModeration(scope: GradeModerationScope) {
  const invalidate = useInvalidateModeratedGrades();
  return useMutation({
    mutationFn: (payload: GradeModerationSetting) => saveGradeModeration(scope, payload),
    onSuccess: invalidate,
  });
}

export function useSelectModeratedMilestone(scope: GradeModerationScope) {
  const invalidate = useInvalidateModeratedGrades();
  return useMutation({
    mutationFn: (milestoneId: number) => selectModeratedMilestone(scope, milestoneId),
    onSuccess: invalidate,
  });
}

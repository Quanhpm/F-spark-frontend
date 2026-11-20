import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  assignFapClass,
  getMyFapClasses,
  importAttendanceScores,
  listFapEnrollments,
  listGradePolicies,
  listMyFapCourses,
  rebuildFapClasses,
  saveAttendanceScores,
  seedDefaultMilestones,
  updateGradePolicy,
} from "../api";
import type { AssignFapClassRequest, FapScope, SaveAttendanceScoresRequest } from "../types";

export function useMyFapCourses() {
  return useQuery({
    queryFn: listMyFapCourses,
    queryKey: queryKeys.attendance.myCourses(),
  });
}

export function useMyFapClasses(scope: FapScope | null) {
  return useQuery({
    enabled: Boolean(scope),
    queryFn: () => getMyFapClasses(scope as FapScope),
    queryKey: queryKeys.attendance.myClasses(scope ?? undefined),
  });
}

export function useSaveAttendanceScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveAttendanceScoresRequest) => saveAttendanceScores(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.grading.all });
    },
  });
}

export function useImportAttendanceScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, scope }: { file: File; scope: FapScope }) => importAttendanceScores(scope, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.grading.all });
    },
  });
}

export function useGradePolicies(term: string) {
  return useQuery({
    enabled: Boolean(term),
    queryFn: () => listGradePolicies(term),
    queryKey: queryKeys.attendance.policies(term),
  });
}

export function useUpdateGradePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseCode, term, weight }: { courseCode: string; term: string; weight: number }) =>
      updateGradePolicy(term, courseCode, weight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.grading.all });
    },
  });
}

export function useFapEnrollments(scope: FapScope | null, missing: boolean) {
  return useQuery({
    enabled: Boolean(scope),
    queryFn: () => listFapEnrollments(scope as FapScope, missing),
    queryKey: queryKeys.attendance.enrollments(scope ? { ...scope, missing } : undefined),
  });
}

export function useAssignFapClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, scope }: { payload: AssignFapClassRequest; scope: FapScope }) =>
      assignFapClass(scope, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });
}

export function useRebuildFapClasses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scope: FapScope) => rebuildFapClasses(scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });
}

export function useSeedDefaultMilestones() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (term: string) => seedDefaultMilestones(term),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.grading.all });
    },
  });
}

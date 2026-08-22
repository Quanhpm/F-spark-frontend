import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  archiveTermStudents,
  closeAcademicTerm,
  createAcademicTerm,
  listAcademicTerms,
  listAvailableAcademicTerms,
} from "../api";
import type { CreateAcademicTermRequest } from "../types";

export function useAcademicTerms() {
  return useQuery({
    queryFn: listAcademicTerms,
    queryKey: queryKeys.terms.list(),
  });
}

export function useAvailableAcademicTerms(enabled = true) {
  return useQuery({
    enabled,
    queryFn: listAvailableAcademicTerms,
    queryKey: queryKeys.terms.available(),
  });
}

export function useCreateAcademicTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAcademicTermRequest) =>
      createAcademicTerm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.terms.all });
    },
  });
}

export function useCloseAcademicTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeAcademicTerm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.terms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin.all });
    },
  });
}

export function useArchiveTermStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveTermStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.terms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.admin.all });
    },
  });
}

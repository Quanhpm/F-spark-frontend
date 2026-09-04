import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  downloadMentorImportTemplate,
  downloadProblemBankImportTemplate,
  downloadStudentAccountImportTemplate,
  downloadStudentImportTemplate,
  importMentors,
  importProblemBank,
  importStudentAccounts,
  importStudents,
} from "../api";
import type { ImportResponse } from "../types";
import type { ApiResponse } from "@/shared/types";

type ImportFileInput = Blob | File | FormData;

function useImportMutation(
  importer: (file: ImportFileInput) => Promise<ApiResponse<ImportResponse>>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importer,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.imports.all }),
  });
}

export function useImportStudents() {
  return useImportMutation(importStudents);
}

export function useImportStudentAccounts() {
  return useImportMutation(importStudentAccounts);
}

export function useImportMentors() {
  return useImportMutation(importMentors);
}

export function useImportProblemBank() {
  return useImportMutation(importProblemBank);
}

export function useDownloadStudentImportTemplate() {
  return useMutation({
    mutationFn: downloadStudentImportTemplate,
  });
}

export function useDownloadStudentAccountImportTemplate() {
  return useMutation({
    mutationFn: downloadStudentAccountImportTemplate,
  });
}

export function useDownloadMentorImportTemplate() {
  return useMutation({
    mutationFn: downloadMentorImportTemplate,
  });
}

export function useDownloadProblemBankImportTemplate() {
  return useMutation({
    mutationFn: downloadProblemBankImportTemplate,
  });
}

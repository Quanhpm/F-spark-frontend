import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  createBackupJob,
  downloadBackupJob,
  getBackupJob,
  getBackupSchedule,
  listBackupJobs,
  restoreBackup,
  updateBackupSchedule,
} from "../api";
import type {
  BackupJobsQuery,
  RestoreBackupInput,
  UpdateBackupScheduleRequest,
} from "../types";

export function useBackupJobs(query: BackupJobsQuery = {}, shouldPoll = false) {
  return useQuery({
    queryFn: () => listBackupJobs(query),
    queryKey: queryKeys.backups.list(query),
    refetchInterval: shouldPoll ? 3_000 : false,
  });
}

export function useBackupJob(jobId: number | null, shouldPoll = false) {
  return useQuery({
    enabled: Boolean(jobId),
    queryFn: () => getBackupJob(jobId as number),
    queryKey: jobId
      ? queryKeys.backups.detail(jobId)
      : [...queryKeys.backups.all, "detail", "none"],
    refetchInterval: shouldPoll ? 3_000 : false,
  });
}

export function useBackupSchedule() {
  return useQuery({
    queryFn: getBackupSchedule,
    queryKey: queryKeys.backups.schedule(),
  });
}

export function useCreateBackupJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBackupJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backups.all });
    },
  });
}

export function useUpdateBackupSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBackupScheduleRequest) =>
      updateBackupSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backups.all });
    },
  });
}

export function useDownloadBackupJob() {
  return useMutation({
    mutationFn: downloadBackupJob,
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RestoreBackupInput) => restoreBackup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backups.all });
    },
  });
}

import {
  apiDownload,
  apiGet,
  apiPost,
  apiPut,
  apiUpload,
} from "@/shared/lib";
import type { ApiResponse, PageResponse } from "@/shared/types";

import type {
  BackupJobDto,
  BackupJobsQuery,
  BackupScheduleSettingsDto,
  RestoreBackupInput,
  RestoreBackupResponseDto,
  UpdateBackupScheduleRequest,
} from "../types";

const BACKUPS_PATH = "/api/admin/backups";

export function createBackupJob() {
  return apiPost<ApiResponse<BackupJobDto>>(BACKUPS_PATH);
}

export function restoreBackup(payload: RestoreBackupInput) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("confirmation", payload.confirmation);

  return apiUpload<ApiResponse<RestoreBackupResponseDto>>(
    `${BACKUPS_PATH}/restore`,
    formData,
  );
}

export function listBackupJobs(query: BackupJobsQuery = {}) {
  return apiGet<ApiResponse<PageResponse<BackupJobDto>>>(BACKUPS_PATH, {
    query,
  });
}

export function getBackupJob(jobId: number) {
  return apiGet<ApiResponse<BackupJobDto>>(`${BACKUPS_PATH}/${jobId}`);
}

export function downloadBackupJob(jobId: number) {
  return apiDownload(`${BACKUPS_PATH}/${jobId}/download`);
}

export function getBackupSchedule() {
  return apiGet<ApiResponse<BackupScheduleSettingsDto>>(
    `${BACKUPS_PATH}/schedule`,
  );
}

export function updateBackupSchedule(payload: UpdateBackupScheduleRequest) {
  return apiPut<ApiResponse<BackupScheduleSettingsDto>>(
    `${BACKUPS_PATH}/schedule`,
    payload,
  );
}

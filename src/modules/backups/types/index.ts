import type {
  ISODateTimeString,
  PaginationQuery,
} from "@/shared/types";

export type BackupJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type BackupTriggerType = "MANUAL" | "SCHEDULED";

export type BackupJobDto = {
  id: number;
  triggerType: BackupTriggerType;
  status: BackupJobStatus;
  fileName: string | null;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  requestedByAccountId: number | null;
  requestedByEmail: string | null;
  startedAt: ISODateTimeString | null;
  finishedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
};

export type BackupScheduleSettingsDto = {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  backupDir: string;
  retentionDays: number;
  lastTriggeredAt: ISODateTimeString | null;
  nextRunAt: ISODateTimeString | null;
  updatedByAccountId: number | null;
  updatedByEmail: string | null;
  updatedAt: ISODateTimeString;
};

export type UpdateBackupScheduleRequest = {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  retentionDays: number;
};

export type RestoreBackupResponseDto = {
  fileName: string;
  fileSizeBytes: number;
  restoredAt: ISODateTimeString;
};

export type RestoreBackupInput = {
  confirmation: string;
  file: File;
};

export type BackupJobsQuery = PaginationQuery & {
  status?: BackupJobStatus | "";
};

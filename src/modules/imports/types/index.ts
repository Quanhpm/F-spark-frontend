import type {
  ImportBatchStatus,
  ImportErrorCode,
  ImportFileType,
  ImportTargetType,
  ISODateTimeString,
} from "@/shared/types";

export type ImportRowErrorDto = {
  rowNumber: number;
  fieldName: string | null;
  errorCode: ImportErrorCode;
  errorMessage: string;
};

export type ImportResponse = {
  batchId: number;
  targetType: ImportTargetType;
  status: ImportBatchStatus;
  fileName: string;
  fileType: ImportFileType;
  totalRows: number;
  successRows: number;
  failedRows: number;
  startedAt: ISODateTimeString;
  finishedAt: ISODateTimeString | null;
  createdGroups: number | null;
  skippedGroups: number | null;
  leaderFallbackWarnings: number | null;
  assignedMentors: number | null;
  mentorAssignmentWarnings: number | null;
};

export type ImportBatch = {
  id: number;
  targetType: ImportTargetType;
  fileName: string;
  fileType: ImportFileType;
  status: ImportBatchStatus;
  totalRows: number;
  successRows: number;
  failedRows: number;
  startedAt: ISODateTimeString;
  finishedAt: ISODateTimeString | null;
};

export type ImportUploadTarget =
  | "students"
  | "student-accounts"
  | "mentors"
  | "problem-bank";

export type ImportTemplateTarget = ImportUploadTarget;

export type ImportBatchErrorsQuery = {
  errorCode?: ImportErrorCode | "";
  fieldName?: string;
  page?: number;
  rowNumber?: number;
  search?: string;
  size?: number;
};

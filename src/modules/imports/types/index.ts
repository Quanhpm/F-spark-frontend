import type {
  ImportBatchStatus,
  ImportErrorCode,
  ImportFileType,
  ImportTargetType,
  ISODateTimeString,
} from "@/shared/types";

export type CreatedAccountDto = {
  email: string;
  code: string;
  temporaryPassword: string;
};

export type ImportRowErrorDto = {
  rowNumber: number;
  fieldName: string | null;
  errorCode: ImportErrorCode;
  errorMessage: string;
};

export type ImportResponse = {
  batchId: number;
  targetType: ImportTargetType;
  totalRows: number;
  successRows: number;
  failedRows: number;
  createdAccounts: CreatedAccountDto[];
  errors: ImportRowErrorDto[];
  createdGroups: number | null;
  skippedGroups: number | null;
  leaderFallbackWarnings: number | null;
  assignedMentors: number | null;
  mentorAssignmentWarnings: number | null;
  tempPasswords: Record<string, string>;
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

export type ImportUploadTarget = "students" | "mentors" | "problem-bank";

export type ImportTemplateTarget = "students" | "mentors" | "problem-bank";

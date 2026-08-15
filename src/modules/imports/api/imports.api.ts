import { apiDownload, apiGet, apiUpload } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";

import type {
  ImportBatch,
  ImportResponse,
  ImportRowErrorDto,
  ImportTemplateTarget,
  ImportUploadTarget,
} from "../types";

type ImportFileInput = Blob | File | FormData;

function createImportFormData(file: ImportFileInput) {
  if (file instanceof FormData) return file;

  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

function importFile(target: ImportUploadTarget, file: ImportFileInput) {
  return apiUpload<ApiResponse<ImportResponse>>(
    `/api/imports/${target}`,
    createImportFormData(file),
  );
}

export function importStudents(file: ImportFileInput) {
  return importFile("students", file);
}

export function importMentors(file: ImportFileInput) {
  return importFile("mentors", file);
}

export function importProblemBank(file: ImportFileInput) {
  return importFile("problem-bank", file);
}

export function getImportBatch(batchId: number) {
  return apiGet<ApiResponse<ImportBatch>>(`/api/imports/${batchId}`);
}

export function getImportBatchErrors(batchId: number) {
  return apiGet<ApiResponse<ImportRowErrorDto[]>>(
    `/api/imports/${batchId}/errors`,
  );
}

export function downloadImportTemplate(target: ImportTemplateTarget) {
  return apiDownload(`/api/imports/templates/${target}`);
}

export function downloadStudentImportTemplate() {
  return downloadImportTemplate("students");
}

export function downloadMentorImportTemplate() {
  return downloadImportTemplate("mentors");
}

export function downloadProblemBankImportTemplate() {
  return downloadImportTemplate("problem-bank");
}

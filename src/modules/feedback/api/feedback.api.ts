import { apiGet, apiPatch, apiPost, apiPut } from "@/shared/lib";
import type { ApiResponse, PageResponse } from "@/shared/types";

import type {
  AdminFeedbackQuery,
  AdminFeedbackResponseDto,
  AcademicTermResponseDto,
  CreateAcademicTermRequest,
  FeedbackReceivedSummaryDto,
  MyFeedbackQuery,
  ReceivedFeedbackQuery,
  SubmitFeedbackRequest,
  TermFeedbackDto,
} from "../types";

export function listMyFeedback(query: MyFeedbackQuery = {}) {
  return apiGet<ApiResponse<TermFeedbackDto[]>>("/api/feedback/me", {
    query,
  });
}

export function submitFeedback(
  feedbackId: number,
  payload: SubmitFeedbackRequest,
) {
  return apiPut<ApiResponse<TermFeedbackDto>>(
    `/api/feedback/${feedbackId}`,
    payload,
  );
}

export function getReceivedFeedback(query: ReceivedFeedbackQuery = {}) {
  return apiGet<ApiResponse<FeedbackReceivedSummaryDto>>(
    "/api/feedback/received",
    { query },
  );
}

export function listAdminFeedback(query: AdminFeedbackQuery = {}) {
  return apiGet<ApiResponse<PageResponse<AdminFeedbackResponseDto>>>(
    "/api/admin/feedback",
    { query },
  );
}

export function listAcademicTerms() {
  return apiGet<ApiResponse<AcademicTermResponseDto[]>>("/api/admin/terms");
}

export function createAcademicTerm(payload: CreateAcademicTermRequest) {
  return apiPost<ApiResponse<AcademicTermResponseDto>>(
    "/api/admin/terms",
    payload,
  );
}

export function listAvailableAcademicTerms() {
  return apiGet<ApiResponse<AcademicTermResponseDto[]>>(
    "/api/terms/available",
  );
}

export function closeAcademicTerm(term: string) {
  return apiPatch<ApiResponse<AcademicTermResponseDto>>(
    `/api/admin/terms/${encodeURIComponent(term)}/close`,
  );
}

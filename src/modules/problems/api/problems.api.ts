import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
} from "@/shared/lib";
import type { ApiResponse, EmptyApiResponse, EntityId, PageResponse } from "@/shared/types";
import type {
  CreateOfficialProblemRequest,
  CreateProblemDomainRequest,
  DomainsQuery,
  ProblemDetailDto,
  ProblemDomainDto,
  ProblemEvaluationCriteriaDto,
  ProblemSummaryDto,
  ProblemsQuery,
  ProposeProblemRequest,
  ReviewProblemRequest,
  SelectProblemRequest,
  UpdateProblemDomainRequest,
  UpdateProblemRequest,
  UpdateProblemStatusRequest,
} from "../types";

export function listProblems(query?: ProblemsQuery) {
  return apiGet<ApiResponse<PageResponse<ProblemSummaryDto>>>(
    "/api/problems",
    { query },
  );
}

export function getProblem(id: EntityId) {
  return apiGet<ApiResponse<ProblemDetailDto>>(`/api/problems/${id}`);
}

export function selectGroupProblem(groupId: EntityId, payload: SelectProblemRequest) {
  return apiPost<ApiResponse<unknown>>(
    `/api/groups/${groupId}/problems/select`,
    payload,
  );
}

export function clearGroupProblem(groupId: EntityId) {
  return apiDelete<EmptyApiResponse>(
    `/api/groups/${groupId}/problems/select`,
  );
}

export function proposeGroupProblem(groupId: EntityId, payload: ProposeProblemRequest) {
  return apiPost<ApiResponse<ProblemDetailDto>>(
    `/api/groups/${groupId}/problems/propose`,
    payload,
  );
}

export function getGroupProposals(groupId: EntityId) {
  return apiGet<ApiResponse<ProblemSummaryDto[]>>(
    `/api/groups/${groupId}/problems/proposals`,
  );
}

export function createOfficialProblem(payload: CreateOfficialProblemRequest) {
  return apiPost<ApiResponse<ProblemDetailDto>>(
    "/api/admin/problems",
    payload,
  );
}

export function updateProblem(id: EntityId, payload: UpdateProblemRequest) {
  return apiPatch<ApiResponse<ProblemDetailDto>>(
    `/api/admin/problems/${id}`,
    payload,
  );
}

export function updateProblemStatus(id: EntityId, payload: UpdateProblemStatusRequest) {
  return apiPatch<ApiResponse<ProblemDetailDto>>(
    `/api/admin/problems/${id}/status`,
    payload,
  );
}

export function reviewProblem(id: EntityId, payload: ReviewProblemRequest) {
  return apiPatch<ApiResponse<ProblemDetailDto>>(
    `/api/admin/problems/${id}/review`,
    payload,
  );
}

export function createProblemDomain(payload: CreateProblemDomainRequest) {
  return apiPost<ApiResponse<ProblemDomainDto>>(
    "/api/admin/problem-domains",
    payload,
  );
}

export function updateProblemDomain(id: EntityId, payload: UpdateProblemDomainRequest) {
  return apiPatch<ApiResponse<ProblemDomainDto>>(
    `/api/admin/problem-domains/${id}`,
    payload,
  );
}

export function listProblemDomains(query?: DomainsQuery) {
  return apiGet<ApiResponse<ProblemDomainDto[]>>(
    "/api/problem-domains",
    { query },
  );
}

export function listEvaluationCriteria() {
  return apiGet<ApiResponse<ProblemEvaluationCriteriaDto[]>>(
    "/api/problem-evaluation-criteria",
  );
}

export function importProblemBank(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<ApiResponse<{
    batchId: number;
    targetType: string;
    totalRows: number;
    successRows: number;
    failedRows: number;
  }>>(
    "/api/imports/problem-bank",
    formData,
  );
}

export function listInstructorPendingProblems() {
  return apiGet<ApiResponse<ProblemSummaryDto[]>>(
    "/api/instructor/problems/pending",
  );
}

export function reviewProblemAsInstructor(
  problemId: EntityId,
  payload: ReviewProblemRequest,
) {
  return apiPatch<ApiResponse<ProblemDetailDto>>(
    `/api/instructor/problems/${problemId}/review`,
    payload,
  );
}

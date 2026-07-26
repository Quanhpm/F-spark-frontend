import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/shared/lib";
import type { ApiResponse, EmptyApiResponse, EntityId } from "@/shared/types";

import type {
  AverageGradeDto,
  CourseMilestoneDto,
  CourseMilestonesQuery,
  CreateCourseMilestoneRequest,
  CreateMilestoneGradeRequest,
  CreateMilestoneSubmissionRequest,
  InstructorSubmissionsQuery,
  MilestoneGradeDto,
  MilestoneSubmissionDto,
  UpdateCourseMilestoneRequest,
  UpdateMilestoneGradeRequest,
  UpdateMilestoneSubmissionRequest,
} from "../types";

export function listCourseMilestones(query: CourseMilestonesQuery) {
  return apiGet<ApiResponse<CourseMilestoneDto[]>>(
    "/api/instructor/milestones",
    { query },
  );
}

export function createCourseMilestone(payload: CreateCourseMilestoneRequest) {
  return apiPost<ApiResponse<CourseMilestoneDto>>(
    "/api/instructor/milestones",
    payload,
  );
}

export function getCourseMilestone(milestoneId: EntityId) {
  return apiGet<ApiResponse<CourseMilestoneDto>>(
    `/api/instructor/milestones/${milestoneId}`,
  );
}

export function updateCourseMilestone(
  milestoneId: EntityId,
  payload: UpdateCourseMilestoneRequest,
) {
  return apiPut<ApiResponse<CourseMilestoneDto>>(
    `/api/instructor/milestones/${milestoneId}`,
    payload,
  );
}

export function patchCourseMilestone(
  milestoneId: EntityId,
  payload: UpdateCourseMilestoneRequest,
) {
  return apiPatch<ApiResponse<CourseMilestoneDto>>(
    `/api/instructor/milestones/${milestoneId}`,
    payload,
  );
}

export function deleteCourseMilestone(milestoneId: EntityId) {
  return apiDelete<EmptyApiResponse>(
    `/api/instructor/milestones/${milestoneId}`,
  );
}

export function listGroupMilestones(groupId: EntityId) {
  return apiGet<ApiResponse<CourseMilestoneDto[]>>(
    `/api/groups/${groupId}/milestones`,
  );
}

export function submitMilestone(payload: CreateMilestoneSubmissionRequest) {
  return apiPost<ApiResponse<MilestoneSubmissionDto>>(
    "/api/milestone-submissions",
    payload,
  );
}

export function getMilestoneSubmission(submissionId: EntityId) {
  return apiGet<ApiResponse<MilestoneSubmissionDto>>(
    `/api/milestone-submissions/${submissionId}`,
  );
}

export function updateMilestoneSubmission(
  submissionId: EntityId,
  payload: UpdateMilestoneSubmissionRequest,
) {
  return apiPut<ApiResponse<MilestoneSubmissionDto>>(
    `/api/milestone-submissions/${submissionId}`,
    payload,
  );
}

export function listSubmissionsByMilestone(milestoneId: EntityId) {
  return apiGet<ApiResponse<MilestoneSubmissionDto[]>>(
    `/api/milestone-submissions/milestones/${milestoneId}`,
  );
}

export function listSubmissionsByGroup(groupId: EntityId) {
  return apiGet<ApiResponse<MilestoneSubmissionDto[]>>(
    `/api/milestone-submissions/groups/${groupId}`,
  );
}

export function listInstructorSubmissions(
  query: InstructorSubmissionsQuery = {},
) {
  return apiGet<ApiResponse<MilestoneSubmissionDto[]>>(
    "/api/instructor/submissions",
    { query },
  );
}

export function getGradeBySubmission(submissionId: EntityId) {
  return apiGet<ApiResponse<MilestoneGradeDto>>(
    `/api/milestone-submissions/${submissionId}/grades`,
  );
}

export function gradeSubmission(
  submissionId: EntityId,
  payload: CreateMilestoneGradeRequest,
) {
  return apiPost<ApiResponse<MilestoneGradeDto>>(
    `/api/milestone-submissions/${submissionId}/grades`,
    payload,
  );
}

export function updateMilestoneGrade(
  gradeId: EntityId,
  payload: UpdateMilestoneGradeRequest,
) {
  return apiPut<ApiResponse<MilestoneGradeDto>>(
    `/api/milestone-submissions/grades/${gradeId}`,
    payload,
  );
}

export function listGradesByGroup(groupId: EntityId) {
  return apiGet<ApiResponse<MilestoneGradeDto[]>>(
    `/api/milestone-submissions/groups/${groupId}/grades`,
  );
}

export function getAverageGrade(groupId: EntityId) {
  return apiGet<ApiResponse<AverageGradeDto>>(
    `/api/student-groups/${groupId}/average-grade`,
  );
}

import { apiGet, apiPut, apiDownload } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";
import type {
  ExportGradesQuery,
  GroupGradeMatrixDto,
  MilestoneGroupGradeDto,
  MilestoneMemberScoreDto,
  UpsertMilestoneContributionsRequest,
  UpsertMilestoneGroupGradeRequest,
  UpsertContributionAgreementRequest,
  ContributionAgreementDto,
  GradeModerationOverviewDto,
  GradeModerationScope,
  GradeModerationSetting,
} from "../types";

export function gradeGroup(
  milestoneId: number,
  groupId: number,
  payload: UpsertMilestoneGroupGradeRequest,
) {
  return apiPut<ApiResponse<MilestoneGroupGradeDto>>(
    `/api/instructor/milestones/${milestoneId}/groups/${groupId}/grade`,
    payload,
  );
}

export function respondToContributions(groupId: number, milestoneId: number, payload: UpsertContributionAgreementRequest) {
  return apiPut<ApiResponse<ContributionAgreementDto>>(
    `/api/groups/${groupId}/milestones/${milestoneId}/contribution-agreement`,
    payload,
  );
}

export function updateContributions(
  groupId: number,
  milestoneId: number,
  payload: UpsertMilestoneContributionsRequest,
) {
  return apiPut<ApiResponse<MilestoneMemberScoreDto[]>>(
    `/api/groups/${groupId}/milestones/${milestoneId}/contributions`,
    payload,
  );
}

export function getGroupGradeMatrix(groupId: number) {
  return apiGet<ApiResponse<GroupGradeMatrixDto>>(
    `/api/groups/${groupId}/grades`,
  );
}

/** Closed terms whose groups were archived; filtering by one shows its grades, read-only. */
export function listArchivedGradeTerms() {
  return apiGet<ApiResponse<string[]>>("/api/instructor/grades/archived-terms");
}

/** Excel export: same columns as the CSV export, with column widths sized to the content. */
export function exportGrades(query: ExportGradesQuery) {
  return apiDownload(`/api/instructor/grades/export.xlsx`, { query });
}

/** Passing a preview returns the group scores it would give, without saving it. */
export function getGradeModeration(scope: GradeModerationScope, preview: GradeModerationSetting | null) {
  return apiGet<ApiResponse<GradeModerationOverviewDto>>("/api/admin/grade-moderations", {
    query: { ...scope, ...(preview ?? {}) },
  });
}

function moderationPath(scope: GradeModerationScope) {
  return `/api/admin/grade-moderations/${encodeURIComponent(scope.term)}/${encodeURIComponent(scope.courseCode)}`;
}

export function saveGradeModeration(scope: GradeModerationScope, payload: GradeModerationSetting) {
  return apiPut<ApiResponse<GradeModerationOverviewDto>>(moderationPath(scope), payload);
}

export function selectModeratedMilestone(scope: GradeModerationScope, milestoneId: number) {
  return apiPut<ApiResponse<GradeModerationOverviewDto>>(`${moderationPath(scope)}/milestone`, { milestoneId });
}

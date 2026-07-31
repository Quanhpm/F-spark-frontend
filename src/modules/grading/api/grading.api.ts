import { apiGet, apiPut, apiDownload } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";
import type {
  ExportGradesQuery,
  GroupGradeMatrixDto,
  MilestoneGroupGradeDto,
  MilestoneMemberScoreDto,
  UpsertMilestoneContributionsRequest,
  UpsertMilestoneGroupGradeRequest,
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

export function exportGradesCsv(query: ExportGradesQuery) {
  return apiDownload(`/api/instructor/grades/export.csv`, { query });
}

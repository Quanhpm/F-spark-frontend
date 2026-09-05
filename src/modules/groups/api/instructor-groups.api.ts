import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";

import type {
  AssignInstructorRequest,
  AssignMentorRequest,
  InstructorAssignedGroupDetailDto,
  InstructorGroupBoardItemDto,
  InstructorGroupBoardQuery,
  InstructorGroupBoardResponseDto,
  InstructorGroupsQuery,
  InstructorGroupSummaryDto,
} from "../types/instructor-groups.types";

export function listInstructorGroupBoard(query: InstructorGroupBoardQuery = {}) {
  return apiGet<ApiResponse<InstructorGroupBoardResponseDto>>(
    "/api/instructor/groups/board",
    { query },
  );
}

export function claimInstructorGroup(groupId: number) {
  return apiPost<ApiResponse<InstructorGroupBoardItemDto>>(
    `/api/instructor/groups/${groupId}/claim`,
  );
}

export function listInstructorGroups(query: InstructorGroupsQuery = {}) {
  return apiGet<ApiResponse<InstructorGroupSummaryDto[]>>(
    "/api/groups/instructor/me",
    { query },
  );
}

export function assignGroupInstructor(
  groupId: number,
  payload: AssignInstructorRequest,
) {
  return apiPatch<ApiResponse<InstructorAssignedGroupDetailDto>>(
    `/api/groups/${groupId}/instructor`,
    payload,
  );
}

export function assignGroupMentor(
  groupId: number,
  payload: AssignMentorRequest,
) {
  return apiPatch<ApiResponse<InstructorAssignedGroupDetailDto>>(
    `/api/groups/${groupId}/mentor`,
    payload,
  );
}

export function unassignGroupInstructor(groupId: number) {
  return apiDelete<ApiResponse<InstructorAssignedGroupDetailDto>>(
    `/api/groups/${groupId}/instructor`,
  );
}

export function unassignGroupMentor(groupId: number) {
  return apiDelete<ApiResponse<InstructorAssignedGroupDetailDto>>(
    `/api/groups/${groupId}/mentor`,
  );
}

import { apiGet, apiPatch } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";

import type {
  AssignInstructorRequest,
  InstructorAssignedGroupDetailDto,
  InstructorGroupsQuery,
  InstructorGroupSummaryDto,
} from "../types/instructor-groups.types";

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

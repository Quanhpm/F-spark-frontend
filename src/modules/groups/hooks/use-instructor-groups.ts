import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";

import { assignGroupInstructor, assignGroupMentor, listInstructorGroups } from "../api";
import type { GroupDetailDto, GroupSummaryDto } from "../types";
import type {
  AssignGroupInstructorVariables,
  AssignGroupMentorVariables,
  InstructorGroupsQuery,
} from "../types/instructor-groups.types";

export function useInstructorGroups(query: InstructorGroupsQuery = {}) {
  return useQuery({
    queryFn: () => listInstructorGroups(query),
    queryKey: queryKeys.groups.instructorMe(query),
  });
}

function patchGroupSummaryFromDetail(
  group: GroupSummaryDto,
  detail: GroupDetailDto,
): GroupSummaryDto {
  if (group.id !== detail.id) return group;

  return {
    ...group,
    instructorAccountId: detail.instructorAccountId,
    instructorCode: detail.instructorCode,
    instructorId: detail.instructorId,
    instructorName: detail.instructorName,
    mentorAccountId: detail.mentorAccountId,
    mentorCode: detail.mentor?.mentorCode ?? null,
    mentorId: detail.mentor?.id ?? null,
    mentorName: detail.mentor?.fullName ?? null,
  };
}

function updateCachedGroupLists(
  queryClient: ReturnType<typeof useQueryClient>,
  detail: GroupDetailDto,
) {
  queryClient.setQueriesData<ApiResponse<GroupSummaryDto[]>>(
    { queryKey: queryKeys.groups.lists() },
    (current) => {
      if (!current?.data) return current;

      return {
        ...current,
        data: current.data.map((group) =>
          patchGroupSummaryFromDetail(group, detail),
        ),
      };
    },
  );
  queryClient.setQueriesData<ApiResponse<GroupSummaryDto[]>>(
    { queryKey: [...queryKeys.groups.all, "instructor", "me"] },
    (current) => {
      if (!current?.data) return current;

      return {
        ...current,
        data: current.data.map((group) =>
          patchGroupSummaryFromDetail(group, detail),
        ),
      };
    },
  );
}

export function useAssignGroupInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, payload }: AssignGroupInstructorVariables) =>
      assignGroupInstructor(groupId, payload),
    onSuccess: (response, variables) => {
      updateCachedGroupLists(queryClient, response.data);
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.admin.all,
      });
    },
  });
}

export function useAssignGroupMentor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, payload }: AssignGroupMentorVariables) =>
      assignGroupMentor(groupId, payload),
    onSuccess: (response, variables) => {
      updateCachedGroupLists(queryClient, response.data);
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.admin.all,
      });
    },
  });
}

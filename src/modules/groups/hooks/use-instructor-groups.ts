import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { assignGroupInstructor, listInstructorGroups } from "../api";
import type {
  AssignGroupInstructorVariables,
  InstructorGroupsQuery,
} from "../types/instructor-groups.types";

export function useInstructorGroups(query: InstructorGroupsQuery = {}) {
  return useQuery({
    queryFn: () => listInstructorGroups(query),
    queryKey: queryKeys.groups.instructorMe(query),
  });
}

export function useAssignGroupInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, payload }: AssignGroupInstructorVariables) =>
      assignGroupInstructor(groupId, payload),
    onSuccess: (_response, variables) => {
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

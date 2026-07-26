import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { listRecruitmentRoles, updateGroupLock } from "../api";
import type { UpdateGroupLockRequest } from "../types";

type UpdateGroupLockVariables = {
  groupId: number;
  payload: UpdateGroupLockRequest;
};

export function useRecruitmentRoles() {
  return useQuery({
    queryFn: listRecruitmentRoles,
    queryKey: queryKeys.groups.recruitmentRoles(),
  });
}

export function useUpdateGroupLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, payload }: UpdateGroupLockVariables) =>
      updateGroupLock(groupId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId),
      });
    },
  });
}

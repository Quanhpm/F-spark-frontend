import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  createGroup,
  deleteAdminGroup,
  leaveGroup,
  removeMember,
  transferLeadership,
  updateGroup,
  updateGroupCriteria,
} from "../api";
import type {
  CreateGroupRequest,
  TransferLeaderRequest,
  UpdateGroupCriteriaRequest,
  UpdateGroupRequest,
} from "../types";

function invalidateGroupCollections(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGroupRequest) => createGroup(payload),
    onSuccess: () => invalidateGroupCollections(queryClient),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: number;
      payload: UpdateGroupRequest;
    }) => updateGroup(groupId, payload),
    onSuccess: (_response, variables) => {
      invalidateGroupCollections(queryClient);
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId),
      });
    },
  });
}

export function useUpdateGroupCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: number;
      payload: UpdateGroupCriteriaRequest;
    }) => updateGroupCriteria(groupId, payload),
    onSuccess: (_response, variables) => {
      invalidateGroupCollections(queryClient);
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId),
      });
    },
  });
}

export function useTransferLeadership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: number;
      payload: TransferLeaderRequest;
    }) => transferLeadership(groupId, payload),
    onSuccess: (_response, variables) => {
      invalidateGroupCollections(queryClient);
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      studentId,
    }: {
      groupId: number;
      studentId: number;
    }) => removeMember(groupId, studentId),
    onSuccess: (_response, variables) => {
      invalidateGroupCollections(queryClient);
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useDeleteAdminGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: number) => deleteAdminGroup(groupId),
    onSuccess: (_response, groupId) => {
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: number) => leaveGroup(groupId),
    onSuccess: () => invalidateGroupCollections(queryClient),
  });
}

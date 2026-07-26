import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { changeMyPassword, getMyProfile, updateMyProfile } from "../api";
import type {
  ChangeOwnPasswordRequest,
  UpdateSelfProfileRequest,
} from "../types";

export function useMyProfile() {
  return useQuery({
    queryFn: getMyProfile,
    queryKey: queryKeys.profile.me(),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSelfProfileRequest) => updateMyProfile(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.profile.me(), response);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useChangeMyPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeOwnPasswordRequest) =>
      changeMyPassword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

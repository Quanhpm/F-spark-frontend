import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { getFeatureHistory, getMyFeatures, listAdminFeatures, updateFeature } from "../api";
import type { FeatureKey, UpdateFeatureFlagRequest } from "../types";

/** Which optional features the signed-in user can use (admins always get every feature). */
export function useFeatureFlags() {
  return useQuery({
    queryFn: getMyFeatures,
    queryKey: queryKeys.features.mine(),
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });
}

/**
 * Whether a feature is available to the current user. While loading (or on error)
 * the feature is treated as unavailable so hidden features never flash on screen.
 */
export function useFeatureEnabled(key: FeatureKey) {
  const query = useFeatureFlags();
  return {
    enabled: query.data?.data?.[key] === true,
    isLoading: query.isLoading,
  };
}

export function useAdminFeatures() {
  return useQuery({
    queryFn: listAdminFeatures,
    queryKey: queryKeys.features.adminList(),
  });
}

export function useFeatureHistory(key: FeatureKey | null) {
  return useQuery({
    enabled: Boolean(key),
    queryFn: () => getFeatureHistory(key as FeatureKey),
    queryKey: queryKeys.features.history(key ?? "none"),
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, payload }: { key: FeatureKey; payload: UpdateFeatureFlagRequest }) =>
      updateFeature(key, payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.features.all });
    },
  });
}

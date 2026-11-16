import { apiGet, apiPatch } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";

import type {
  FeatureAvailability,
  FeatureFlagDto,
  FeatureFlagEventDto,
  FeatureKey,
  UpdateFeatureFlagRequest,
} from "../types";

export function getMyFeatures() {
  return apiGet<ApiResponse<FeatureAvailability>>("/api/features");
}

export function listAdminFeatures() {
  return apiGet<ApiResponse<FeatureFlagDto[]>>("/api/admin/features");
}

export function updateFeature(key: FeatureKey, payload: UpdateFeatureFlagRequest) {
  return apiPatch<ApiResponse<FeatureFlagDto>>(`/api/admin/features/${key}`, payload);
}

export function getFeatureHistory(key: FeatureKey) {
  return apiGet<ApiResponse<FeatureFlagEventDto[]>>(`/api/admin/features/${key}/history`);
}

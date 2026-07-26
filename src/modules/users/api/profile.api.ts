import { apiGet, apiPatch } from "@/shared/lib";
import type { ApiResponse, EmptyApiResponse } from "@/shared/types";

import type {
  ChangeOwnPasswordRequest,
  SelfProfileResponseDto,
  UpdateSelfProfileRequest,
} from "../types";

export function getMyProfile() {
  return apiGet<ApiResponse<SelfProfileResponseDto>>("/api/profile/me");
}

export function updateMyProfile(payload: UpdateSelfProfileRequest) {
  return apiPatch<ApiResponse<SelfProfileResponseDto>>(
    "/api/profile/me",
    payload,
  );
}

export function changeMyPassword(payload: ChangeOwnPasswordRequest) {
  return apiPatch<EmptyApiResponse>("/api/profile/me/password", payload);
}

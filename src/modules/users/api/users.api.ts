import {
  apiDelete,
  apiDownload,
  apiGet,
  apiPatch,
  apiPost,
} from "@/shared/lib";
import type { ApiResponse, EmptyApiResponse, PageResponse } from "@/shared/types";

import type {
  AdminUserDetailDto,
  AdminUsersQuery,
  AdminUserSummaryDto,
  ChangePasswordByEmailRequest,
  CreateAdminUserRequest,
  ExportAdminUsersQuery,
  ResetUserPasswordRequest,
  UpdateAdminUserRequest,
} from "../types";

export function listAdminUsers(query?: AdminUsersQuery) {
  return apiGet<ApiResponse<PageResponse<AdminUserSummaryDto>>>(
    "/api/admin/users",
    { query },
  );
}

export function exportAdminUsers(query: ExportAdminUsersQuery) {
  return apiDownload("/api/admin/users/export.csv", { query });
}

export function getAdminUser(userId: number) {
  return apiGet<ApiResponse<AdminUserDetailDto>>(
    `/api/admin/users/${userId}`,
  );
}

export function createAdminUser(payload: CreateAdminUserRequest) {
  return apiPost<ApiResponse<AdminUserDetailDto>>(
    "/api/admin/users",
    payload,
  );
}

export function updateAdminUser(
  userId: number,
  payload: UpdateAdminUserRequest,
) {
  return apiPatch<ApiResponse<AdminUserDetailDto>>(
    `/api/admin/users/${userId}`,
    payload,
  );
}

export function deleteAdminUser(userId: number) {
  return apiDelete<EmptyApiResponse>(`/api/admin/users/${userId}`);
}

export function resetUserPassword(
  userId: number,
  payload: ResetUserPasswordRequest,
) {
  return apiPost<EmptyApiResponse>(
    `/api/admin/users/${userId}/reset-password`,
    payload,
  );
}

export function changePasswordByEmail(payload: ChangePasswordByEmailRequest) {
  return apiPost<EmptyApiResponse>(
    "/api/admin/users/change-password",
    payload,
  );
}

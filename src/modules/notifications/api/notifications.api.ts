import { apiGet, apiPatch } from "@/shared/lib";
import type { ApiResponse, PageResponse } from "@/shared/types";

import type { NotificationDto, NotificationListQuery } from "../types";

export function listNotifications(query: NotificationListQuery = {}) {
  return apiGet<ApiResponse<PageResponse<NotificationDto>>>(
    "/api/notifications",
    { query },
  );
}

export function getUnreadNotificationCount() {
  return apiGet<ApiResponse<number>>("/api/notifications/unread-count");
}

export function markNotificationRead(notificationId: number) {
  return apiPatch<ApiResponse<NotificationDto>>(
    `/api/notifications/${notificationId}/read`,
  );
}

export function markAllNotificationsRead() {
  return apiPatch<ApiResponse<number>>("/api/notifications/read-all");
}

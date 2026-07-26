import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api";
import type { NotificationListQuery } from "../types";

function invalidateNotificationData(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.notifications.lists(),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.notifications.unreadCount(),
  });
}

export function useNotifications(query: NotificationListQuery = {}) {
  return useQuery({
    queryFn: () => listNotifications(query),
    queryKey: queryKeys.notifications.list(query),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryFn: getUnreadNotificationCount,
    queryKey: queryKeys.notifications.unreadCount(),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => invalidateNotificationData(queryClient),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => invalidateNotificationData(queryClient),
  });
}

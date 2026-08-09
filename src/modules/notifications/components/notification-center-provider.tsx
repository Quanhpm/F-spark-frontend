"use client";

import { Client, type IMessage } from "@stomp/stompjs";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/modules/auth";
import type { ApiResponse, PageResponse } from "@/shared/types";
import { queryKeys } from "@/shared/lib";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../hooks";
import type { NotificationDto } from "../types";
import { playNotificationSound } from "../lib/notification-sound";

const recentNotificationsQuery = {
  page: 0,
  size: 5,
  unreadOnly: true,
} as const;

const notificationPollInterval = 15_000;

type NotificationCenterValue = {
  notifications: NotificationDto[];
  unreadCount: number;
  notificationsQuery: ReturnType<typeof useNotifications>;
  unreadCountQuery: ReturnType<typeof useUnreadNotificationCount>;
  markReadMutation: ReturnType<typeof useMarkNotificationRead>;
  markAllMutation: ReturnType<typeof useMarkAllNotificationsRead>;
};

const NotificationCenterContext = createContext<NotificationCenterValue | null>(
  null,
);

export function NotificationCenterProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore(
    (state) => state.session?.tokens.accessToken ?? null,
  );
  const notificationsQuery = useNotifications(recentNotificationsQuery, {
    refetchInterval: notificationPollInterval,
  });
  const unreadCountQuery = useUnreadNotificationCount({
    refetchInterval: notificationPollInterval,
  });
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const previousUnreadCount = useRef<number | null>(null);

  useEffect(() => {
    const currentUnreadCount = unreadCountQuery.data?.data;
    if (currentUnreadCount === undefined) return;

    const previousCount = previousUnreadCount.current;
    previousUnreadCount.current = currentUnreadCount;
    if (previousCount !== null && currentUnreadCount > previousCount) {
      playNotificationSound();
    }
  }, [unreadCountQuery.data]);

  useEffect(() => {
    if (!accessToken || typeof window === "undefined") return;

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? window.location.origin;
    const websocketUrl =
      process.env.NEXT_PUBLIC_WS_URL ??
      `${apiBaseUrl.replace(/^http/, "ws").replace(/\/$/, "")}/ws`;
    const client = new Client({
      brokerURL: websocketUrl,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: () => undefined,
    });

    const handleNotification = (message: IMessage) => {
      let notification: NotificationDto;
      try {
        notification = JSON.parse(message.body) as NotificationDto;
      } catch {
        return;
      }

      if (!notification || typeof notification.id !== "number") return;

      queryClient.setQueryData<ApiResponse<number>>(
        queryKeys.notifications.unreadCount(),
        (current) => {
          if (!current || notification.read) return current;
          return { ...current, data: current.data + 1 };
        },
      );
      queryClient.setQueryData<
        ApiResponse<PageResponse<NotificationDto>>
      >(
        queryKeys.notifications.list(recentNotificationsQuery),
        (current) => {
          if (!current || notification.read) return current;
          const content = [
            notification,
            ...current.data.content.filter((item) => item.id !== notification.id),
          ].slice(0, current.data.size);
          return {
            ...current,
            data: {
              ...current.data,
              content,
              numberOfElements: content.length,
              totalElements: current.data.totalElements + 1,
            },
          };
        },
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.lists(),
        refetchType: "active",
      });
    };

    client.onConnect = () => {
      client.subscribe("/user/queue/notifications", handleNotification, {
        id: "fspark-notifications",
      });
    };
    client.onStompError = () => {
      void client.deactivate();
    };
    client.activate();

    return () => {
      void client.deactivate();
    };
  }, [accessToken, queryClient]);

  return (
    <NotificationCenterContext.Provider
      value={{
        notifications: notificationsQuery.data?.data.content ?? [],
        unreadCount: unreadCountQuery.data?.data ?? 0,
        notificationsQuery,
        unreadCountQuery,
        markReadMutation,
        markAllMutation,
      }}
    >
      {children}
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  const value = useContext(NotificationCenterContext);
  if (!value) {
    throw new Error(
      "useNotificationCenter must be used inside NotificationCenterProvider",
    );
  }
  return value;
}

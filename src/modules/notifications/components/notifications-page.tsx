"use client";

import { useState } from "react";
import { CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
} from "@/shared/components";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../hooks";
import type { NotificationDto } from "../types";
import {
  getNotificationErrorMessage,
  isSafeNotificationActionUrl,
} from "./notification-utils";
import { NotificationListItem } from "./notification-list-item";

const pageSize = 20;

export function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");
  const notificationsQuery = useNotifications({ page, size: pageSize, unreadOnly });
  const unreadCountQuery = useUnreadNotificationCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const notificationPage = notificationsQuery.data?.data;
  const notifications = notificationPage?.content ?? [];
  const currentPage = notificationPage?.number ?? page;
  const unreadCount = unreadCountQuery.data?.data ?? 0;
  const isMutating = markReadMutation.isPending || markAllMutation.isPending;

  async function activateNotification(notification: NotificationDto) {
    setActionError("");
    setFeedback("");

    try {
      if (!notification.read) {
        await markReadMutation.mutateAsync(notification.id);
        setFeedback("Notification marked as read.");
      }

      if (isSafeNotificationActionUrl(notification.actionUrl)) {
        router.push(notification.actionUrl);
      }
    } catch (error) {
      setActionError(getNotificationErrorMessage(error));
    }
  }

  async function markAllRead() {
    setActionError("");
    setFeedback("");

    try {
      await markAllMutation.mutateAsync();
      setFeedback("All notifications marked as read.");
    } catch (error) {
      setActionError(getNotificationErrorMessage(error));
    }
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        actions={
          <Button
            disabled={isMutating || unreadCount === 0}
            icon={<CheckCheck size={16} />}
            onClick={markAllRead}
            variant="secondary"
          >
            {markAllMutation.isPending ? "Marking..." : "Mark all read"}
          </Button>
        }
        description="Review updates about your groups, tasks, meetings, and feedback."
        eyebrow="Student"
        title="Notifications"
      />

      <Card>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4 max-[480px]:grid max-[480px]:items-stretch">
            <Select
              label="Show"
              onChange={(event) => {
                setUnreadOnly(event.target.value === "unread");
                setPage(0);
              }}
              value={unreadOnly ? "unread" : "all"}
            >
              <option value="all">All notifications</option>
              <option value="unread">Unread only</option>
            </Select>
            <span className="break-words text-sm text-muted">
              {unreadCountQuery.isError
                ? "Unread count unavailable"
                : `${unreadCount} unread`}
            </span>
          </div>

          {actionError && (
            <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </p>
          )}
          {feedback && (
            <p className="m-0 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
              {feedback}
            </p>
          )}

          {notificationsQuery.isLoading ? (
            <LoadingState title="Loading notifications" />
          ) : notificationsQuery.isError ? (
            <EmptyState
              className="border-red-200 bg-red-50"
              description={getNotificationErrorMessage(notificationsQuery.error)}
              title="Unable to load notifications"
            />
          ) : notifications.length === 0 ? (
            <EmptyState
              description={
                unreadOnly
                  ? "You have no unread notifications."
                  : "Updates will appear here when they are available."
              }
              title={unreadOnly ? "All caught up" : "No notifications"}
            />
          ) : (
            <div className="grid gap-3">
              {notifications.map((notification) => (
                <NotificationListItem
                  disabled={isMutating}
                  key={notification.id}
                  notification={notification}
                  onActivate={activateNotification}
                />
              ))}
            </div>
          )}

          {notificationPage && notificationPage.totalPages > 1 && (
            <nav
              aria-label="Notification pagination"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 max-[480px]:grid"
            >
              <span className="text-sm text-muted">
                Page {currentPage + 1} of {notificationPage.totalPages}
              </span>
              <div className="flex gap-2 max-[480px]:grid max-[480px]:grid-cols-2 [&>button]:min-w-0">
                <Button
                  disabled={!notificationPage.hasPrevious || isMutating}
                  icon={<ChevronLeft size={16} />}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  size="sm"
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  disabled={!notificationPage.hasNext || isMutating}
                  icon={<ChevronRight size={16} />}
                  onClick={() => setPage((current) => current + 1)}
                  size="sm"
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

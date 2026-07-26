"use client";

import { useId, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Button,
  EmptyState,
  LoadingState,
} from "@/shared/components";
import { useDialogAccessibility } from "@/shared/hooks";

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

const recentNotificationsQuery = {
  page: 0,
  size: 5,
  unreadOnly: true,
} as const;

function formatUnreadCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export function NotificationBell() {
  const router = useRouter();
  const popoverId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");
  const unreadCountQuery = useUnreadNotificationCount();
  const notificationsQuery = useNotifications(recentNotificationsQuery);
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const notifications = notificationsQuery.data?.data.content ?? [];
  const unreadCount = unreadCountQuery.data?.data ?? 0;
  const isMutating = markReadMutation.isPending || markAllMutation.isPending;
  const dialogRef = useDialogAccessibility<HTMLElement>(() => setIsOpen(false), {
    active: isOpen,
  });

  async function activateNotification(notification: NotificationDto) {
    setActionError("");
    setFeedback("");

    try {
      if (!notification.read) {
        await markReadMutation.mutateAsync(notification.id);
        setFeedback("Notification marked as read.");
      }

      if (isSafeNotificationActionUrl(notification.actionUrl)) {
        setIsOpen(false);
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
    <div className="relative">
      <Button
        aria-controls={isOpen ? popoverId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Notifications"
        className="size-12 px-0"
        icon={<Bell size={26} />}
        onClick={() => setIsOpen((current) => !current)}
        variant="ghost"
      >
        <span className="sr-only">Notifications</span>
      </Button>

      {unreadCount > 0 && (
        <span
          aria-label={`${unreadCount} unread notifications`}
          className="pointer-events-none absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-brand-primary px-1 text-[11px] font-bold leading-5 text-white"
        >
          {formatUnreadCount(unreadCount)}
        </span>
      )}

      {isOpen && (
        <>
          <button
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default border-0 bg-foreground/30 backdrop-blur-sm min-[761px]:hidden"
            onClick={() => setIsOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <section
            aria-label="Recent unread notifications"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-env(safe-area-inset-top))] min-w-0 flex-col gap-4 overflow-hidden rounded-t-2xl border border-b-0 border-border bg-surface px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-modal min-[761px]:absolute min-[761px]:inset-auto min-[761px]:top-12 min-[761px]:right-0 min-[761px]:max-h-[calc(100dvh-5rem)] min-[761px]:w-[min(420px,calc(100vw-2rem))] min-[761px]:rounded-2xl min-[761px]:border-b min-[761px]:p-4 min-[761px]:shadow-card"
            id={popoverId}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <header className="flex items-start justify-between gap-3">
              <div className="grid min-w-0 gap-1">
                <h2 className="m-0 text-base font-bold text-foreground">
                  Notifications
                </h2>
                <p className="m-0 text-sm text-muted">
                  Your latest unread updates.
                </p>
              </div>
              <Button
                aria-label="Close notifications"
                icon={<X size={16} />}
                onClick={() => setIsOpen(false)}
                size="sm"
                variant="ghost"
              />
            </header>

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
            <LoadingState className="min-h-44" title="Loading notifications" />
          ) : notificationsQuery.isError ? (
            <EmptyState
              className="min-h-44 border-red-200 bg-red-50"
              description={getNotificationErrorMessage(notificationsQuery.error)}
              title="Unable to load notifications"
            />
          ) : notifications.length === 0 ? (
            <EmptyState
              className="min-h-44"
              description="New updates will appear here."
              title="All caught up"
            />
          ) : (
            <div className="grid min-h-0 max-h-96 gap-3 overflow-y-auto overscroll-contain pr-1">
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

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 max-[480px]:grid max-[480px]:[&>button]:w-full">
            {unreadCountQuery.isError ? (
              <span className="text-xs text-red-700" role="status">
                {getNotificationErrorMessage(unreadCountQuery.error)}
              </span>
            ) : (
              <span className="text-xs text-muted">{unreadCount} unread</span>
            )}
            <Button
              disabled={isMutating || unreadCount === 0}
              icon={<CheckCheck size={16} />}
              onClick={markAllRead}
              size="sm"
              variant="secondary"
            >
              {markAllMutation.isPending ? "Marking..." : "Mark all read"}
            </Button>
          </footer>
          </section>
        </>
      )}
    </div>
  );
}

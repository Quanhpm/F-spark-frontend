import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/shared/components";

import type { NotificationDto } from "../types";
import {
  formatNotificationDate,
  isSafeNotificationActionUrl,
} from "./notification-utils";

type NotificationListItemProps = {
  disabled?: boolean;
  notification: NotificationDto;
  onActivate: (notification: NotificationDto) => void;
};

export function NotificationListItem({
  disabled = false,
  notification,
  onActivate,
}: NotificationListItemProps) {
  const hasAction = isSafeNotificationActionUrl(notification.actionUrl);
  const canActivate = !notification.read || hasAction;

  return (
    <article
      className={
        notification.read
          ? "min-w-0 rounded-xl border border-border bg-surface p-4"
          : "min-w-0 rounded-xl border border-border-warm bg-surface-warm p-4"
      }
    >
      <button
        aria-label={
          hasAction
            ? `Open notification: ${notification.title}`
            : `Mark notification as read: ${notification.title}`
        }
        className="grid w-full gap-2 text-left outline-none focus-visible:rounded-lg focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)] disabled:cursor-default disabled:opacity-70"
        disabled={disabled || !canActivate}
        onClick={() => onActivate(notification)}
        type="button"
      >
        <span className="flex min-w-0 items-start justify-between gap-3">
          <span className="min-w-0 break-words text-sm leading-snug font-bold text-foreground">
            {notification.title}
          </span>
          <Badge size="sm" tone={notification.read ? "neutral" : "brand"}>
            {notification.read ? "Read" : "Unread"}
          </Badge>
        </span>

        {notification.body && (
          <span className="min-w-0 break-words text-sm leading-relaxed text-muted">
            {notification.body}
          </span>
        )}

        <span className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="break-words">
            {formatNotificationDate(notification.createdAt)}
          </span>
          {hasAction && (
            <span className="inline-flex items-center gap-1 font-medium text-brand-primary">
              Open <ArrowUpRight size={14} />
            </span>
          )}
        </span>
      </button>
    </article>
  );
}

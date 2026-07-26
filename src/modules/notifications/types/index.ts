import type {
  ISODateTimeString,
  NotificationType,
  PaginationQuery,
} from "@/shared/types";

export type NotificationDto = {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  payload: string | null;
  read: boolean;
  readAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
};

export type NotificationListQuery = Pick<
  PaginationQuery,
  "page" | "size"
> & {
  unreadOnly?: boolean;
};

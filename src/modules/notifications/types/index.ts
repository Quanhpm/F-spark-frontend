import type {
  ISODateTimeString,
  NotificationType,
  PaginationQuery,
} from "@/shared/types";

export type NotificationActionKey =
  | "NONE"
  | "OPEN_GROUP"
  | "OPEN_GROUP_INVITATIONS"
  | "OPEN_TASK"
  | "OPEN_MILESTONE"
  | "OPEN_SUBMISSION"
  | "OPEN_GRADES"
  | "OPEN_MEETING"
  | "OPEN_FEEDBACK";

export type NotificationAction = {
  key: NotificationActionKey;
  params: Record<string, string>;
};

export type NotificationDto = {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  payload: string | null;
  action: NotificationAction | null;
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

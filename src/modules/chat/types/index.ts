import type {
  AcademicTermStatus,
  GroupStatus,
  ISODateTimeString,
  UserRole,
} from "@/shared/types";

export type ChatSenderDto = {
  accountId: number;
  displayName: string;
  role: UserRole;
};

export type ChatMessageDto = {
  id: number;
  groupId: number;
  sender: ChatSenderDto;
  content: string;
  createdAt: ISODateTimeString;
};

export type ChatMentorDto = {
  accountId: number | null;
  mentorCode: string;
  fullName: string;
};

export type ChatRoomDto = {
  groupId: number;
  groupName: string;
  groupNo: string;
  term: string;
  courseCode: string;
  termStatus: AcademicTermStatus;
  groupStatus: GroupStatus;
  archived: boolean;
  readOnly: boolean;
  groupCreatedAt: ISODateTimeString;
  lastMessage: ChatMessageDto | null;
  unreadCount: number;
  mentors: ChatMentorDto[];
};

export type ChatMessagePageDto = {
  content: ChatMessageDto[];
  nextBeforeId: number | null;
  hasMore: boolean;
};

export type ChatReadStateDto = {
  groupId: number;
  lastReadMessageId: number | null;
  roomUnreadCount: number;
  totalUnreadCount: number;
};

import { apiGet, apiPatch, apiPost } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";
import type {
  ChatMessageDto,
  ChatMessagePageDto,
  ChatReadStateDto,
  ChatRoomDto,
} from "../types";

export function listChatRooms() {
  return apiGet<ApiResponse<ChatRoomDto[]>>("/api/chat/rooms");
}

export function getChatUnreadCount() {
  return apiGet<ApiResponse<number>>("/api/chat/unread-count");
}

export function listChatMessages(
  groupId: number,
  beforeId?: number,
  size = 30,
) {
  return apiGet<ApiResponse<ChatMessagePageDto>>(
    `/api/chat/groups/${groupId}/messages`,
    { query: { beforeId, size } },
  );
}

export function sendChatMessage(groupId: number, content: string) {
  return apiPost<ApiResponse<ChatMessageDto>>(
    `/api/chat/groups/${groupId}/messages`,
    { content },
  );
}

export function markChatRead(groupId: number, lastReadMessageId: number) {
  return apiPatch<ApiResponse<ChatReadStateDto>>(
    `/api/chat/groups/${groupId}/read`,
    { lastReadMessageId },
  );
}

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type { ApiResponse } from "@/shared/types";
import { queryKeys } from "@/shared/lib";
import {
  getChatUnreadCount,
  listChatMessages,
  listChatRooms,
  markChatRead,
  sendChatMessage,
} from "../api";
import type { ChatMessagePageDto } from "../types";

export function useChatRooms() {
  return useQuery({ queryFn: listChatRooms, queryKey: queryKeys.chat.rooms() });
}

export function useChatUnreadCount(enabled = true) {
  return useQuery({
    enabled,
    queryFn: getChatUnreadCount,
    queryKey: queryKeys.chat.unreadCount(),
    refetchInterval: 15_000,
  });
}

export function useChatMessages(groupId: number | null) {
  const queryKey = groupId == null
    ? queryKeys.chat.emptyMessages()
    : queryKeys.chat.messages(groupId);
  return useInfiniteQuery<
    ApiResponse<ChatMessagePageDto>,
    Error,
    InfiniteData<ApiResponse<ChatMessagePageDto>>,
    typeof queryKey,
    number | undefined
  >({
    enabled: groupId != null,
    getNextPageParam: (lastPage) =>
      lastPage.data.hasMore ? lastPage.data.nextBeforeId ?? undefined : undefined,
    initialPageParam: undefined,
    queryFn: ({ pageParam }) => {
      if (groupId == null) throw new Error("A group id is required");
      return listChatMessages(groupId, pageParam);
    },
    queryKey,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, content }: { groupId: number; content: string }) =>
      sendChatMessage(groupId, content),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(variables.groupId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.rooms() });
    },
  });
}

export function useMarkChatRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, messageId }: { groupId: number; messageId: number }) =>
      markChatRead(groupId, messageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.rooms() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount() });
    },
  });
}

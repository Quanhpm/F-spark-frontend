"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/modules/auth";
import { queryKeys } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";
import { useRealtimeEvent, useRealtimeReconnect } from "@/shared/realtime";
import { useChatUnreadCount } from "../hooks";
import type { ChatMessageDto, ChatReadReceiptDto } from "../types";

type ChatCenterValue = { unreadCount: number };

const ChatCenterContext = createContext<ChatCenterValue>({ unreadCount: 0 });

export function ChatCenterProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.session?.user.role);
  const enabled = role === "STUDENT" || role === "MENTOR";
  const unreadQuery = useChatUnreadCount(enabled);

  const handleMessage = useCallback(
    (message: { body: string }) => {
      let payload: ChatMessageDto;
      try {
        payload = JSON.parse(message.body) as ChatMessageDto;
      } catch {
        return;
      }
      if (!payload || typeof payload.id !== "number" || typeof payload.groupId !== "number") return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(payload.groupId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.rooms() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount() });
    },
    [queryClient],
  );

  useRealtimeEvent("chat", handleMessage);

  const handleReadReceipt = useCallback(
    (message: { body: string }) => {
      let payload: ChatReadReceiptDto;
      try {
        payload = JSON.parse(message.body) as ChatReadReceiptDto;
      } catch {
        return;
      }
      if (!payload || typeof payload.groupId !== "number" || typeof payload.accountId !== "number") return;
      const queryKey = queryKeys.chat.receipts(payload.groupId);
      queryClient.setQueryData<ApiResponse<ChatReadReceiptDto[]>>(queryKey, (current) => {
        if (!current) {
          void queryClient.invalidateQueries({ queryKey });
          return current;
        }
        const existing = current.data.find((item) => item.accountId === payload.accountId);
        if (existing && (existing.lastReadMessageId ?? 0) >= (payload.lastReadMessageId ?? 0)) {
          return current;
        }
        const data = existing
          ? current.data.map((item) => item.accountId === payload.accountId ? payload : item)
          : [...current.data, payload];
        return { ...current, data };
      });
    },
    [queryClient],
  );

  useRealtimeEvent("chatReadReceipts", handleReadReceipt);

  const handleReconnect = useCallback(() => {
    if (!enabled) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.chat.rooms() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chat.messagesRoot() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.chat.receiptsRoot() });
  }, [enabled, queryClient]);

  useRealtimeReconnect(handleReconnect);

  return (
    <ChatCenterContext.Provider value={{ unreadCount: unreadQuery.data?.data ?? 0 }}>
      {children}
    </ChatCenterContext.Provider>
  );
}

export function useChatCenter() {
  return useContext(ChatCenterContext);
}

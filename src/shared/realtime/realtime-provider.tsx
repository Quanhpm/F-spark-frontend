"use client";

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import { useAuthStore } from "@/modules/auth";

type RealtimeChannel = "chat" | "notifications";
type RealtimeHandler = (message: IMessage) => void;

type RealtimeContextValue = {
  subscribe: (channel: RealtimeChannel, handler: RealtimeHandler) => () => void;
  subscribeReconnect: (handler: () => void) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore(
    (state) => state.session?.tokens.accessToken ?? null,
  );
  const listenersRef = useRef<Record<RealtimeChannel, Set<RealtimeHandler>>>(
    { chat: new Set(), notifications: new Set() },
  );
  const reconnectListenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback(
    (channel: RealtimeChannel, handler: RealtimeHandler) => {
      listenersRef.current[channel].add(handler);
      return () => listenersRef.current[channel].delete(handler);
    },
    [],
  );
  const subscribeReconnect = useCallback((handler: () => void) => {
    reconnectListenersRef.current.add(handler);
    return () => reconnectListenersRef.current.delete(handler);
  }, []);

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
      debug: () => undefined,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      reconnectDelay: 5_000,
    });
    let subscriptions: StompSubscription[] = [];

    client.onConnect = () => {
      subscriptions = (["notifications", "chat"] as const).map((channel) =>
        client.subscribe(
          `/user/queue/${channel}`,
          (message) => {
            listenersRef.current[channel].forEach((handler) => handler(message));
          },
          { id: `fspark-${channel}` },
        ),
      );
      reconnectListenersRef.current.forEach((handler) => handler());
    };
    client.onStompError = () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      subscriptions = [];
    };
    client.activate();

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      void client.deactivate();
    };
  }, [accessToken]);

  return (
    <RealtimeContext.Provider value={{ subscribe, subscribeReconnect }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeReconnect(handler: () => void) {
  const context = useContext(RealtimeContext);
  useEffect(() => {
    if (!context) return;
    return context.subscribeReconnect(handler);
  }, [context, handler]);
}

export function useRealtimeEvent(
  channel: RealtimeChannel,
  handler: RealtimeHandler,
) {
  const context = useContext(RealtimeContext);
  useEffect(() => {
    if (!context) return;
    return context.subscribe(channel, handler);
  }, [channel, context, handler]);
}

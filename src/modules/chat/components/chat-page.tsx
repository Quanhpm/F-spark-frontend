"use client";

import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  LockKeyhole,
  MessageCircle,
  Send,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type UIEvent,
} from "react";

import { useAuthStore } from "@/modules/auth";
import { ApiError, cn } from "@/shared/lib";
import { Badge, Button, EmptyState, LoadingState } from "@/shared/components/ui";
import { useChatMessages, useChatRooms, useMarkChatRead, useSendChatMessage } from "../hooks";
import type { ChatMessageDto, ChatRoomDto } from "../types";

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function RoomButton({ room, selected, onSelect }: {
  room: ChatRoomDto;
  selected: boolean;
  onSelect: () => void;
}) {
  const stateLabel = room.termStatus === "CLOSED"
    ? "Closed term"
    : room.groupStatus === "INACTIVE" ? "Inactive" : "Current";
  return (
    <button
      className={cn(
        "grid w-full cursor-pointer gap-2 border-0 border-b border-border bg-transparent px-4 py-4 text-left transition-colors hover:bg-background",
        selected && "bg-[#fff3ed]",
      )}
      onClick={onSelect}
      type="button"
    >
      <span className="flex min-w-0 items-start justify-between gap-3">
        <strong className="min-w-0 truncate text-sm text-foreground">{room.groupName}</strong>
        {room.unreadCount > 0 && (
          <span className="grid min-h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-primary px-1.5 text-[11px] font-bold text-white">
            {room.unreadCount > 99 ? "99+" : room.unreadCount}
          </span>
        )}
      </span>
      <span className="text-xs font-semibold text-muted">
        {room.term} · {room.courseCode} · {room.groupNo}
      </span>
      <span className="flex min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-muted">
          {room.lastMessage
            ? `${room.lastMessage.sender.displayName}: ${room.lastMessage.content}`
            : "No messages yet"}
        </span>
        <Badge size="sm" tone={room.archived ? "neutral" : "success"}>{stateLabel}</Badge>
      </span>
    </button>
  );
}

function RoomSection({ rooms, selectedId, onSelect }: {
  rooms: ChatRoomDto[];
  selectedId: number | null;
  onSelect: (room: ChatRoomDto) => void;
}) {
  return (
    <div>
      {rooms.map((room) => (
        <RoomButton
          key={room.groupId}
          onSelect={() => onSelect(room)}
          room={room}
          selected={room.groupId === selectedId}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message, own }: { message: ChatMessageDto; own: boolean }) {
  return (
    <div className={cn("flex", own ? "justify-end" : "justify-start")}>
      <div className={cn("grid max-w-[min(78%,640px)] gap-1", own && "justify-items-end")}>
        {!own && (
          <span className="px-1 text-xs font-semibold text-muted">
            {message.sender.displayName} · {message.sender.role === "MENTOR" ? "Mentor" : "Student"}
          </span>
        )}
        <div className={cn(
          "w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          own ? "rounded-br-md bg-brand-primary text-white" : "rounded-bl-md bg-background text-foreground",
        )}>
          {message.content}
        </div>
        <time className="px-1 text-[11px] text-muted" dateTime={message.createdAt}>
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}

function ChatRoomEmptyIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={compact ? "h-auto w-[min(340px,82%)]" : "h-auto w-[min(420px,88%)]"}
      data-testid={compact ? "empty-conversation-illustration" : "chat-empty-illustration"}
      fill="none"
      viewBox="0 0 420 240"
    >
      <circle cx="55" cy="54" fill="#FFF3ED" r="34" />
      <circle cx="369" cy="188" fill="#FFF8E7" r="29" />
      <circle cx="375" cy="49" fill="#F4511E" opacity="0.12" r="8" />
      <path d="M38 184h18M47 175v18" stroke="#EDA12F" strokeLinecap="round" strokeWidth="3" />
      <path d="m350 78 5 5 9-11" stroke="#F4511E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

      <rect fill="#FFF" height="174" rx="26" stroke="#E5E7EB" strokeWidth="2" width="278" x="71" y="32" />
      <path d="M72 67h276" stroke="#E5E7EB" strokeWidth="2" />
      <circle cx="93" cy="50" fill="#F4511E" r="5" />
      <circle cx="110" cy="50" fill="#EDA12F" r="5" />
      <circle cx="127" cy="50" fill="#DDE4EA" r="5" />

      <circle cx="108" cy="96" fill="#FFE4D8" r="15" />
      <path d="M102 100c2-5 10-5 12 0" stroke="#F4511E" strokeLinecap="round" strokeWidth="2" />
      <circle cx="108" cy="92" fill="#F4511E" r="4" />
      <rect fill="#F4F5F6" height="36" rx="14" width="142" x="132" y="78" />
      <path d="M148 91h83M148 101h55" stroke="#A3A9B1" strokeLinecap="round" strokeWidth="4" />

      <rect fill="#F4511E" height="42" rx="15" width="132" x="177" y="128" />
      <path d="M194 143h91M222 155h63" stroke="#FFF" strokeLinecap="round" strokeWidth="4" />
      <circle cx="329" cy="149" fill="#FFF0E9" r="16" />
      <circle cx="329" cy="145" fill="#EDA12F" r="4" />
      <path d="M322 154c2-6 12-6 14 0" stroke="#EDA12F" strokeLinecap="round" strokeWidth="2" />

      <path d="M105 196c21 16 48 24 76 24h71c30 0 58-9 80-25" stroke="#EDA12F" strokeDasharray="3 8" strokeLinecap="round" strokeWidth="3" />
      <path d="m194 206 16 12 16-12" fill="#FFF8E7" stroke="#EDA12F" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function Conversation({ room, onBack }: { room: ChatRoomDto; onBack: () => void }) {
  const accountId = useAuthStore((state) => state.session?.user.id);
  const messagesQuery = useChatMessages(room.groupId);
  const sendMutation = useSendChatMessage();
  const readMutation = useMarkChatRead();
  const [content, setContent] = useState("");
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const lastMarkedRef = useRef<string>("");
  const messages = useMemo(
    () => messagesQuery.data?.pages.slice().reverse().flatMap((page) => page.data.content) ?? [],
    [messagesQuery.data],
  );
  const latest = messages.at(-1);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (previousHeightRef.current != null) {
      element.scrollTop += element.scrollHeight - previousHeightRef.current;
      previousHeightRef.current = null;
      return;
    }
    if (shouldStickToBottomRef.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [latest?.id, messages.length, room.groupId]);

  useEffect(() => {
    if (!latest || document.visibilityState !== "visible") return;
    const key = `${room.groupId}:${latest.id}`;
    if (lastMarkedRef.current === key) return;
    lastMarkedRef.current = key;
    readMutation.mutate({ groupId: room.groupId, messageId: latest.id });
  }, [latest?.id, room.groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    const normalized = content.trim();
    if (!normalized || room.readOnly || sendMutation.isPending) return;
    shouldStickToBottomRef.current = true;
    setShowJumpToLatest(false);
    try {
      await sendMutation.mutateAsync({ groupId: room.groupId, content: normalized });
      setContent("");
    } catch {
      // Keep the draft in place so the user can retry.
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const distanceFromBottom = Math.max(
      0,
      element.scrollHeight - element.scrollTop - element.clientHeight,
    );
    const isNearBottom = distanceFromBottom <= 120;
    shouldStickToBottomRef.current = isNearBottom;
    setShowJumpToLatest(!isNearBottom && messages.length > 0);
    if (element.scrollTop < 80 && messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      previousHeightRef.current = element.scrollHeight;
      void messagesQuery.fetchNextPage();
    }
  }

  function jumpToLatest() {
    const element = scrollRef.current;
    if (!element) return;
    shouldStickToBottomRef.current = true;
    setShowJumpToLatest(false);
    element.scrollTop = element.scrollHeight;
  }

  return (
    <section aria-label="Conversation" className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface">
      <header className="flex min-w-0 shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Button aria-label="Back to chat rooms" className="min-[761px]:hidden" onClick={onBack} size="sm" variant="ghost">
          <ArrowLeft size={18} />
        </Button>
        <div className="grid min-w-0 flex-1 gap-1">
          <strong className="truncate text-base text-foreground">{room.groupName}</strong>
          <span className="text-xs text-muted">{room.term} · {room.courseCode} · {room.groupNo}</span>
        </div>
        <Badge tone={room.archived ? "neutral" : "success"}>
          {room.termStatus === "CLOSED" ? "Closed term" : room.groupStatus === "INACTIVE" ? "Inactive" : "Current"}
        </Badge>
      </header>

      <div
        aria-label="Messages"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface p-4"
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {messagesQuery.isLoading ? (
          <LoadingState title="Loading messages" />
        ) : messagesQuery.isError ? (
          <EmptyState description={errorMessage(messagesQuery.error)} title="Unable to load messages" />
        ) : messages.length === 0 ? (
          <div className="grid min-h-full place-items-center py-8 text-center">
            <div className="grid w-full max-w-lg justify-items-center gap-3 text-muted">
              <ChatRoomEmptyIllustration compact />
              <strong className="text-lg text-foreground">No messages yet</strong>
              <span className="text-sm">Start the conversation with your group and mentors.</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {messagesQuery.isFetchingNextPage && <p className="m-0 text-center text-xs text-muted">Loading older messages…</p>}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} own={message.sender.accountId === accountId} />
            ))}
          </div>
        )}
      </div>

      {showJumpToLatest && (
        <div className="relative z-10 h-0 shrink-0">
          <Button
            aria-label="Jump to latest message"
            className="absolute right-4 bottom-3 border-white/70 shadow-[0_8px_24px_rgba(244,81,30,0.32)]"
            icon={<ArrowDown size={16} />}
            onClick={jumpToLatest}
            size="sm"
            variant="primary"
          >
            Latest
          </Button>
        </div>
      )}

      <footer className="shrink-0 border-t border-border p-3">
        {room.readOnly ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-background px-4 py-3 text-sm text-muted">
            <LockKeyhole size={16} /> This archived room is read-only.
          </div>
        ) : (
          <div className="grid gap-2">
            <div className="flex items-end gap-2">
              <textarea
                aria-label="Message"
                className="min-h-11 max-h-36 flex-1 resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand-primary"
                maxLength={2000}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message…"
                rows={1}
                value={content}
              />
              <Button aria-label="Send message" disabled={!content.trim() || sendMutation.isPending} onClick={() => void submit()}>
                <Send size={17} />
              </Button>
            </div>
            <div className="flex justify-between gap-3 px-1 text-xs text-muted">
              <span>{sendMutation.isError ? errorMessage(sendMutation.error) : "Enter to send · Shift+Enter for a new line"}</span>
              <span>{content.length}/2000</span>
            </div>
          </div>
        )}
      </footer>
    </section>
  );
}

export function ChatPage() {
  const roomsQuery = useChatRooms();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsedGroupId = Number(searchParams.get("groupId"));
  const selectedId = Number.isSafeInteger(parsedGroupId) && parsedGroupId > 0 ? parsedGroupId : null;
  const [archivedOpen, setArchivedOpen] = useState(false);
  const rooms = roomsQuery.data?.data ?? [];
  const currentRooms = rooms.filter((room) => !room.archived);
  const archivedRooms = rooms.filter((room) => room.archived);
  const archivedUnread = archivedRooms.reduce((total, room) => total + room.unreadCount, 0);
  const selectedRoom = rooms.find((room) => room.groupId === selectedId) ?? null;

  function selectRoom(room: ChatRoomDto) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("groupId", String(room.groupId));
    router.replace(`${pathname}?${params.toString()}`);
  }

  function clearSelection() {
    router.replace(pathname);
  }

  return (
    <div className="flex h-[calc(100svh-120px)] min-h-0 min-w-0 flex-col overflow-hidden max-[960px]:h-[calc(100svh-104px)] max-[480px]:h-[calc(100svh-96px)]">
      {roomsQuery.isLoading ? (
        <LoadingState title="Loading chat rooms" />
      ) : roomsQuery.isError ? (
        <EmptyState description={errorMessage(roomsQuery.error)} title="Unable to load chat rooms" />
      ) : rooms.length === 0 ? (
        <EmptyState description="A chat room appears when you belong to a group or are assigned as its mentor." icon={<MessageCircle size={22} />} title="No chat rooms" />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(260px,340px)_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-surface shadow-card max-[760px]:grid-cols-1">
          <aside
            aria-label="Chat rooms"
            className={cn(
              "min-h-0 min-w-0 overflow-y-auto overscroll-contain border-r border-border max-[760px]:border-r-0",
              selectedRoom && "max-[760px]:hidden",
            )}
          >
            <div className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">Current</div>
            {currentRooms.length > 0 ? (
              <RoomSection onSelect={selectRoom} rooms={currentRooms} selectedId={selectedId} />
            ) : (
              <p className="m-0 px-4 py-5 text-sm text-muted">No current rooms.</p>
            )}
            <button
              aria-expanded={archivedOpen}
              className="flex w-full cursor-pointer items-center justify-between border-0 border-y border-border bg-background px-4 py-3 text-left text-sm font-bold text-foreground"
              onClick={() => setArchivedOpen((value) => !value)}
              type="button"
            >
              <span className="flex items-center gap-2"><Archive size={16} /> Archived ({archivedRooms.length})</span>
              <span className="flex items-center gap-2">
                {archivedUnread > 0 && <Badge tone="brand" size="sm">{archivedUnread}</Badge>}
                {archivedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            {archivedOpen && <RoomSection onSelect={selectRoom} rooms={archivedRooms} selectedId={selectedId} />}
          </aside>
          <div className={cn("h-full min-h-0 min-w-0 overflow-hidden", !selectedRoom && "max-[760px]:hidden")}>
            {selectedRoom ? (
              <Conversation key={selectedRoom.groupId} onBack={clearSelection} room={selectedRoom} />
            ) : (
              <div className="grid h-full min-h-0 place-items-center p-8 text-center">
                <div className="grid w-full max-w-xl justify-items-center gap-3 text-muted">
                  <ChatRoomEmptyIllustration />
                  <strong className="text-lg text-foreground">Select a chat room</strong>
                  <span className="text-sm">Choose a current or archived group to view its conversation.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

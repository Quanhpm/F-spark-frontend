"use client";

import {
  Archive,
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
import { Badge, Button, EmptyState, LoadingState, PageHeader } from "@/shared/components/ui";
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

function Conversation({ room, onBack }: { room: ChatRoomDto; onBack: () => void }) {
  const accountId = useAuthStore((state) => state.session?.user.id);
  const messagesQuery = useChatMessages(room.groupId);
  const sendMutation = useSendChatMessage();
  const readMutation = useMarkChatRead();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number | null>(null);
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
    element.scrollTop = element.scrollHeight;
  }, [messages.length, room.groupId]);

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
    if (element.scrollTop < 80 && messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      previousHeightRef.current = element.scrollHeight;
      void messagesQuery.fetchNextPage();
    }
  }

  return (
    <section className="flex min-h-[620px] min-w-0 flex-col bg-surface max-[760px]:min-h-[calc(100svh-130px)]">
      <header className="flex min-w-0 items-center gap-3 border-b border-border px-4 py-3">
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

      <div className="flex-1 overflow-y-auto bg-surface p-4" onScroll={handleScroll} ref={scrollRef}>
        {messagesQuery.isLoading ? (
          <LoadingState title="Loading messages" />
        ) : messagesQuery.isError ? (
          <EmptyState description={errorMessage(messagesQuery.error)} title="Unable to load messages" />
        ) : messages.length === 0 ? (
          <EmptyState description="Start the conversation with your group and mentors." icon={<MessageCircle size={22} />} title="No messages yet" />
        ) : (
          <div className="grid gap-4">
            {messagesQuery.isFetchingNextPage && <p className="m-0 text-center text-xs text-muted">Loading older messages…</p>}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} own={message.sender.accountId === accountId} />
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-border p-3">
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
    <div className="grid min-w-0 gap-6">
      <PageHeader description="Talk with current group members and assigned mentors in real time." eyebrow="Collaboration" title="Chat" />
      {roomsQuery.isLoading ? (
        <LoadingState title="Loading chat rooms" />
      ) : roomsQuery.isError ? (
        <EmptyState description={errorMessage(roomsQuery.error)} title="Unable to load chat rooms" />
      ) : rooms.length === 0 ? (
        <EmptyState description="A chat room appears when you belong to a group or are assigned as its mentor." icon={<MessageCircle size={22} />} title="No chat rooms" />
      ) : (
        <div className="grid min-h-[620px] grid-cols-[minmax(260px,340px)_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-surface shadow-card max-[760px]:grid-cols-1">
          <aside className={cn("min-w-0 border-r border-border max-[760px]:border-r-0", selectedRoom && "max-[760px]:hidden")}>
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
          <div className={cn("min-w-0", !selectedRoom && "max-[760px]:hidden")}>
            {selectedRoom ? (
              <Conversation key={selectedRoom.groupId} onBack={clearSelection} room={selectedRoom} />
            ) : (
              <div className="grid min-h-[620px] place-items-center p-8 text-center">
                <div className="grid max-w-sm justify-items-center gap-3 text-muted">
                  <span className="grid size-14 place-items-center rounded-full bg-surface-warm text-brand-primary"><MessageCircle size={26} /></span>
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

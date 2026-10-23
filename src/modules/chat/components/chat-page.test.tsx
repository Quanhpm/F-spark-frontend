import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatMessageDto } from "../types";
import { ChatPage } from "./chat-page";

const replace = vi.fn();
let queryString = "groupId=2";
let messageContent: ChatMessageDto[] = [];
vi.mock("next/navigation", () => ({
  usePathname: () => "/student/chat",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(queryString),
}));

vi.mock("@/modules/auth", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ session: { user: { id: 10, role: "STUDENT" } } }),
}));

const rooms = [
  {
    archived: false,
    courseCode: "EXE201",
    groupCreatedAt: "2026-10-01T00:00:00Z",
    groupId: 1,
    groupName: "Current Team",
    groupNo: "G01",
    groupStatus: "ACTIVE",
    lastMessage: null,
    mentors: [],
    readOnly: false,
    term: "FA26",
    termStatus: "OPEN",
    unreadCount: 2,
  },
  {
    archived: true,
    courseCode: "EXE101",
    groupCreatedAt: "2026-05-01T00:00:00Z",
    groupId: 2,
    groupName: "Archived Team",
    groupNo: "G01",
    groupStatus: "ACTIVE",
    lastMessage: null,
    mentors: [],
    readOnly: true,
    term: "SU26",
    termStatus: "CLOSED",
    unreadCount: 1,
  },
];

vi.mock("../hooks", () => ({
  useChatMessages: () => ({
    data: { pages: [{ data: { content: messageContent, hasMore: false, nextBeforeId: null } }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isLoading: false,
  }),
  useChatRooms: () => ({ data: { data: rooms }, isError: false, isLoading: false }),
  useMarkChatRead: () => ({ mutate: vi.fn() }),
  useSendChatMessage: () => ({ isError: false, isPending: false, mutateAsync: vi.fn() }),
}));

describe("ChatPage", () => {
  beforeEach(() => {
    queryString = "groupId=2";
    messageContent = [];
  });

  it("keeps closed-course history separate and read-only", () => {
    render(<ChatPage />);

    expect(screen.getByText("FA26 · EXE201 · G01")).toBeInTheDocument();
    expect(screen.getByText("SU26 · EXE101 · G01")).toBeInTheDocument();
    expect(screen.getByText("This archived room is read-only.")).toBeInTheDocument();
    expect(screen.getByTestId("empty-conversation-illustration")).toBeInTheDocument();
    expect(screen.getByLabelText("Chat rooms")).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(screen.getByLabelText("Messages")).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(screen.getByLabelText("Conversation")).toHaveClass("h-full", "overflow-hidden");

    fireEvent.click(screen.getByRole("button", { name: /Archived \(1\)/ }));
    expect(screen.getAllByText("Archived Team")).toHaveLength(2);
  });

  it("shows a branded illustration before a room is selected", () => {
    queryString = "";
    render(<ChatPage />);

    expect(screen.getByTestId("chat-empty-illustration")).toBeInTheDocument();
    expect(screen.getByText("Select a chat room")).toBeInTheDocument();
  });

  it("keeps following the newest message when the page size stays unchanged", async () => {
    queryString = "groupId=1";
    messageContent = [message(1, "First message")];
    const { rerender } = render(<ChatPage />);
    const messages = screen.getByLabelText("Messages");
    Object.defineProperty(messages, "clientHeight", { configurable: true, value: 300 });
    Object.defineProperty(messages, "scrollHeight", { configurable: true, value: 1000 });
    messages.scrollTop = 650;
    fireEvent.scroll(messages);

    messageContent = [message(2, "Replacement newest message")];
    rerender(<ChatPage />);

    await waitFor(() => expect(messages.scrollTop).toBe(1000));
  });

  it("shows a button for returning to the latest message after scrolling up", () => {
    queryString = "groupId=1";
    messageContent = [message(1, "A message")];
    render(<ChatPage />);
    const messages = screen.getByLabelText("Messages");
    Object.defineProperty(messages, "clientHeight", { configurable: true, value: 300 });
    Object.defineProperty(messages, "scrollHeight", { configurable: true, value: 1000 });
    messages.scrollTop = 100;
    fireEvent.scroll(messages);

    const jumpButton = screen.getByRole("button", { name: "Jump to latest message" });
    expect(jumpButton).toHaveClass("bg-brand-primary", "text-white");
    fireEvent.click(jumpButton);

    expect(messages.scrollTop).toBe(1000);
    expect(screen.queryByRole("button", { name: "Jump to latest message" })).not.toBeInTheDocument();
  });
});

function message(id: number, content: string): ChatMessageDto {
  return {
    content,
    createdAt: "2026-10-23T07:00:00Z",
    groupId: 1,
    id,
    sender: { accountId: 20, displayName: "Mentor", role: "MENTOR" },
  };
}

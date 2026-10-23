import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatMessageDto } from "../types";
import { ChatPage } from "./chat-page";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
const replace = vi.fn();
const sendMessage = vi.fn();
const fetchNextPage = vi.fn();
let queryString = "groupId=2";
let messageContent: ChatMessageDto[] = [];
let messagePages: ChatMessageDto[][] | null = null;
let hasNextPage = false;
vi.mock("next/navigation", () => ({
  usePathname: () => "/student/chat",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(queryString),
}));

vi.mock("@/modules/auth", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ session: { user: { id: 10, role: "STUDENT" } } }),
}));

vi.mock("sonner", () => ({ toast: { error: toastError } }));

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
    data: {
      pages: (messagePages ?? [messageContent]).map((content) => ({
        data: { content, hasMore: false, nextBeforeId: null },
      })),
    },
    fetchNextPage,
    hasNextPage,
    isError: false,
    isFetchingNextPage: false,
    isLoading: false,
  }),
  useChatRooms: () => ({ data: { data: rooms }, isError: false, isLoading: false }),
  useMarkChatRead: () => ({ mutate: vi.fn() }),
  useSendChatMessage: () => ({ isError: false, isPending: false, mutateAsync: sendMessage }),
}));

describe("ChatPage", () => {
  beforeEach(() => {
    queryString = "groupId=2";
    messageContent = [];
    messagePages = null;
    hasNextPage = false;
    fetchNextPage.mockReset().mockResolvedValue({
      data: { pages: [] },
      hasNextPage: false,
      isError: false,
    });
    sendMessage.mockReset().mockResolvedValue(undefined);
    toastError.mockReset();
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

  it("renders a message only once when cursor pages overlap", () => {
    queryString = "groupId=1";
    messagePages = [
      [message(2, "Newest message")],
      [message(1, "Older message"), message(2, "Newest message")],
    ];

    render(<ChatPage />);

    expect(screen.getAllByText("Newest message")).toHaveLength(1);
    expect(screen.getByText("Older message")).toBeInTheDocument();
  });

  it("submits only once when send events happen before pending state updates", () => {
    queryString = "groupId=1";
    render(<ChatPage />);
    const input = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(input, { target: { value: "Only once" } });

    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ content: "Only once", groupId: 1 });
  });

  it("selects, cancels, and sends a reply with the target id", async () => {
    queryString = "groupId=1";
    messageContent = [message(11, "Original message")];
    render(<ChatPage />);

    fireEvent.click(screen.getByRole("button", { name: "Reply to message from Mentor" }));
    expect(screen.getByText("Replying to Mentor")).toBeInTheDocument();
    expect(screen.getAllByText("Original message")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Cancel reply" }));
    expect(screen.queryByText("Replying to Mentor")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reply to message from Mentor" }));
    const input = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(input, { target: { value: "Reply body" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(sendMessage).toHaveBeenCalledWith({
      content: "Reply body",
      groupId: 1,
      replyToMessageId: 11,
    });
    await waitFor(() => expect(screen.queryByText("Replying to Mentor")).not.toBeInTheDocument());
  });

  it("keeps the reply target and draft when sending fails", async () => {
    queryString = "groupId=1";
    messageContent = [message(12, "Original message")];
    sendMessage.mockRejectedValueOnce(new Error("Send failed"));
    render(<ChatPage />);

    fireEvent.click(screen.getByRole("button", { name: "Reply to message from Mentor" }));
    const input = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(input, { target: { value: "Keep this draft" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Replying to Mentor")).toBeInTheDocument();
    expect(input).toHaveValue("Keep this draft");
  });

  it("renders a reply quote and navigates to an already loaded original", async () => {
    queryString = "groupId=1";
    messageContent = [
      message(20, "Original message"),
      message(21, "Reply body", {
        content: "Original message",
        id: 20,
        sender: { accountId: 20, displayName: "Mentor", role: "MENTOR" },
      }),
    ];
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<ChatPage />);

    fireEvent.click(screen.getByRole("button", { name: "Go to replied message from Mentor" }));

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    }));
    expect(document.getElementById("chat-message-20")).toHaveClass("bg-[#fff3ed]");
  });

  it("loads older cursor pages before navigating to the original message", async () => {
    queryString = "groupId=1";
    hasNextPage = true;
    const reply = message(31, "Reply body", {
      content: "Older original",
      id: 30,
      sender: { accountId: 20, displayName: "Mentor", role: "MENTOR" },
    });
    messagePages = [[reply]];
    fetchNextPage.mockImplementation(async () => {
      messagePages = [[reply], [message(30, "Older original")]];
      return {
        data: {
          pages: messagePages.map((content) => ({
            data: { content, hasMore: false, nextBeforeId: null },
          })),
        },
        hasNextPage: false,
        isError: false,
      };
    });
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const view = render(<ChatPage />);

    fireEvent.click(screen.getByRole("button", { name: "Go to replied message from Mentor" }));
    await waitFor(() => expect(fetchNextPage).toHaveBeenCalledTimes(1));
    view.rerender(<ChatPage />);

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(toastError).not.toHaveBeenCalled();
  });

  it("reports an unavailable original and hides reply actions in archived rooms", async () => {
    queryString = "groupId=1";
    hasNextPage = false;
    messageContent = [message(41, "Reply body", {
      content: "Missing original",
      id: 40,
      sender: { accountId: 20, displayName: "Mentor", role: "MENTOR" },
    })];
    const view = render(<ChatPage />);

    fireEvent.click(screen.getByRole("button", { name: "Go to replied message from Mentor" }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Original message is unavailable."));

    queryString = "groupId=2";
    messageContent = [message(42, "Archived message")];
    view.rerender(<ChatPage />);
    expect(screen.queryByRole("button", { name: /Reply to message from/ })).not.toBeInTheDocument();
  });
});

function message(
  id: number,
  content: string,
  replyTo: ChatMessageDto["replyTo"] = null,
): ChatMessageDto {
  return {
    content,
    createdAt: "2026-10-23T07:00:00Z",
    groupId: 1,
    id,
    replyTo,
    sender: { accountId: 20, displayName: "Mentor", role: "MENTOR" },
  };
}

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatPage } from "./chat-page";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/student/chat",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("groupId=2"),
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
    data: { pages: [{ data: { content: [], hasMore: false, nextBeforeId: null } }] },
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
  it("keeps closed-course history separate and read-only", () => {
    render(<ChatPage />);

    expect(screen.getByText("FA26 · EXE201 · G01")).toBeInTheDocument();
    expect(screen.getByText("SU26 · EXE101 · G01")).toBeInTheDocument();
    expect(screen.getByText("This archived room is read-only.")).toBeInTheDocument();
    expect(screen.getByLabelText("Chat rooms")).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(screen.getByLabelText("Messages")).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(screen.getByLabelText("Conversation")).toHaveClass("h-full", "overflow-hidden");

    fireEvent.click(screen.getByRole("button", { name: /Archived \(1\)/ }));
    expect(screen.getAllByText("Archived Team")).toHaveLength(2);
  });
});

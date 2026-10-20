import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentGroupsPage } from "./student-groups-page";

const mocks = vi.hoisted(() => ({
  cancelJoinRequest: vi.fn(),
  compactLayout: false,
  pendingRequest: {
    courseCode: "EXE101",
    createdAt: "2026-10-20T01:00:00Z",
    groupId: 42,
    groupName: "Spark Team",
    groupNo: "20",
    id: 17,
    message: null,
    respondedAt: null,
    respondedByCode: null,
    respondedById: null,
    respondedByName: null,
    status: "PENDING" as const,
    studentCode: "SE001",
    studentId: 7,
    studentName: "Student One",
    term: "FA26",
    updatedAt: "2026-10-20T01:00:00Z",
  },
}));

vi.mock("@/modules/auth", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ session: { user: { email: "student@example.com" } } }),
}));

vi.mock("../../hooks", () => ({
  useAcceptInvitation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useCancelJoinRequest: () => ({
    isPending: false,
    mutateAsync: mocks.cancelJoinRequest,
  }),
  useCreateGroup: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useCreateJoinRequest: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeclineInvitation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDiscoverGroups: () => ({
    data: {
      pages: [
        {
          data: {
            content: [{ id: 42, name: "Spark Team" }],
          },
        },
      ],
    },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isError: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    isPending: false,
  }),
  useGroup: () => ({ data: undefined, isError: false, isLoading: false }),
  useMyGroups: () => ({ data: { data: [] }, isLoading: false }),
  useMyInvitations: () => ({ data: { data: [] }, isLoading: false }),
  useMyJoinRequests: () => ({ data: { data: [mocks.pendingRequest] } }),
  useRecruitmentRoles: () => ({ data: { data: [] }, isError: false }),
}));

vi.mock("../../stores", () => ({
  resolveActiveGroup: () => null,
  useActiveGroupStore: (selector: (state: unknown) => unknown) =>
    selector({ activeGroupId: null, setActiveGroupId: vi.fn() }),
}));

vi.mock("./active-group-workspace", () => ({
  ActiveGroupWorkspace: () => null,
}));

vi.mock("./discover-group-card", () => ({
  DiscoverGroupCard: ({
    group,
    onClick,
  }: {
    group: { id: number; name: string };
    onClick: (groupId: number) => void;
  }) => <button onClick={() => onClick(group.id)}>Open {group.name}</button>,
}));

vi.mock("./discover-group-detail", () => ({
  DiscoverGroupDetail: ({
    onCancelRequest,
  }: {
    onCancelRequest?: (request: typeof mocks.pendingRequest) => Promise<unknown>;
  }) =>
    onCancelRequest ? (
      <button onClick={() => void onCancelRequest(mocks.pendingRequest)}>
        Cancel request in detail
      </button>
    ) : null,
}));

vi.mock("./group-detail-modal", () => ({
  GroupDetailModal: ({
    onCancelRequest,
  }: {
    onCancelRequest?: (request: typeof mocks.pendingRequest) => Promise<unknown>;
  }) =>
    onCancelRequest ? (
      <button onClick={() => void onCancelRequest(mocks.pendingRequest)}>
        Cancel request in modal
      </button>
    ) : null,
}));

vi.mock("./group-form-modal", () => ({ GroupFormModal: () => null }));
vi.mock("./invitation-list", () => ({ InvitationList: () => null }));
vi.mock("./join-request-section", () => ({ MyJoinRequestsSection: () => null }));

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: mocks.compactLayout,
      media: "(max-width: 1080px)",
      removeEventListener: vi.fn(),
    })),
  });
}

async function confirmCancellation(entryPoint: "detail" | "modal") {
  render(<StudentGroupsPage initialSection="discover" />);
  fireEvent.click(screen.getByRole("button", { name: "Open Spark Team" }));
  fireEvent.click(
    screen.getByRole("button", {
      name:
        entryPoint === "detail"
          ? "Cancel request in detail"
          : "Cancel request in modal",
    }),
  );

  expect(mocks.cancelJoinRequest).not.toHaveBeenCalled();
  expect(
    screen.getByRole("heading", { name: "Cancel join request?" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cancel request" }));

  await waitFor(() =>
    expect(mocks.cancelJoinRequest).toHaveBeenCalledWith({
      groupId: 42,
      requestId: 17,
    }),
  );
}

describe("StudentGroupsPage join-request cancellation", () => {
  beforeEach(() => {
    mocks.cancelJoinRequest.mockReset();
    mocks.cancelJoinRequest.mockResolvedValue(undefined);
    mocks.compactLayout = false;
    installMatchMedia();
    HTMLElement.prototype.scrollTo = vi.fn();
  });

  it("confirms cancellation from the desktop discovery detail", async () => {
    await confirmCancellation("detail");
  });

  it("confirms cancellation from the compact group modal", async () => {
    mocks.compactLayout = true;
    installMatchMedia();

    await confirmCancellation("modal");
  });
});

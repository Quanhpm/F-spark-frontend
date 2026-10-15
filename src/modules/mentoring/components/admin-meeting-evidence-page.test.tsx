import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MentorMeetingDto } from "../types";
import {
  AdminMeetingEvidencePage,
  isSafeEvidenceUrl,
} from "./admin-meeting-evidence-page";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams("groupId=42"),
  useAdminMeetings: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/meeting-evidence",
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock("../hooks", () => ({
  useAdminMeetings: (query: unknown) => mocks.useAdminMeetings(query),
}));

const baseMeeting: MentorMeetingDto = {
  bookedByStudentCode: "SE001",
  bookedByStudentId: 1,
  bookedByStudentName: "Student One",
  cancelReason: null,
  canceledAt: null,
  completedAt: "2026-10-15T03:00:00Z",
  createdAt: "2026-10-15T00:00:00Z",
  endAt: "2026-10-15T03:00:00Z",
  evidenceImageUrl: "https://images.example.com/evidence.png",
  evidenceSubmittedAt: "2026-10-15T03:05:00Z",
  evidenceSubmittedByStudentId: 1,
  evidenceSubmittedByStudentName: "Student One",
  groupId: 42,
  groupName: "Evidence Team",
  groupNo: "12",
  id: 100,
  leaderConfirmedAt: null,
  leaderConfirmedByStudentId: null,
  meetLink: "https://meet.google.com/example",
  mentorCode: "M001",
  mentorConfirmedAt: null,
  mentorId: 5,
  mentorName: "Mentor One",
  note: null,
  slotId: null,
  startAt: "2026-10-15T02:00:00Z",
  status: "COMPLETED",
  updatedAt: "2026-10-15T03:05:00Z",
};

function queryResult(meetings: MentorMeetingDto[]) {
  return {
    data: {
      data: {
        content: meetings,
        hasNext: false,
        hasPrevious: false,
        number: 0,
        numberOfElements: meetings.length,
        page: 0,
        size: 20,
        totalElements: meetings.length,
        totalPages: 1,
      },
    },
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch: vi.fn(),
  };
}

describe("AdminMeetingEvidencePage", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.searchParams = new URLSearchParams("groupId=42");
    mocks.useAdminMeetings.mockReset();
    mocks.useAdminMeetings.mockReturnValue(queryResult([baseMeeting]));
  });

  it("loads the group filter and renders safe evidence links", () => {
    render(<AdminMeetingEvidencePage />);

    expect(mocks.useAdminMeetings).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: 42 }),
    );
    expect(screen.getByText("Filtered to group #42")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "View evidence" });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute(
        "href",
        "https://images.example.com/evidence.png",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    }

    fireEvent.click(screen.getByRole("button", { name: "Clear group filter" }));
    expect(mocks.replace).toHaveBeenCalledWith("/admin/meeting-evidence");
  });

  it("renders missing and unsafe evidence without clickable links", () => {
    mocks.useAdminMeetings.mockReturnValue(
      queryResult([
        { ...baseMeeting, evidenceImageUrl: null, id: 101, status: "SCHEDULED" },
        {
          ...baseMeeting,
          evidenceImageUrl: "javascript:alert(1)",
          id: 102,
        },
      ]),
    );

    render(<AdminMeetingEvidencePage />);

    expect(screen.getAllByText("No evidence submitted")).toHaveLength(2);
    expect(
      screen.getAllByText("Evidence URL cannot be opened safely"),
    ).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "View evidence" })).not.toBeInTheDocument();
  });

  it("applies search and filters and moves through pages", () => {
    mocks.useAdminMeetings.mockReturnValue({
      ...queryResult([baseMeeting]),
      data: {
        data: {
          ...queryResult([baseMeeting]).data.data,
          hasNext: true,
          totalElements: 21,
          totalPages: 2,
        },
      },
    });

    render(<AdminMeetingEvidencePage />);

    fireEvent.change(screen.getByLabelText("Meeting status"), {
      target: { value: "COMPLETED" },
    });
    fireEvent.change(screen.getByLabelText("Evidence status"), {
      target: { value: "SUBMITTED" },
    });
    fireEvent.change(screen.getByLabelText("Search meetings"), {
      target: { value: "  Team  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(mocks.useAdminMeetings).toHaveBeenLastCalledWith(
      expect.objectContaining({
        evidence: "SUBMITTED",
        groupId: 42,
        page: 0,
        search: "Team",
        status: "COMPLETED",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.useAdminMeetings).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 }),
    );
  });

  it("renders loading, empty, and retryable error states", () => {
    mocks.useAdminMeetings.mockReturnValue({
      ...queryResult([]),
      isLoading: true,
    });
    const { rerender } = render(<AdminMeetingEvidencePage />);
    expect(screen.getByText("Loading meeting evidence")).toBeInTheDocument();

    mocks.useAdminMeetings.mockReturnValue(queryResult([]));
    rerender(<AdminMeetingEvidencePage />);
    expect(screen.getByText("No meetings found")).toBeInTheDocument();

    const refetch = vi.fn();
    mocks.useAdminMeetings.mockReturnValue({
      ...queryResult([]),
      error: new Error("Network failure"),
      isError: true,
      isLoading: false,
      refetch,
    });
    rerender(<AdminMeetingEvidencePage />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});

describe("isSafeEvidenceUrl", () => {
  it("only accepts HTTP and HTTPS URLs", () => {
    expect(isSafeEvidenceUrl("https://example.com/evidence.png")).toBe(true);
    expect(isSafeEvidenceUrl("http://example.com/evidence.png")).toBe(true);
    expect(isSafeEvidenceUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeEvidenceUrl("not-a-url")).toBe(false);
    expect(isSafeEvidenceUrl(null)).toBe(false);
  });
});

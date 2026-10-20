import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GroupDetailDto } from "../../types";
import { MeetingBookingSection } from "./meeting-booking-section";

const mocks = vi.hoisted(() => ({
  bookMeeting: vi.fn(),
  deleteEvidence: vi.fn(),
  meetings: [] as Array<Record<string, unknown>>,
  refetchAvailability: vi.fn(),
  refetchMeetings: vi.fn(),
}));

vi.mock("@/modules/mentoring", () => ({
  MeetingConfirmationStatus: () => <div>Confirmation status</div>,
  formatMentorIdentity: ({
    mentorCode,
    mentorName,
  }: {
    mentorCode?: string | null;
    mentorName?: string | null;
  }) =>
    [mentorName?.trim(), mentorCode?.trim()].filter(Boolean).join(" · ") ||
    "Unknown mentor",
  getMeetingDisplayStatus: ({ status }: { status: string }) => status,
  useBookMeeting: () => ({
    isPending: false,
    mutateAsync: mocks.bookMeeting,
  }),
  useGroupMeetings: () => ({
    data: {
      data: mocks.meetings,
    },
    isError: false,
    isLoading: false,
    refetch: mocks.refetchMeetings,
  }),
  useMentorAvailabilityForGroup: () => ({
    data: {
      data: [
        {
          endAt: "2026-10-14T11:30:00Z",
          id: 1,
          mentorCode: "M001",
          mentorId: 1,
          mentorName: "Mentor One",
          meetLink: "https://meet.google.com/abc-defg-hij",
          note: "Bookable",
          startAt: "2026-10-14T09:15:00Z",
          status: "AVAILABLE",
        },
        {
          endAt: "2026-10-14T11:30:00Z",
          id: 2,
          mentorCode: "M002",
          mentorId: 2,
          mentorName: "Mentor Two",
          meetLink: "https://meet.google.com/def-ghij-klm",
          note: "Also bookable",
          startAt: "2026-10-14T09:15:00Z",
          status: "AVAILABLE",
        },
        {
          endAt: "2026-10-14T11:29:59Z",
          id: 3,
          mentorCode: "M001",
          mentorId: 1,
          mentorName: "Mentor One",
          meetLink: "https://meet.google.com/abc-defg-hij",
          note: "Closed",
          startAt: "2026-10-14T09:14:59Z",
          status: "AVAILABLE",
        },
      ],
    },
    isError: false,
    isLoading: false,
    refetch: mocks.refetchAvailability,
  }),
  useSubmitMeetingEvidence: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useDeleteMeetingEvidence: () => ({
    isPending: false,
    mutateAsync: mocks.deleteEvidence,
  }),
}));

vi.mock("@/shared/components", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({
    description,
    title,
  }: {
    description?: string;
    title: string;
  }) => (
    <header>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  ),
  EmptyState: ({
    description,
    title,
  }: {
    description?: string;
    title: string;
  }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
  LoadingState: ({ title }: { title: string }) => <div>{title}</div>,
  ResponsiveDialog: ({
    children,
    description,
    footer,
    title,
  }: {
    children: React.ReactNode;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    title: string;
  }) => (
    <div>
      <h2>{title}</h2>
      <div>{description}</div>
      {children}
      {footer}
    </div>
  ),
  TextInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock("@/shared/lib", () => ({
  ApiError: class ApiError extends Error {
    status = 400;
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("MeetingBookingSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T03:15:00Z"));
    mocks.meetings = [
      {
        endAt: "2026-10-13T04:15:00Z",
        id: 20,
        mentorCode: "M002",
        mentorId: 2,
        mentorName: "Mentor Two",
        note: "Previously booked",
        startAt: "2026-10-13T02:00:00Z",
        status: "CANCELED",
      },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("keeps late slots visible but disables booking with a six-hour message", () => {
    const group = {
      id: 10,
      mentor: {
        email: "mentor.one@example.com",
        fullName: "Mentor One",
      },
      name: "Team Alpha",
      studentReadOnly: false,
    } as GroupDetailDto;

    render(<MeetingBookingSection canBook group={group} />);

    expect(
      screen.getByText(
        "Assigned mentors: Mentor One (mentor.one@example.com)",
      ),
    ).toBeInTheDocument();

    expect(screen.getAllByText("Mentor: Mentor One · M001")).toHaveLength(2);
    expect(screen.getAllByText("Mentor: Mentor Two · M002")).toHaveLength(2);

    const bookingButtons = screen.getAllByRole("button", {
      name: "Book this slot",
    });
    expect(bookingButtons).toHaveLength(2);
    expect(bookingButtons[0]).toBeEnabled();
    expect(bookingButtons[1]).toBeEnabled();
    expect(screen.getByRole("button", { name: "Booking closed" })).toBeDisabled();
    expect(
      screen.getByText(
        "This slot must be booked at least 6 hours before it starts.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(bookingButtons[0]);

    expect(
      screen.getByRole("heading", { name: "Book this mentor slot?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mentor One · M001")).toBeInTheDocument();
    expect(
      screen.getByText(
        "After confirming this booking, students cannot cancel or reschedule it themselves. Please contact the mentor if you need help changing the meeting time.",
      ),
    ).toBeInTheDocument();
  });

  it("cancels or confirms from the booking dialog without changing the booking flow", async () => {
    mocks.bookMeeting.mockResolvedValue({ data: { id: 30 } });
    const group = {
      id: 10,
      mentor: {
        email: "mentor.one@example.com",
        fullName: "Mentor One",
      },
      name: "Team Alpha",
      studentReadOnly: false,
    } as GroupDetailDto;

    render(<MeetingBookingSection canBook group={group} />);

    const bookingButtons = screen.getAllByRole("button", {
      name: "Book this slot",
    });
    fireEvent.click(bookingButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.bookMeeting).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Book this mentor slot?" }),
    ).not.toBeInTheDocument();

    fireEvent.click(bookingButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    expect(mocks.bookMeeting).toHaveBeenCalledWith({
      groupId: 10,
      slotId: 1,
    });
  });

  it("lets the original submitter remove completed evidence for replacement", () => {
    mocks.meetings = [
      {
        endAt: "2026-10-13T04:15:00Z",
        evidenceImageUrl: "https://images.example.com/wrong.png",
        evidenceSubmittedAt: "2026-10-13T04:20:00Z",
        evidenceSubmittedByStudentId: 7,
        evidenceSubmittedByStudentName: "Student One",
        completedAt: "2026-10-13T04:21:00Z",
        id: 21,
        mentorCode: "M001",
        mentorConfirmedAt: "2026-10-13T04:19:00Z",
        mentorId: 1,
        mentorName: "Mentor One",
        note: null,
        startAt: "2026-10-13T02:00:00Z",
        status: "COMPLETED",
      },
    ];
    const group = {
      id: 10,
      leader: { id: 8 },
      members: [
        {
          email: "student@example.com",
          fullName: "Student One",
          role: "MEMBER",
          studentCode: "S001",
          studentId: 7,
        },
      ],
      mentor: { email: "mentor@example.com", fullName: "Mentor One" },
      name: "Team Alpha",
      studentReadOnly: false,
    } as GroupDetailDto;

    render(
      <MeetingBookingSection
        canBook={false}
        group={group}
        sessionEmail="student@example.com"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete evidence" }));
    expect(
      screen.getByText(/meeting will return to awaiting evidence/i),
    ).toBeInTheDocument();
    const deleteButtons = screen.getAllByRole("button", { name: "Delete evidence" });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    expect(mocks.deleteEvidence).toHaveBeenCalledWith({
      groupId: 10,
      meetingId: 21,
    });
  });
});

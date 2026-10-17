import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MentorMeetingDto } from "../types";
import { MentorMeetingsPage } from "./mentor-meetings-page";

const meetings: MentorMeetingDto[] = [
  {
    bookedByStudentCode: "SE001",
    bookedByStudentId: 1,
    bookedByStudentName: "Student One",
    cancelReason: null,
    canceledAt: null,
    completedAt: null,
    createdAt: "2026-10-15T01:00:00Z",
    endAt: "2026-10-15T04:15:00Z",
    evidenceImageUrl: null,
    evidenceSubmittedAt: null,
    evidenceSubmittedByStudentId: null,
    evidenceSubmittedByStudentName: null,
    groupId: 42,
    groupName: "Two Mentor Team",
    groupNo: "20",
    id: 100,
    leaderConfirmedAt: null,
    leaderConfirmedByStudentId: null,
    meetLink: "https://meet.google.com/abc-defg-hij",
    mentorCode: "M001",
    mentorConfirmedAt: "2026-10-15T04:30:00Z",
    mentorId: 5,
    mentorName: "Mentor One",
    note: "First owner",
    slotId: 99,
    startAt: "2026-10-15T02:00:00Z",
    status: "SCHEDULED",
    updatedAt: "2026-10-15T01:00:00Z",
  },
  {
    bookedByStudentCode: "SE001",
    bookedByStudentId: 1,
    bookedByStudentName: "Student One",
    cancelReason: null,
    canceledAt: null,
    completedAt: null,
    createdAt: "2026-10-16T01:00:00Z",
    endAt: "2026-10-16T04:15:00Z",
    evidenceImageUrl: null,
    evidenceSubmittedAt: null,
    evidenceSubmittedByStudentId: null,
    evidenceSubmittedByStudentName: null,
    groupId: 42,
    groupName: "Two Mentor Team",
    groupNo: "20",
    id: 101,
    leaderConfirmedAt: null,
    leaderConfirmedByStudentId: null,
    meetLink: "https://meet.google.com/def-ghij-klm",
    mentorCode: "M002",
    mentorConfirmedAt: null,
    mentorId: 6,
    mentorName: "Mentor Two",
    note: "Second owner",
    slotId: 100,
    startAt: "2026-10-16T02:00:00Z",
    status: "SCHEDULED",
    updatedAt: "2026-10-16T01:00:00Z",
  },
];

vi.mock("@/modules/groups", () => ({
  isMeetingOwnedByCurrentMentor: (_group: unknown, mentorId: number) => mentorId === 5,
  useMentorGroups: () => ({
    data: {
      data: [
        {
          courseCode: "EXE101",
          groupNo: "20",
          id: 42,
          name: "Two Mentor Team",
          term: "FA26",
        },
      ],
    },
    isError: false,
    isLoading: false,
  }),
}));

vi.mock("@/modules/auth", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ session: { user: { email: "mentor.one@example.com", id: 50 } } }),
}));

vi.mock("../hooks", () => ({
  useCancelMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useConfirmMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useCreateMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useExportMentorMeetingReport: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useMentorReportTerms: () => ({
    data: { data: [] },
    isError: false,
    isLoading: false,
  }),
  useMyMeetings: () => ({
    data: { data: meetings },
    isError: false,
    isLoading: false,
  }),
  useReopenMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUndoMeetingConfirmation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/shared/components", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({
    children,
    disabled,
    form,
    onClick,
    type,
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
  }) => (
    <button disabled={disabled} form={form} onClick={onClick} type={type}>
      {children}
    </button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({
    actions,
    description,
    title,
  }: {
    actions?: React.ReactNode;
    description?: React.ReactNode;
    title: React.ReactNode;
  }) => (
    <header>
      <h2>{title}</h2>
      <div>{description}</div>
      {actions}
    </header>
  ),
  DateTimeInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  LoadingState: ({ title }: { title: string }) => <div>{title}</div>,
  PageHeader: ({
    actions,
    title,
  }: {
    actions?: React.ReactNode;
    title: string;
  }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
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
    <section role="dialog">
      <h2>{title}</h2>
      <div>{description}</div>
      {children}
      {footer}
    </section>
  ),
  Select: ({
    children,
    ...props
  }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props}>{children}</select>
  ),
  TextInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

describe("MentorMeetingsPage", () => {
  it("shows the owner for meetings from both assigned mentors", () => {
    render(<MentorMeetingsPage />);

    expect(screen.getByText("Mentor: Mentor One · M001")).toBeInTheDocument();
    expect(screen.getByText("Mentor: Mentor Two · M002")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo confirmation" })).toBeInTheDocument();
  });

  it("repeats the meeting owner in the edit dialog", () => {
    render(<MentorMeetingsPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Mentor: Mentor One · M001",
    );
  });
});

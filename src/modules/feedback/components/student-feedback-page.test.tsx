import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TermFeedbackDto } from "../types";
import { StudentFeedbackPage } from "./student-feedback-page";

const mocks = vi.hoisted(() => ({
  items: [] as TermFeedbackDto[],
}));

vi.mock("../hooks", () => ({
  useMyFeedback: () => ({ data: { data: mocks.items }, isError: false, isLoading: false }),
  useSubmitFeedback: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

function feedback(overrides: Partial<TermFeedbackDto>): TermFeedbackDto {
  return {
    academicTermCode: "FA26",
    academicTermId: 1,
    academicTermStatus: "OPEN",
    comment: null,
    feedbackOpen: true,
    groupId: 10,
    groupName: "Attendance Test",
    id: 1,
    instructorId: null,
    instructorName: null,
    mentorId: 5,
    mentorName: "Mentor One",
    rating: null,
    status: "PENDING",
    studentCode: "SE001",
    studentId: 2,
    studentName: "Student One",
    submittedAt: null,
    targetType: "MENTOR",
    version: 0,
    ...overrides,
  };
}

describe("StudentFeedbackPage", () => {
  beforeEach(() => {
    mocks.items = [];
  });

  it("lets students submit while feedback is open, even if the term is still open", () => {
    mocks.items = [feedback({ academicTermStatus: "OPEN", feedbackOpen: true })];
    render(<StudentFeedbackPage />);

    expect(screen.getByRole("button", { name: "Submit feedback" })).toBeTruthy();
    expect(screen.queryByText(/Feedback is closed for this term/)).toBeNull();
  });

  it("shows feedback as read-only once an admin closes it", () => {
    mocks.items = [
      feedback({ academicTermStatus: "CLOSED", comment: "Great", feedbackOpen: false, rating: 5, status: "SUBMITTED" }),
    ];
    render(<StudentFeedbackPage />);

    expect(screen.queryByRole("button", { name: /Submit feedback|Update feedback/ })).toBeNull();
    expect(screen.getByText(/Feedback is closed for this term/)).toBeTruthy();
    expect(screen.getByText("Great")).toBeTruthy();
  });
});

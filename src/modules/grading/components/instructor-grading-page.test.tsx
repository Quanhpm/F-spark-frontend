import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InstructorGradingPage } from "./instructor-grading-page";

const mocks = vi.hoisted(() => ({ reopened: [] as string[], closed: false, dashboardQueries: [] as unknown[], exported: [] as unknown[] }));

function status(archived: boolean, term: string) {
  return {
    archived,
    contributionsComplete: true,
    deadlineAt: null,
    gradeComplete: true,
    graded: true,
    groupId: archived ? 2 : 1,
    groupName: archived ? "Old group" : "Open group",
    groupNo: "1",
    late: false,
    maxScoreSnapshot: 10,
    milestoneId: archived ? 20 : 10,
    milestoneTitle: "Checkpoint 4",
    moderatedScore: archived ? 8 : null,
    score: 10,
    submissionStatus: null,
    submitted: false,
    submittedAt: null,
    term,
    termClosed: archived,
  };
}

vi.mock("../hooks", () => ({
  useArchivedGradeTerms: () => ({ data: { data: ["SU26"] } }),
  useExportGrades: () => ({ isPending: false, mutate: (query: unknown) => mocks.exported.push(query) }),
  useGradeGroup: () => ({ isPending: false, mutate: vi.fn() }),
  useReopenContributions: () => ({ isPending: false, mutate: (reason: string) => mocks.reopened.push(reason) }),
  useGroupGradeMatrix: () => ({
    data: {
      data: {
        attendanceWeight: 0,
        members: [],
        milestones: [
          {
            approvedCount: 1,
            contributionAgreementStatus: "AGREED",
            contributionsComplete: true,
            groupGrade: { feedback: null, score: 10 },
            maxScore: 10,
            milestoneId: 20,
            moderated: true,
            moderatedGroupScore: 8,
            requiredCount: 1,
          },
          {
            approvedCount: 1,
            contributionAgreementStatus: "AGREED",
            contributionsComplete: true,
            groupGrade: { feedback: null, score: 10 },
            maxScore: 10,
            graded: true,
            lastReopen: null,
            milestoneId: 10,
            moderated: false,
            moderatedGroupScore: null,
            requiredCount: 1,
          },
        ],
        moderation: { type: "PERCENT", value: 80 },
      },
    },
    isLoading: false,
  }),
}));

vi.mock("@/modules/dashboards", () => ({
  useInstructorMilestoneDashboard: (query: { term?: string }) => {
    mocks.dashboardQueries.push(query);
    return {
      data: { data: query.term === "SU26" ? [status(true, "SU26")] : [{ ...status(false, "FA26"), termClosed: mocks.closed }] },
      isLoading: false,
    };
  },
}));

vi.mock("@/modules/groups", () => ({
  useInstructorGroups: () => ({ data: { data: [{ courseCode: "EXE101", term: "FA26" }] } }),
}));

describe("InstructorGradingPage", () => {
  beforeEach(() => {
    mocks.closed = false;
    mocks.reopened = [];
    mocks.exported = [];
  });

  it("grades groups of open terms", () => {
    render(<InstructorGradingPage />);
    expect(screen.queryByText("Archived")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Grade" }));
    expect(screen.getByRole("button", { name: "Save Grade" })).toBeEnabled();
  });

  it("reopens contributions only with a reason", () => {
    render(<InstructorGradingPage />);
    fireEvent.click(screen.getByRole("button", { name: "Grade" }));
    fireEvent.click(screen.getByRole("button", { name: "Reopen contributions" }));
    const confirm = screen.getByRole("button", { name: "Remove grade and reopen" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reason for reopening"), { target: { value: "Split was wrong" } });
    fireEvent.click(confirm);
    expect(mocks.reopened).toEqual(["Split was wrong"]);
  });

  it("locks grading once the term is closed, before it is archived", () => {
    mocks.closed = true;
    render(<InstructorGradingPage />);
    expect(screen.getByText("Term closed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Grade" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(screen.queryByRole("button", { name: "Save Grade" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reopen contributions" })).not.toBeInTheDocument();
  });

  it("shows an archived term read-only and exports it", () => {
    render(<InstructorGradingPage />);
    fireEvent.change(screen.getByLabelText("Academic Term"), { target: { value: "SU26" } });

    expect(screen.getByText("Old group")).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.getByText("After 8/10")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Grade" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Export Excel" }));
    expect(mocks.exported).toEqual([{ courseCode: undefined, term: "SU26" }]);

    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(screen.getByText(/This term is closed/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save Grade" })).not.toBeInTheDocument();
  });
});

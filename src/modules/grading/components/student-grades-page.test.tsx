import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GroupGradeMatrixDto } from "../types";
import { StudentGradesPage } from "./student-grades-page";

// A matrix that still carries every score: the page must not show any of them, even if the API did.
const matrix: GroupGradeMatrixDto = {
  attendanceWeight: 15,
  complete: true,
  courseCode: "EXE101",
  groupId: 7,
  groupName: "Alpha",
  groupNo: "G7",
  members: [
    {
      attendanceScore: 7.77,
      complete: true,
      fapClassCode: "IA1901",
      milestoneScores: [
        {
          agreementDecision: "AGREE",
          agreementReason: null,
          agreementRespondedAt: null,
          calculatedScore: 6.66,
          complete: true,
          contributionPercent: 90,
          milestoneId: 1,
          moderatedScore: 5.55,
        },
      ],
      studentCode: "SE1",
      studentId: 11,
      studentName: "Student One",
      totalScore: 8.88,
    },
  ],
  milestones: [
    {
      approvedCount: 1,
      contributionAgreementStatus: "AGREED",
      contributionRevision: 1,
      contributionsComplete: true,
      gradeComplete: true,
      graded: true,
      groupGrade: {
        contributionsComplete: true,
        feedback: "Secret feedback",
        gradeComplete: true,
        gradedAt: "2026-11-20T00:00:00Z",
        groupId: 7,
        id: 3,
        instructorId: 5,
        maxScoreSnapshot: 10,
        milestoneId: 1,
        score: 9.99,
        weightSnapshot: 10,
      },
      maxScore: 10,
      milestoneId: 1,
      moderated: true,
      moderatedGroupScore: 4.44,
      requiredCount: 1,
      title: "Checkpoint 1",
      weight: 10,
    },
  ],
  moderation: { type: "PERCENT", value: 33.33 },
  term: "FA26",
};

vi.mock("../hooks", () => ({
  useGroupGradeMatrix: () => ({ data: { data: matrix }, isLoading: false }),
  useRespondToContributions: () => ({ isPending: false, mutate: vi.fn() }),
  useUpdateContributions: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock("@/modules/auth", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ session: { user: { email: "se1@fpt.edu.vn" } } }),
}));

vi.mock("@/modules/groups", () => ({
  resolveActiveGroup: (groups: unknown[]) => groups[0] ?? null,
  useActiveGroupStore: (selector: (state: unknown) => unknown) =>
    selector({ activeGroupId: 7, setActiveGroupId: vi.fn() }),
}));

vi.mock("@/modules/milestones", () => ({
  useGroupMilestones: () => ({ data: { data: [] }, isError: false, isLoading: false }),
}));

vi.mock("@/modules/projects/hooks", () => ({
  useGroupDetails: () => ({
    data: {
      data: {
        courseCode: "EXE101",
        id: 7,
        leader: { email: "se1@fpt.edu.vn", id: 11 },
        members: [{ email: "se1@fpt.edu.vn", studentId: 11 }],
        name: "Alpha",
        projectName: "Alpha project",
        studentReadOnly: false,
        term: "FA26",
      },
    },
    isLoading: false,
  }),
  useMyGroups: () => ({
    data: { data: [{ groupNo: "G7", id: 7, name: "Alpha", term: "FA26" }] },
    isLoading: false,
  }),
}));

function expectNoScores() {
  const text = document.body.textContent ?? "";
  for (const hidden of ["9.99", "8.88", "8.9", "7.77", "6.66", "5.55", "4.44", "33.33", "Secret feedback", "My Total Grade", "Group grade"]) {
    expect(text).not.toContain(hidden);
  }
}

describe("StudentGradesPage", () => {
  it("shows milestones and contributions but never the scores or feedback", () => {
    render(<StudentGradesPage />);

    expect(screen.getByText("Checkpoint 1")).toBeInTheDocument();
    expect(screen.getByText("Graded")).toBeInTheDocument();
    expectNoScores();

    fireEvent.click(screen.getByText("View details"));

    expect(screen.getByText("My contribution")).toBeInTheDocument();
    expect(screen.getAllByText("90%").length).toBeGreaterThan(0);
    expectNoScores();
  });
});

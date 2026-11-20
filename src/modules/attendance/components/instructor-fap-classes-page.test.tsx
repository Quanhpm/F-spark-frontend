import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FapClassOverviewDto, FapCourseOptionDto } from "../types";
import { InstructorFapClassesPage, parseAttendanceScore } from "./instructor-fap-classes-page";

const mocks = vi.hoisted(() => ({
  courses: [] as FapCourseOptionDto[],
  overview: null as FapClassOverviewDto | null,
  saved: [] as unknown[],
}));

vi.mock("../hooks", () => ({
  useImportAttendanceScores: () => ({ isPending: false, mutateAsync: () => Promise.resolve({ data: { errors: [], totalRows: 0, updated: 0 } }) }),
  useMyFapClasses: () => ({ data: mocks.overview ? { data: mocks.overview } : undefined, isError: false, isLoading: false }),
  useMyFapCourses: () => ({ data: { data: mocks.courses }, isError: false, isLoading: false }),
  useSaveAttendanceScores: () => ({
    isPending: false,
    mutateAsync: (payload: unknown) => {
      mocks.saved.push(payload);
      return Promise.resolve({ data: mocks.overview });
    },
  }),
}));

function overview(editable: boolean): FapClassOverviewDto {
  return {
    attendanceWeight: 15,
    classes: [
      {
        classCode: "IA1901-AS",
        students: [
          { attendanceScore: 8, gradedAt: null, groupInstructorName: "Thầy Huy", groupName: "W.A.R.D.E.N", studentCode: "SE183415", studentId: 1, studentName: "Trịnh Gia Huy" },
          { attendanceScore: null, gradedAt: null, groupInstructorName: null, groupName: "Velix", studentCode: "SE184082", studentId: 2, studentName: "Phạm Nguyễn Quang Minh" },
        ],
      },
      {
        classCode: "SE1905-NET",
        students: [
          { attendanceScore: 9, gradedAt: null, groupInstructorName: null, groupName: "Velix", studentCode: "SE190268", studentId: 3, studentName: "Lê Cao Duy Anh" },
        ],
      },
    ],
    courseCode: "EXE101",
    editable,
    term: "FA26",
  };
}

describe("parseAttendanceScore", () => {
  it("accepts 0-10 with a comma or dot and clears on blank", () => {
    expect(parseAttendanceScore("7,5")).toBe(7.5);
    expect(parseAttendanceScore(" 10 ")).toBe(10);
    expect(parseAttendanceScore("")).toBeNull();
    expect(parseAttendanceScore("11")).toBeUndefined();
    expect(parseAttendanceScore("-1")).toBeUndefined();
    expect(parseAttendanceScore("abc")).toBeUndefined();
  });
});

describe("InstructorFapClassesPage", () => {
  beforeEach(() => {
    mocks.courses = [{ attendanceWeight: 15, courseCode: "EXE101", studentCount: 3, term: "FA26", termOpen: true }];
    mocks.overview = overview(true);
    mocks.saved = [];
  });

  it("explains when the instructor has no FAP class to grade", () => {
    mocks.courses = [];
    render(<InstructorFapClassesPage />);
    expect(screen.getByText("No FAP classes to grade")).toBeInTheDocument();
  });

  it("lists one FAP class at a time and saves only changed scores", async () => {
    render(<InstructorFapClassesPage />);

    expect(screen.getByText("SE183415")).toBeInTheDocument();
    expect(screen.queryByText("SE190268")).not.toBeInTheDocument();
    expect(screen.getByText("Graded by Thầy Huy")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Attendance score for SE184082"), { target: { value: "6,5" } });
    fireEvent.click(screen.getByRole("button", { name: /Save \(1\)/ }));
    await screen.findByText("SE183415");
    expect(mocks.saved).toEqual([{ courseCode: "EXE101", scores: [{ score: 6.5, studentId: 2 }], term: "FA26" }]);

    fireEvent.click(screen.getByRole("tab", { name: /SE1905-NET/ }));
    expect(screen.getByText("SE190268")).toBeInTheDocument();
  });

  it("keeps closed terms read-only", () => {
    mocks.overview = overview(false);
    render(<InstructorFapClassesPage />);
    expect(screen.getByText(/This term is closed/)).toBeInTheDocument();
    expect(screen.getByLabelText("Attendance score for SE183415")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Import/ })).toBeDisabled();
  });
});

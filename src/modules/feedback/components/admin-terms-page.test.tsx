import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AcademicTermResponseDto } from "../types";
import { AdminTermsPage } from "./admin-terms-page";

const mocks = vi.hoisted(() => ({
  idleMutation: () => ({ isPending: false, mutateAsync: () => Promise.resolve() }),
  terms: [] as AcademicTermResponseDto[],
}));

vi.mock("../hooks", () => ({
  useAcademicTerms: () => ({
    data: {
      data: {
        content: mocks.terms,
        hasNext: false,
        hasPrevious: false,
        page: 0,
        totalElements: mocks.terms.length,
        totalPages: 1,
      },
    },
    isError: false,
    isLoading: false,
  }),
  useArchiveTermStudents: mocks.idleMutation,
  useAvailableAcademicTerms: () => ({ data: { data: [] }, isLoading: false }),
  useCloseAcademicTerm: mocks.idleMutation,
  useCloseTermFeedback: mocks.idleMutation,
  useCreateAcademicTerm: mocks.idleMutation,
  useDeleteEmptyAcademicTerm: mocks.idleMutation,
  useOpenTermFeedback: mocks.idleMutation,
}));

function term(overrides: Partial<AcademicTermResponseDto>): AcademicTermResponseDto {
  return {
    closedAt: null,
    closedByEmail: null,
    code: "FA26",
    feedbackOpen: true,
    feedbackOpenedAt: "2026-11-18T07:00:00Z",
    feedbackOpenedByEmail: "admin@example.com",
    feedbackSyncCreatedCount: null,
    feedbackSyncError: null,
    feedbackSyncFinishedAt: null,
    feedbackSyncStartedAt: "2026-11-18T07:00:00Z",
    feedbackSyncStatus: null,
    groupCount: 3,
    id: 1,
    status: "OPEN",
    totalExpectedFeedbacks: 0,
    totalSubmittedFeedbacks: 0,
    ...overrides,
  };
}

describe("AdminTermsPage feedback generation status", () => {
  beforeEach(() => {
    mocks.terms = [];
  });

  it("shows progress and blocks a second run while forms are being generated", () => {
    mocks.terms = [term({ feedbackSyncStatus: "RUNNING" })];
    render(<AdminTermsPage />);

    expect(screen.getAllByText("Generating feedback forms...").length).toBeGreaterThan(0);
    for (const button of screen.getAllByRole("button", { name: /Generating forms/ })) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
    // Closing mid-run would let the job announce feedback that is already closed.
    const closeButtons = screen.getAllByRole("button", { name: /Close feedback/ });
    expect(closeButtons.length).toBeGreaterThan(0);
    for (const button of closeButtons) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it("shows the error and a retry button when generation failed", () => {
    mocks.terms = [term({ feedbackSyncError: "Database timeout", feedbackSyncStatus: "FAILED" })];
    render(<AdminTermsPage />);

    expect(screen.getAllByText(/Generating forms failed: Database timeout/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Retry generating forms/ }).length).toBeGreaterThan(0);
  });

  it("reports how many forms the last run added", () => {
    mocks.terms = [term({ feedbackSyncCreatedCount: 1823, feedbackSyncStatus: "SUCCEEDED" })];
    render(<AdminTermsPage />);

    expect(screen.getAllByText(/Last run added 1823 forms/).length).toBeGreaterThan(0);
  });
});

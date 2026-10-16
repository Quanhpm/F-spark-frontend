import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/lib";

import { AdminUsersPage } from "./admin-users-page";

const mocks = vi.hoisted(() => ({
  exportUsers: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../hooks/use-admin-user", () => ({
  useAdminUser: () => ({ data: undefined, error: null, isError: false, isLoading: false }),
}));

vi.mock("../hooks/use-admin-users", () => ({
  useAdminUsers: () => ({
    data: {
      data: {
        content: [],
        hasNext: false,
        hasPrevious: false,
        number: 0,
        numberOfElements: 0,
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
    },
    error: null,
    isError: false,
    isLoading: false,
  }),
  useExportAdminUsers: () => ({ mutateAsync: mocks.exportUsers }),
}));

vi.mock("../hooks/use-user-mutations", () => ({
  useCreateAdminUser: () => ({ mutateAsync: vi.fn() }),
  useDeleteAdminUser: () => ({ mutateAsync: vi.fn() }),
  useResetUserPassword: () => ({ mutateAsync: vi.fn() }),
  useUpdateAdminUser: () => ({ mutateAsync: vi.fn() }),
}));

describe("AdminUsersPage export", () => {
  beforeEach(() => {
    mocks.exportUsers.mockReset();
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: vi.fn(() => "blob:user-export"),
      },
      revokeObjectURL: {
        configurable: true,
        value: vi.fn(),
      },
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires an exportable role and downloads the selected role and status", async () => {
    const user = userEvent.setup();
    mocks.exportUsers.mockResolvedValue(new Blob(["csv"]));
    render(<AdminUsersPage />);

    await user.click(screen.getByRole("button", { name: "Export users" }));

    const dialog = screen.getByRole("dialog", { name: "Export users" });
    expect(
      within(dialog).getByText(
        /student, mentor, or instructor code, full name, email, and last login time/i,
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("option", { name: "Admin" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Export CSV" })).toBeDisabled();
    expect(within(dialog).getByRole("option", { name: "All statuses" })).toBeInTheDocument();

    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: /Role/ }),
      "MENTOR",
    );
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "Status" }),
      "ACTIVE",
    );
    await user.click(within(dialog).getByRole("button", { name: "Export CSV" }));

    expect(mocks.exportUsers).toHaveBeenCalledWith({
      role: "MENTOR",
      status: "ACTIVE",
    });
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:user-export");
    expect(toast.success).toHaveBeenCalledWith("User CSV downloaded.");
    expect(screen.queryByRole("dialog", { name: "Export users" })).not.toBeInTheDocument();
  });

  it("keeps the dialog open and shows the backend error when export fails", async () => {
    const user = userEvent.setup();
    mocks.exportUsers.mockRejectedValue(
      new ApiError("User export is temporarily unavailable", 500),
    );
    render(<AdminUsersPage />);

    await user.click(screen.getByRole("button", { name: "Export users" }));
    const dialog = screen.getByRole("dialog", { name: "Export users" });
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: /Role/ }),
      "STUDENT",
    );
    await user.click(within(dialog).getByRole("button", { name: "Export CSV" }));

    expect(mocks.exportUsers).toHaveBeenCalledWith({
      role: "STUDENT",
      status: undefined,
    });
    expect(toast.error).toHaveBeenCalledWith(
      "User export is temporarily unavailable",
    );
    expect(screen.getByRole("dialog", { name: "Export users" })).toBeInTheDocument();
  });
});

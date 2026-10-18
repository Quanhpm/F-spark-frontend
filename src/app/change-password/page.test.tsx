import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChangePasswordPage from "./page";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/modules/auth", () => ({
  useAuthHydrated: () => true,
  useAuthStore: (
    selector: (state: {
      session: {
        user: {
          mustChangePassword: boolean;
          role: "STUDENT";
        };
      };
    }) => unknown,
  ) =>
    selector({
      session: {
        user: {
          mustChangePassword: true,
          role: "STUDENT",
        },
      },
    }),
}));

vi.mock("@/modules/users/hooks/use-profile", () => ({
  useChangeMyPassword: () => ({
    isPending: false,
    mutate: mocks.mutate,
  }),
}));

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets the user reveal and hide each password independently", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordPage />);

    const currentPassword = screen.getByLabelText(/^Current password/);
    const newPassword = screen.getByLabelText(/^New password/);
    const confirmPassword = screen.getByLabelText(/^Confirm new password/);

    expect(currentPassword).toHaveAttribute("type", "password");
    expect(newPassword).toHaveAttribute("type", "password");
    expect(confirmPassword).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: "Show current password" }),
    );

    expect(currentPassword).toHaveAttribute("type", "text");
    expect(newPassword).toHaveAttribute("type", "password");
    expect(confirmPassword).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: "Show new password" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Show confirm new password" }),
    );

    expect(currentPassword).toHaveAttribute("type", "text");
    expect(newPassword).toHaveAttribute("type", "text");
    expect(confirmPassword).toHaveAttribute("type", "text");

    await user.click(
      screen.getByRole("button", { name: "Hide current password" }),
    );

    expect(currentPassword).toHaveAttribute("type", "password");
    expect(newPassword).toHaveAttribute("type", "text");
    expect(confirmPassword).toHaveAttribute("type", "text");
  });
});

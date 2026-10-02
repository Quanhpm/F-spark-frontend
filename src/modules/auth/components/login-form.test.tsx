import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "../types/auth.types";
import { LoginForm } from "./login-form";
import { GoogleSignInButton } from "./google-sign-in-button";

const mocks = vi.hoisted(() => ({
  googleLogin: vi.fn(),
  login: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("../hooks/use-login", () => ({
  useLogin: () => ({ isPending: false, mutateAsync: mocks.login }),
}));

vi.mock("../hooks/use-google-login", () => ({
  useGoogleLogin: () => ({ isPending: false, mutateAsync: mocks.googleLogin }),
}));

vi.mock("./google-sign-in-button", () => ({
  GoogleSignInButton: ({
    disabled,
    onCredential,
  }: ComponentProps<typeof GoogleSignInButton>) => (
    <button
      disabled={disabled}
      onClick={() => onCredential("google-id-token")}
      type="button"
    >
      Continue with Google
    </button>
  ),
}));

function session(role: AuthSession["user"]["role"]): AuthSession {
  return {
    expiresAt: Date.now() + 3_600_000,
    tokens: {
      accessToken: "access-token",
      expiresIn: 3600,
      tokenType: "Bearer",
    },
    user: {
      email: `${role.toLowerCase()}@example.com`,
      id: 1,
      mustChangePassword: false,
      role,
      status: "ACTIVE",
    },
  };
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates required credentials without calling the API", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("logs in and routes an admin to its default workspace", async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue(session("ADMIN"));
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), " admin@example.com ");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith({
        email: "admin@example.com",
        password: "Password123!",
      });
      expect(mocks.replace).toHaveBeenCalledWith("/admin/users");
    });
  });

  it("completes Google login and routes by role", async () => {
    const user = userEvent.setup();
    mocks.googleLogin.mockResolvedValue(session("MENTOR"));
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => {
      expect(mocks.googleLogin).toHaveBeenCalledWith("google-id-token");
      expect(mocks.replace).toHaveBeenCalledWith("/mentor/groups");
    });
  });
});

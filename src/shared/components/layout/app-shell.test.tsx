import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

const authState = vi.hoisted(() => ({
  hydrated: false,
  session: null as null | {
    expiresAt: number;
    user: { mustChangePassword: boolean; role: string };
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/modules/auth", () => ({
  isAuthSessionValid: (session: { expiresAt: number } | null) =>
    Boolean(session && session.expiresAt > Date.now()),
  useAuthHydrated: () => authState.hydrated,
  useAuthStore: (selector: (state: { session: typeof authState.session }) => unknown) =>
    selector({ session: authState.session }),
  useLogout: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/modules/notifications", () => ({
  NotificationBell: () => <span>Notifications</span>,
  NotificationCenterProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

describe("AppShell route guard", () => {
  beforeEach(() => {
    authState.hydrated = false;
    authState.session = null;
  });

  it("keeps protected content hidden while auth is hydrating", () => {
    render(<AppShell role="ADMIN">Protected content</AppShell>);

    expect(screen.getByText("Restoring session")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders protected content for a valid matching role", () => {
    authState.hydrated = true;
    authState.session = {
      expiresAt: Date.now() + 60_000,
      user: { mustChangePassword: false, role: "ADMIN" },
    };

    render(<AppShell role="ADMIN">Protected content</AppShell>);

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "href",
      "/admin/users",
    );
  });

  it("blocks a valid session from a different role", () => {
    authState.hydrated = true;
    authState.session = {
      expiresAt: Date.now() + 60_000,
      user: { mustChangePassword: false, role: "STUDENT" },
    };

    render(<AppShell role="ADMIN">Protected content</AppShell>);

    expect(
      screen.getByText(
        "This workspace is not available for your current account role.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});

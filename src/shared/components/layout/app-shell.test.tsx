import { fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

const authState = vi.hoisted(() => ({
  hydrated: false,
  session: null as null | {
    expiresAt: number;
    user: { email: string; mustChangePassword: boolean; role: string };
  },
}));

const navigationState = vi.hoisted(() => ({
  pathname: "/admin/users",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; href: string }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
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
    navigationState.pathname = "/admin/users";
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
      user: {
        email: "admin@fspark.com",
        mustChangePassword: false,
        role: "ADMIN",
      },
    };

    render(<AppShell role="ADMIN">Protected content</AppShell>);

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Management" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "href",
      "/admin/users",
    );
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: "Meeting evidence" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Notifications" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open profile for admin@fspark.com" }),
    ).toHaveAttribute("href", "/admin/profile");
    expect(screen.getByText("Version 11")).toBeInTheDocument();
  });

  it("keeps only one admin navigation group open", () => {
    authState.hydrated = true;
    authState.session = {
      expiresAt: Date.now() + 60_000,
      user: {
        email: "admin@fspark.com",
        mustChangePassword: false,
        role: "ADMIN",
      },
    };

    render(<AppShell role="ADMIN">Protected content</AppShell>);

    const management = screen.getByRole("button", { name: "Management" });
    const engagement = screen.getByRole("button", { name: "Engagement" });
    const system = screen.getByRole("button", { name: "System" });

    fireEvent.click(engagement);
    expect(management).toHaveAttribute("aria-expanded", "false");
    expect(engagement).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Meeting evidence" })).toHaveAttribute(
      "href",
      "/admin/meeting-evidence",
    );
    expect(screen.getByRole("link", { name: "Mentor activity" })).toHaveAttribute(
      "href",
      "/admin/mentor-activity",
    );

    fireEvent.click(system);
    expect(engagement).toHaveAttribute("aria-expanded", "false");
    expect(system).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("link", { name: "Meeting evidence" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Imports" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Backups" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "TV Display" })).toBeInTheDocument();
  });

  it("starts with every admin group collapsed on the dashboard", () => {
    navigationState.pathname = "/admin/dashboard";
    authState.hydrated = true;
    authState.session = {
      expiresAt: Date.now() + 60_000,
      user: {
        email: "admin@fspark.com",
        mustChangePassword: false,
        role: "ADMIN",
      },
    };

    render(<AppShell role="ADMIN">Dashboard content</AppShell>);

    for (const label of ["Management", "Engagement", "System"]) {
      expect(screen.getByRole("button", { name: label })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    }
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });

  it("closes the mobile drawer after selecting an admin link", () => {
    authState.hydrated = true;
    authState.session = {
      expiresAt: Date.now() + 60_000,
      user: {
        email: "admin@fspark.com",
        mustChangePassword: false,
        role: "ADMIN",
      },
    };

    render(<AppShell role="ADMIN">Protected content</AppShell>);
    fireEvent.click(screen.getByRole("button", { name: "Open workspace navigation" }));

    const drawer = screen.getByRole("dialog", { name: "Mobile workspace navigation" });
    fireEvent.click(within(drawer).getByRole("link", { name: "Users" }));

    expect(
      screen.queryByRole("dialog", { name: "Mobile workspace navigation" }),
    ).not.toBeInTheDocument();
  });

  it("does not render the admin version badge for another role", () => {
    authState.hydrated = true;
    authState.session = {
      expiresAt: Date.now() + 60_000,
      user: {
        email: "student@fpt.edu.vn",
        mustChangePassword: false,
        role: "STUDENT",
      },
    };

    render(<AppShell role="STUDENT">Student content</AppShell>);

    expect(screen.getByText("Student content")).toBeInTheDocument();
    expect(screen.queryByText("Version 11")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "href",
      "/student/notifications",
    );
  });

  it("blocks a valid session from a different role", () => {
    authState.hydrated = true;
    authState.session = {
      expiresAt: Date.now() + 60_000,
      user: {
        email: "student@fpt.edu.vn",
        mustChangePassword: false,
        role: "STUDENT",
      },
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

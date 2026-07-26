"use client";

import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  Database,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import {
  isAuthSessionValid,
  useAuthHydrated,
  useAuthStore,
  useLogout,
} from "@/modules/auth";
import { cn } from "@/shared/lib";
import type { UserRole } from "@/shared/types";

import { BrandLogo } from "../brand-logo";
import { Button, EmptyState, LoadingState } from "../ui";

type AppShellProps = {
  children: ReactNode;
  role: UserRole;
};

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/imports", icon: Database, label: "Imports" },
    { href: "/admin/problems", icon: BookOpen, label: "Problem Bank" },
  ],
  STUDENT: [
    { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/student/groups", icon: Users, label: "Groups" },
    { href: "/student/tasks", icon: ClipboardList, label: "Tasks" },
    { href: "/student/problems", icon: BookOpen, label: "Problems" },
  ],
  MENTOR: [
    { href: "/mentor/groups", icon: Users, label: "Groups" },
    {
      href: "/mentor/availability",
      icon: CalendarClock,
      label: "Availability",
    },
  ],
  INSTRUCTOR: [
    { href: "/instructor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/instructor/problems", icon: BookOpen, label: "Problems" },
    { href: "/instructor/grading", icon: ClipboardList, label: "Grading" },
  ],
};

export function AppShell({ children, role }: AppShellProps) {
  const pathname = usePathname();
  const isHydrated = useAuthHydrated();
  const logoutMutation = useLogout();
  const session = useAuthStore((state) => state.session);
  const hasValidSession = isAuthSessionValid(session);
  const navItems = NAV_ITEMS[role];

  async function handleSignOut() {
    await logoutMutation.mutateAsync().catch(() => undefined);
    window.location.replace("/login");
  }

  useEffect(() => {
    if (!isHydrated || hasValidSession) return;
    window.location.replace("/login");
  }, [hasValidSession, isHydrated]);

  if (!isHydrated || !session || !hasValidSession) {
    return (
      <main className="grid min-h-svh place-items-center bg-background p-6">
        <div className="w-[min(460px,100%)]">
          <LoadingState
            description="Checking your sign-in session before opening the workspace."
            title="Restoring session"
          />
        </div>
      </main>
    );
  }

  if (session.user.role !== role) {
    return (
      <main className="grid min-h-svh place-items-center bg-background p-6">
        <div className="w-[min(460px,100%)]">
          <EmptyState
            actions={
              <Button
                icon={<LogOut size={16} />}
                onClick={handleSignOut}
                variant="secondary"
              >
                Sign out
              </Button>
            }
            description="This workspace is not available for your current account role."
            title="Workspace unavailable"
          />
        </div>
      </main>
    );
  }

  return (
    <div className="grid min-h-svh grid-cols-[260px_minmax(0,1fr)] bg-background font-sans text-foreground max-[960px]:grid-cols-[minmax(0,1fr)]">
      <aside className="sticky top-0 grid h-svh grid-rows-[auto_1fr_auto] gap-6 border-r border-border bg-surface px-4 py-[22px] max-[960px]:static max-[960px]:h-auto max-[960px]:grid-rows-[auto_auto_auto] max-[960px]:gap-3.5 max-[960px]:border-r-0 max-[960px]:border-b max-[960px]:p-4">
        <Link
          className="inline-flex min-w-0 items-center px-2"
          href={navItems[0].href}
        >
          <BrandLogo variant="sidebar" />
        </Link>

        <nav
          className="grid min-w-0 content-start gap-1.5 max-[960px]:flex max-[960px]:overflow-x-auto max-[960px]:pb-0.5"
          aria-label="Workspace navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                className={cn(
                  "flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-[11px] text-sm font-medium text-muted transition-[background,color] duration-[160ms] ease-in-out hover:bg-background hover:text-foreground",
                  isActive && "bg-[#fff3ed] text-brand-primary",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="grid min-w-0 gap-3 max-[960px]:grid-cols-[minmax(0,1fr)_auto] max-[960px]:items-center max-[640px]:grid-cols-[minmax(0,1fr)]">
          <div className="grid min-w-0 gap-[3px] rounded-xl border border-border bg-background p-3">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-foreground">
              {session.user.email}
            </span>
            <span className="text-xs font-medium text-muted">
              {session.user.role}
            </span>
          </div>
          <Button
            className="max-[960px]:w-auto max-[640px]:w-full"
            disabled={logoutMutation.isPending}
            icon={<LogOut size={16} />}
            isFullWidth
            onClick={handleSignOut}
            variant="secondary"
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <main className="min-w-0 p-7 max-[960px]:px-4 max-[960px]:py-[22px]">
          {children}
        </main>
      </div>
    </div>
  );
}

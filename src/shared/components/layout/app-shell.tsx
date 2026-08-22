"use client";

import {
  Award,
  Bell,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MonitorUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import {
  isAuthSessionValid,
  useAuthHydrated,
  useAuthStore,
  useLogout,
} from "@/modules/auth";
import {
  NotificationBell,
  NotificationCenterProvider,
} from "@/modules/notifications";
import { cn } from "@/shared/lib";
import type { UserRole } from "@/shared/types";

import { BrandLogo } from "../brand-logo";
import { Button, EmptyState, LoadingState } from "../ui";

type AppShellProps = {
  children: ReactNode;
  role: UserRole;
  topbarContent?: ReactNode;
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
    { href: "/admin/backups", icon: Database, label: "Backups" },
    { href: "/admin/problems", icon: BookOpen, label: "Problem Bank" },
    { href: "/admin/feedback", icon: MessageSquare, label: "Feedback" },
    { href: "/admin/notifications", icon: Bell, label: "Notifications" },
    { href: "/admin/terms", icon: CalendarClock, label: "Terms" },
    { href: "/admin/groups", icon: Users, label: "Groups" },
    { href: "/admin/tv-display", icon: MonitorUp, label: "TV Display" },
    { href: "/admin/profile", icon: UserRound, label: "Profile" },
  ],
  STUDENT: [
    { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/student/groups", icon: Users, label: "Groups" },
    { href: "/student/tasks", icon: ClipboardList, label: "Tasks" },
    { href: "/student/grades", icon: Award, label: "Grades" },
    { href: "/student/problems", icon: BookOpen, label: "Problems" },
    { href: "/student/feedback", icon: MessageSquare, label: "Feedback" },
    { href: "/student/notifications", icon: Bell, label: "Notifications" },
    { href: "/student/profile", icon: UserRound, label: "Profile" },
  ],
  MENTOR: [
    { href: "/mentor/groups", icon: Users, label: "Groups" },
    {
      href: "/mentor/availability",
      icon: CalendarClock,
      label: "Availability",
    },
    { href: "/mentor/feedback", icon: MessageSquare, label: "Feedback" },
    { href: "/mentor/notifications", icon: Bell, label: "Notifications" },
    { href: "/mentor/profile", icon: UserRound, label: "Profile" },
  ],
  INSTRUCTOR: [
    { href: "/instructor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    {
      href: "/instructor/groups",
      icon: Users,
      label: "Groups",
    },
    {
      href: "/instructor/milestones",
      icon: CalendarClock,
      label: "Milestones",
    },
    { href: "/instructor/problems", icon: BookOpen, label: "Problems" },
    { href: "/instructor/grading", icon: ClipboardList, label: "Grading" },
    { href: "/instructor/notifications", icon: Bell, label: "Notifications" },
    { href: "/instructor/profile", icon: UserRound, label: "Profile" },
  ],
};

export function AppShell({ children, role, topbarContent }: AppShellProps) {
  const pathname = usePathname();
  const [navigationOpenedAtPath, setNavigationOpenedAtPath] = useState<
    string | null
  >(null);
  const drawerRef = useRef<HTMLElement>(null);
  const isHydrated = useAuthHydrated();
  const logoutMutation = useLogout();
  const session = useAuthStore((state) => state.session);
  const hasValidSession = isAuthSessionValid(session);
  const navItems = NAV_ITEMS[role];
  const isNavigationOpen = navigationOpenedAtPath === pathname;
  const activeNavItem =
    navItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? navItems[0];

  async function handleSignOut() {
    await logoutMutation.mutateAsync().catch(() => undefined);
    window.location.replace("/login");
  }

  useEffect(() => {
    if (!isHydrated || hasValidSession) return;
    window.location.replace("/login");
  }, [hasValidSession, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !hasValidSession || !session?.user.mustChangePassword) {
      return;
    }
    window.location.replace("/change-password");
  }, [hasValidSession, isHydrated, session?.user.mustChangePassword]);

  useEffect(() => {
    if (!isNavigationOpen) return;

    const drawer = drawerRef.current;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    document.body.style.overflow = "hidden";
    drawer?.querySelector<HTMLElement>(focusableSelector)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNavigationOpenedAtPath(null);
        return;
      }

      if (event.key !== "Tab" || !drawer) return;

      const focusableElements = Array.from(
        drawer.querySelectorAll<HTMLElement>(focusableSelector),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    function handleResize() {
      if (window.innerWidth > 960) setNavigationOpenedAtPath(null);
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [isNavigationOpen]);

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
    <NotificationCenterProvider>
      <div className="grid min-h-svh grid-cols-[260px_minmax(0,1fr)] overflow-x-clip bg-background font-sans text-foreground max-[960px]:grid-cols-[minmax(0,1fr)]">
      <aside className="sticky top-0 flex h-svh flex-col justify-between gap-6 overflow-y-auto border-r border-border bg-surface px-4 py-[22px] max-[960px]:hidden">
        <div className="flex min-w-0 flex-col gap-6">
          <Link
            className="inline-flex min-w-0 items-center px-2"
            href={navItems[0].href}
          >
            <BrandLogo variant="sidebar" />
          </Link>

          <nav className="grid min-w-0 content-start gap-1.5" aria-label="Workspace navigation">
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
        </div>

        <div className="grid min-w-0 gap-3 pt-2">
          <div className="grid min-w-0 gap-[3px] rounded-xl border border-border bg-background p-3">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-foreground">
              {session.user.email}
            </span>
            <span className="text-xs font-medium text-muted">
              {session.user.role}
            </span>
          </div>
          <Button
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
        <header
          className={cn(
            "flex min-h-16 items-center gap-4 border-b border-border bg-surface px-7 max-[960px]:hidden",
            topbarContent ? "justify-between" : "justify-end",
          )}
        >
          {topbarContent && <div className="min-w-0">{topbarContent}</div>}
          <NotificationBell />
        </header>
        <header className="sticky top-0 z-40 grid min-h-16 grid-cols-[44px_minmax(0,1fr)_48px] items-center gap-2 border-b border-border bg-surface/95 px-4 min-[961px]:hidden max-[480px]:px-3">
          <Button
            aria-controls="mobile-workspace-navigation"
            aria-expanded={isNavigationOpen}
            aria-label="Open workspace navigation"
            className="size-11 px-0"
            icon={<Menu size={22} />}
            onClick={() => setNavigationOpenedAtPath(pathname)}
            variant="ghost"
          >
            <span className="sr-only">Open navigation</span>
          </Button>

          {topbarContent ? (
            <div className="min-w-0">{topbarContent}</div>
          ) : (
            <Link
              className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              href={activeNavItem.href}
            >
              <BrandLogo
                imageClassName="h-8 w-[76px]"
                showName={false}
                variant="sidebar"
              />
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-foreground">
                {activeNavItem.label}
              </span>
            </Link>
          )}

          <NotificationBell />
        </header>

        <main className="min-w-0 p-7 max-[960px]:px-4 max-[960px]:py-5 max-[480px]:px-3 max-[480px]:py-4">
          {children}
        </main>
      </div>

      {isNavigationOpen && (
        <div className="fixed inset-0 z-50 min-[961px]:hidden">
          <button
            aria-label="Close workspace navigation"
            className="absolute inset-0 size-full cursor-default bg-slate-950/45"
            onClick={() => setNavigationOpenedAtPath(null)}
            type="button"
          />
          <aside
            aria-label="Mobile workspace navigation"
            aria-modal="true"
            className="relative flex h-dvh w-[min(86vw,340px)] flex-col justify-between gap-4 overflow-y-auto border-r border-border bg-surface px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
            id="mobile-workspace-navigation"
            ref={drawerRef}
            role="dialog"
          >
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <Link
                  className="inline-flex min-h-11 min-w-0 items-center px-1"
                  href={navItems[0].href}
                  onClick={() => setNavigationOpenedAtPath(null)}
                >
                  <BrandLogo variant="sidebar" />
                </Link>
                <Button
                  aria-label="Close workspace navigation"
                  className="size-11 shrink-0 px-0"
                  icon={<X size={22} />}
                  onClick={() => setNavigationOpenedAtPath(null)}
                  variant="ghost"
                >
                  <span className="sr-only">Close navigation</span>
                </Button>
              </div>

              <nav className="grid min-w-0 content-start gap-1.5" aria-label="Mobile navigation links">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-[background,color] duration-[160ms] ease-in-out hover:bg-background hover:text-foreground",
                        isActive && "bg-[#fff3ed] text-brand-primary",
                      )}
                      href={item.href}
                      key={item.href}
                      onClick={() => setNavigationOpenedAtPath(null)}
                    >
                      <Icon className="shrink-0" size={19} />
                      <span className="min-w-0 break-words">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="grid min-w-0 gap-3 border-t border-border pt-4">
              <div className="grid min-w-0 gap-1 rounded-xl border border-border bg-background p-3">
                <span className="break-all text-[13px] font-medium text-foreground">
                  {session.user.email}
                </span>
                <span className="text-xs font-medium text-muted">
                  {session.user.role}
                </span>
              </div>
              <Button
                disabled={logoutMutation.isPending}
                icon={<LogOut size={16} />}
                isFullWidth
                onClick={handleSignOut}
                variant="secondary"
              >
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </aside>
        </div>
      )}
      </div>
    </NotificationCenterProvider>
  );
}

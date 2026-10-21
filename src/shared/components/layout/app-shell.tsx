"use client";

import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarClock,
  ChartNoAxesCombined,
  ChevronDown,
  FileImage,
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

type AdminNavGroup = {
  id: "management" | "engagement" | "system";
  icon: LucideIcon;
  items: NavItem[];
  label: string;
};

const ADMIN_VERSION_LABEL = "Version 12" as const;

function AdminVersionBadge() {
  return (
    <span className="shrink-0 rounded-full border border-brand-primary/20 bg-[#fff3ed] px-2 py-1 text-[11px] font-semibold leading-none text-brand-primary">
      {ADMIN_VERSION_LABEL}
    </span>
  );
}

const ADMIN_DASHBOARD_ITEM: NavItem = {
  href: "/admin/dashboard",
  icon: LayoutDashboard,
  label: "Dashboard",
};

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    icon: Users,
    id: "management",
    items: [
      { href: "/admin/users", icon: Users, label: "Users" },
      { href: "/admin/groups", icon: Users, label: "Groups" },
      { href: "/admin/terms", icon: CalendarClock, label: "Terms" },
      { href: "/admin/problems", icon: BookOpen, label: "Problem Bank" },
    ],
    label: "Management",
  },
  {
    icon: MessageSquare,
    id: "engagement",
    items: [
      { href: "/admin/feedback", icon: MessageSquare, label: "Feedback" },
      { href: "/admin/meeting-evidence", icon: FileImage, label: "Meeting evidence" },
      { href: "/admin/mentor-activity", icon: ChartNoAxesCombined, label: "Mentor activity" },
    ],
    label: "Engagement",
  },
  {
    icon: Database,
    id: "system",
    items: [
      { href: "/admin/imports", icon: Database, label: "Imports" },
      { href: "/admin/backups", icon: Database, label: "Backups" },
      { href: "/admin/tv-display", icon: MonitorUp, label: "TV Display" },
    ],
    label: "System",
  },
];

const ADMIN_AUXILIARY_ITEMS: NavItem[] = [
  { href: "/admin/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/profile", icon: UserRound, label: "Profile" },
];

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ADMIN: [
    ADMIN_DASHBOARD_ITEM,
    ...ADMIN_NAV_GROUPS.flatMap((group) => group.items),
    ...ADMIN_AUXILIARY_ITEMS,
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
      icon: CalendarDays,
      label: "Availability",
    },
    {
      href: "/mentor/meetings",
      icon: CalendarClock,
      label: "Meeting reports",
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
    { href: "/instructor/feedback", icon: MessageSquare, label: "Feedback" },
    { href: "/instructor/notifications", icon: Bell, label: "Notifications" },
    { href: "/instructor/profile", icon: UserRound, label: "Profile" },
  ],
};

function isNavItemActive(item: NavItem, pathname: string) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getActiveAdminGroupId(pathname: string) {
  return ADMIN_NAV_GROUPS.find((group) =>
    group.items.some((item) => isNavItemActive(item, pathname)),
  )?.id ?? null;
}

type WorkspaceNavigationProps = {
  mobile?: boolean;
  onNavigate?: () => void;
  onToggleAdminGroup: (groupId: AdminNavGroup["id"]) => void;
  openAdminGroupId: AdminNavGroup["id"] | null;
  pathname: string;
  role: UserRole;
};

function WorkspaceNavigation({
  mobile = false,
  onNavigate,
  onToggleAdminGroup,
  openAdminGroupId,
  pathname,
  role,
}: WorkspaceNavigationProps) {
  const navClassName = "grid min-w-0 content-start gap-1.5";
  const linkClassName = cn(
    "flex min-w-0 items-center rounded-xl text-sm font-medium text-muted transition-[background,color] duration-[160ms] ease-in-out hover:bg-background hover:text-foreground",
    mobile ? "min-h-11 gap-3 px-3 py-2.5" : "gap-2.5 px-3 py-[11px]",
  );

  function renderLink(item: NavItem, nested = false) {
    const Icon = item.icon;
    const isActive = isNavItemActive(item, pathname);

    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={cn(
          linkClassName,
          nested && (mobile ? "pl-10" : "py-2 pl-10"),
          isActive && "bg-[#fff3ed] text-brand-primary",
        )}
        href={item.href}
        key={item.href}
        onClick={onNavigate}
      >
        <Icon className="shrink-0" size={mobile ? 19 : 18} />
        <span className="min-w-0 break-words">{item.label}</span>
      </Link>
    );
  }

  if (role !== "ADMIN") {
    return (
      <nav
        aria-label={mobile ? "Mobile navigation links" : "Workspace navigation"}
        className={navClassName}
      >
        {NAV_ITEMS[role].map((item) => renderLink(item))}
      </nav>
    );
  }

  return (
    <nav
      aria-label={mobile ? "Mobile navigation links" : "Workspace navigation"}
      className={navClassName}
    >
      {renderLink(ADMIN_DASHBOARD_ITEM)}
      {ADMIN_NAV_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        const isOpen = openAdminGroupId === group.id;
        const containsActiveItem = group.items.some((item) =>
          isNavItemActive(item, pathname),
        );

        return (
          <div className="grid min-w-0 gap-1" key={group.id}>
            <button
              aria-controls={`admin-nav-${mobile ? "mobile" : "desktop"}-${group.id}`}
              aria-expanded={isOpen}
              className={cn(
                linkClassName,
                "w-full cursor-pointer border-0 bg-transparent text-left",
                containsActiveItem && "text-brand-primary",
              )}
              onClick={() => onToggleAdminGroup(group.id)}
              type="button"
            >
              <GroupIcon className="shrink-0" size={mobile ? 19 : 18} />
              <span className="min-w-0 flex-1 break-words">{group.label}</span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
                size={16}
              />
            </button>
            {isOpen && (
              <div
                className="grid min-w-0 gap-1"
                id={`admin-nav-${mobile ? "mobile" : "desktop"}-${group.id}`}
              >
                {group.items.map((item) => renderLink(item, true))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function AccountSummary({
  active = false,
  email,
  mobile = false,
  onNavigate,
  role,
}: {
  active?: boolean;
  email: string;
  mobile?: boolean;
  onNavigate?: () => void;
  role: UserRole;
}) {
  const content = (
    <>
      <span className={cn(
        "text-[13px] font-medium text-foreground",
        mobile ? "break-all" : "overflow-hidden text-ellipsis whitespace-nowrap",
      )}>
        {email}
      </span>
      <span className="text-xs font-medium text-muted">{role}</span>
      {role === "ADMIN" && (
        <UserRound
          aria-hidden="true"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted"
          size={17}
        />
      )}
    </>
  );
  const className = cn(
    "relative grid min-w-0 gap-1 rounded-xl border border-border bg-background p-3",
    role === "ADMIN" &&
      "pr-10 transition-[border-color,background] hover:border-border-warm hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
    active && "border-brand-primary/30 bg-[#fff3ed]",
  );

  if (role === "ADMIN") {
    return (
      <Link
        aria-label={`Open profile for ${email}`}
        className={className}
        href="/admin/profile"
        onClick={onNavigate}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

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
  const activeAdminGroupId = role === "ADMIN"
    ? getActiveAdminGroupId(pathname)
    : null;
  const [adminGroupOverride, setAdminGroupOverride] = useState<{
    groupId: AdminNavGroup["id"] | null;
    pathname: string;
  } | null>(null);
  const openAdminGroupId = adminGroupOverride?.pathname === pathname
    ? adminGroupOverride.groupId
    : activeAdminGroupId;
  const activeNavItem =
    navItems.find(
      (item) => isNavItemActive(item, pathname),
    ) ?? navItems[0];

  async function handleSignOut() {
    await logoutMutation.mutateAsync().catch(() => undefined);
    window.location.replace("/login");
  }

  function handleToggleAdminGroup(groupId: AdminNavGroup["id"]) {
    setAdminGroupOverride({
      groupId: openAdminGroupId === groupId ? null : groupId,
      pathname,
    });
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
          <div className="flex min-w-0 items-center justify-between gap-2 px-2">
            <Link
              className="inline-flex min-w-0 items-center"
              href={navItems[0].href}
            >
              <BrandLogo variant="sidebar" />
            </Link>
            {role === "ADMIN" && <AdminVersionBadge />}
          </div>

          <WorkspaceNavigation
            onToggleAdminGroup={handleToggleAdminGroup}
            openAdminGroupId={openAdminGroupId}
            pathname={pathname}
            role={role}
          />
        </div>

        <div className="grid min-w-0 gap-3 pt-2">
          <AccountSummary
            active={role === "ADMIN" && pathname.startsWith("/admin/profile")}
            email={session.user.email}
            role={session.user.role}
          />
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
                <div className="flex min-w-0 items-center gap-2">
                  <Link
                    className="inline-flex min-h-11 min-w-0 items-center px-1"
                    href={navItems[0].href}
                    onClick={() => setNavigationOpenedAtPath(null)}
                  >
                    <BrandLogo variant="sidebar" />
                  </Link>
                  {role === "ADMIN" && <AdminVersionBadge />}
                </div>
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

              <WorkspaceNavigation
                mobile
                onNavigate={() => setNavigationOpenedAtPath(null)}
                onToggleAdminGroup={handleToggleAdminGroup}
                openAdminGroupId={openAdminGroupId}
                pathname={pathname}
                role={role}
              />
            </div>

            <div className="grid min-w-0 gap-3 border-t border-border pt-4">
              <AccountSummary
                active={role === "ADMIN" && pathname.startsWith("/admin/profile")}
                email={session.user.email}
                mobile
                onNavigate={() => setNavigationOpenedAtPath(null)}
                role={session.user.role}
              />
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

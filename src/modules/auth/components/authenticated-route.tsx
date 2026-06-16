"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { useAuthHydrated } from "../hooks/use-auth-hydrated";
import { useAuthStore } from "../stores/auth.store";
import { isAuthSessionValid } from "../utils/auth-session";

type AuthenticatedRouteProps = Readonly<{
  children: ReactNode;
  fallback?: ReactNode;
}>;

export function AuthenticatedRoute({
  children,
  fallback = "Restoring your session...",
}: AuthenticatedRouteProps) {
  const router = useRouter();
  const isHydrated = useAuthHydrated();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const hasValidSession = isAuthSessionValid(session);

  useEffect(() => {
    if (!isHydrated || hasValidSession) return;

    clearSession();
    router.replace("/login");
  }, [clearSession, hasValidSession, isHydrated, router]);

  if (!isHydrated || !hasValidSession) return fallback;

  return children;
}

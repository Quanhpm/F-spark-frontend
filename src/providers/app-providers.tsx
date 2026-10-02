"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";

import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { refreshAuthSession } from "@/modules/auth/services/auth-session.service";
import { setApiAccessTokenResolver } from "@/shared/lib";

type AppProvidersProps = Readonly<{
  children: ReactNode;
}>;

export function AppProviders({ children }: AppProvidersProps) {
  const restoreStarted = useRef(false);
  const session = useAuthStore((state) => state.session);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => {
    window.localStorage.removeItem("fspark-auth");
    setApiAccessTokenResolver(
      () => useAuthStore.getState().session?.tokens.accessToken ?? null,
    );

    if (!restoreStarted.current) {
      restoreStarted.current = true;
      void refreshAuthSession()
        .then((restoredSession) => {
          useAuthStore.getState().setSession(restoredSession);
        })
        .catch(() => {
          useAuthStore.getState().clearSession();
        });
    }

    return () => setApiAccessTokenResolver(null);
  }, []);

  useEffect(() => {
    if (!session) return;

    const refreshIn = Math.max(0, session.expiresAt - Date.now() - 60_000);
    const timer = window.setTimeout(() => {
      useAuthStore.getState().beginSessionRestore();
      void refreshAuthSession()
        .then((refreshedSession) => {
          useAuthStore.getState().setSession(refreshedSession);
        })
        .catch(() => {
          useAuthStore.getState().clearSession();
        });
    }, refreshIn);

    return () => window.clearTimeout(timer);
  }, [session]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster closeButton position="top-center" richColors />
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools buttonPosition="bottom-right" initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}

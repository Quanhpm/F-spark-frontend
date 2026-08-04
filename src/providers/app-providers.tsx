"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { setApiAccessTokenResolver } from "@/shared/lib";

type AppProvidersProps = Readonly<{
  children: ReactNode;
}>;

export function AppProviders({ children }: AppProvidersProps) {
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
    setApiAccessTokenResolver(
      () => useAuthStore.getState().session?.tokens.accessToken ?? null,
    );

    return () => setApiAccessTokenResolver(null);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster closeButton position="top-right" richColors />
      <ReactQueryDevtools buttonPosition="bottom-right" initialIsOpen={false} />
    </QueryClientProvider>
  );
}

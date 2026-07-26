"use client";

import Script from "next/script";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/shared/lib";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_HOSTED_DOMAIN = process.env.NEXT_PUBLIC_GOOGLE_HOSTED_DOMAIN;

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onCredential: (idToken: string) => void;
  onConfigurationError: (message: string) => void;
};

export function GoogleSignInButton({
  disabled = false,
  onCredential,
  onConfigurationError,
}: GoogleSignInButtonProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const initializeGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      onConfigurationError(
        "Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID.",
      );
      return;
    }

    if (!window.google || !buttonContainerRef.current) return;

    window.__fsparkGoogleCredentialHandler = (response) => {
      if (response.credential) onCredential(response.credential);
    };

    if (!window.__fsparkGoogleInitialized) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) =>
          window.__fsparkGoogleCredentialHandler?.(response),
        auto_select: false,
        cancel_on_tap_outside: true,
        hd: GOOGLE_HOSTED_DOMAIN || undefined,
        ux_mode: "popup",
        use_fedcm_for_button: false,
      });
      window.__fsparkGoogleInitialized = true;
    }

    const container = buttonContainerRef.current;
    container.replaceChildren();
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
      locale: "en",
      width: Math.min(
        400,
        Math.floor(container.getBoundingClientRect().width),
      ),
    });
    setIsReady(true);
  }, [onConfigurationError, onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        className="flex min-h-[50px] w-full items-center justify-center gap-[11px] rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition-[background-color,border-color] duration-[160ms] ease-in-out hover:border-slate-300 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary"
        type="button"
        onClick={() =>
          onConfigurationError(
            "Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID.",
          )
        }
      >
        <span className="text-[17px] font-bold text-[#4285f4]">G</span>
        Google Workspace
      </button>
    );
  }

  if (loadFailed) {
    return (
      <button
        className="flex min-h-[50px] w-full items-center justify-center gap-[11px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 transition-colors duration-[160ms] hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        type="button"
        onClick={() => window.location.reload()}
      >
        <span className="text-[17px] font-bold text-red-600">!</span>
        Google Blocked (Click to retry)
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative min-h-[50px] w-full overflow-hidden rounded-xl",
        disabled && "opacity-60",
      )}
      aria-busy={!isReady || disabled}
    >
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={initializeGoogle}
        onError={() => {
          setLoadFailed(true);
          onConfigurationError(
            "Google Sign-In was blocked. If you are using Brave or an ad-blocker, please disable Shields/blockers for this site.",
          );
        }}
      />
      <div
        ref={buttonContainerRef}
        className="grid min-h-[50px] w-full place-items-center [&>div]:max-w-full max-[600px]:[&_iframe]:max-w-full"
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center gap-[9px] rounded-xl border border-border bg-surface text-[13px] font-medium text-muted">
          <span className="size-[15px] animate-spin rounded-full border-2 border-slate-300 border-t-brand-primary" />{" "}
          Loading Google sign-in...
        </div>
      )}
      {disabled && (
        <span className="absolute inset-0 z-[3] cursor-not-allowed" />
      )}
    </div>
  );
}

"use client";

import {
  isAuthSessionValid,
  useAuthHydrated,
  useAuthStore,
} from "@/modules/auth";
import { LogOut, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
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

  if (!isHydrated || !hasValidSession) {
    return (
      <main
        style={{
          display: "grid",
          minHeight: "100svh",
          placeItems: "center",
          color: "#64748b",
          background: "#f7f8fc",
        }}
      >
        Restoring your session...
      </main>
    );
  }

  return (
    <main
      style={{
        display: "grid",
        minHeight: "100svh",
        placeItems: "center",
        padding: 24,
        background: "#f7f8fc",
      }}
    >
      <section
        style={{
          width: "min(560px, 100%)",
          padding: 40,
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          background: "#fff",
          boxShadow: "0 20px 55px rgb(15 23 42 / 8%)",
          textAlign: "center",
        }}
      >
        <Sparkles size={42} color="#4f46e5" />
        <h1 style={{ margin: "20px 0 10px" }}>Sign in successful</h1>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7 }}>
          {session
            ? `${session.user.email} · ${session.user.role}`
            : "Restoring your session."}
        </p>
        <Link
          href="/groups"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 26,
            padding: "12px 18px",
            borderRadius: 12,
            color: "#fff",
            background: "#4f46e5",
            fontWeight: 700,
          }}
        >
          <Users size={17} /> Find groups
        </Link>
        <button
          type="button"
          onClick={() => {
            window.google?.accounts.id.disableAutoSelect();
            clearSession();
            router.replace("/login");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            marginLeft: 12,
            padding: "12px 18px",
            border: 0,
            borderRadius: 12,
            color: "#fff",
            background: "#111827",
            fontWeight: 700,
          }}
        >
          <LogOut size={17} /> Sign out
        </button>
      </section>
    </main>
  );
}

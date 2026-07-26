"use client";

import { ApiError, cn } from "@/shared/lib";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useGoogleLogin } from "../hooks/use-google-login";
import { useLogin } from "../hooks/use-login";
import type { AuthUser } from "../types/auth.types";
import { BrandLogo } from "./brand-logo";
import { GoogleSignInButton } from "./google-sign-in-button";

const REMEMBERED_EMAIL_KEY = "fspark-remembered-email";

function getRememberedEmail() {
  return typeof window === "undefined"
    ? ""
    : localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
}

type FormErrors = {
  email?: string;
  password?: string;
};

function getDefaultWorkspacePath(role: AuthUser["role"]) {
  if (role === "ADMIN") return "/admin/users";
  if (role === "MENTOR") return "/mentor/groups";
  if (role === "INSTRUCTOR") return "/instructor/milestones";
  return "/student/dashboard";
}

const inputShellClassName =
  "flex h-[52px] min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-4 text-muted transition-[border-color,box-shadow] duration-[160ms] ease-in-out focus-within:border-brand-secondary focus-within:shadow-[0_0_0_4px_rgba(237,161,47,0.12)] max-[600px]:h-[50px] max-[380px]:gap-2.5 max-[380px]:px-3.5 [&>svg]:shrink-0";

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const [email, setEmail] = useState(getRememberedEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => getRememberedEmail().length > 0,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formMessage, setFormMessage] = useState("");

  function validate() {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    if (!validate()) return;

    try {
      const session = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      router.replace(getDefaultWorkspacePath(session.user.role));
    } catch (error) {
      setFormMessage(
        error instanceof ApiError
          ? error.message
          : "Sign in failed. Please try again.",
      );
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setFormMessage("");

    try {
      const session = await googleLoginMutation.mutateAsync(idToken);
      router.replace(getDefaultWorkspacePath(session.user.role));
    } catch (error) {
      setFormMessage(
        error instanceof ApiError
          ? error.message
          : "Google sign-in failed. Please try again.",
      );
    }
  }

  const isAuthenticating =
    loginMutation.isPending || googleLoginMutation.isPending;

  return (
    <section className="relative z-[2] grid min-h-svh min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] bg-surface px-[34px] pt-[32px] pb-[22px] max-[1180px]:px-11 max-[600px]:min-h-dvh max-[600px]:px-0 max-[600px]:pt-[max(1.25rem,env(safe-area-inset-top))] max-[600px]:pr-[max(1rem,env(safe-area-inset-right))] max-[600px]:pb-[max(1.25rem,env(safe-area-inset-bottom))] max-[600px]:pl-[max(1rem,env(safe-area-inset-left))]">
      <header className="flex w-full min-w-0 items-center justify-between">
        <BrandLogo />
        <Link
          aria-label="Back"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-[5px] rounded-xl text-[13px] font-medium text-muted transition-colors duration-[160ms] ease-in-out hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary max-[600px]:text-[0px] max-[600px]:[&>svg]:size-5"
          href="/"
        >
          <ArrowLeft size={15} /> Back
        </Link>
      </header>

      <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] place-items-center pt-[34px] pb-7 max-[600px]:py-8 max-[380px]:py-6">
        <div className="w-full max-w-[440px] min-w-0 text-center">
          <h1 className="m-0 font-sans text-[clamp(30px,3.2vw,36px)] leading-[1.2] font-bold tracking-normal text-foreground max-[600px]:text-[30px]">
            Welcome back!
          </h1>
          <p className="mt-2.5 mb-[34px] text-sm leading-relaxed text-muted max-[600px]:mb-7">
            Enter your email and password to continue.
          </p>

          <form
            className="grid gap-[18px] text-left max-[380px]:gap-3.5"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="grid gap-1.5">
              <label className="sr-only" htmlFor="email">
                Email
              </label>
              <div
                className={cn(inputShellClassName, errors.email && "border-red-500")}
              >
                <Mail size={20} />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-base text-foreground outline-0 placeholder:text-[#a3a3a3] min-[601px]:text-sm"
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                />
              </div>
              {errors.email && (
                <span className="pl-1 text-xs text-red-500">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <div
                className={cn(
                  inputShellClassName,
                  errors.password && "border-red-500",
                )}
              >
                <LockKeyhole size={20} />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-base text-foreground outline-0 placeholder:text-[#a3a3a3] min-[601px]:text-sm"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({ ...current, password: undefined }));
                  }}
                />
                <button
                  className="grid size-11 shrink-0 place-items-center rounded-lg border-0 bg-transparent p-0 text-muted transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <span className="pl-1 text-xs text-red-500">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="my-1 mb-0.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] text-muted max-[380px]:grid max-[380px]:grid-cols-1">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-[9px]">
                <input
                  className="m-0 size-4 cursor-pointer accent-brand-primary"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button
                className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border-0 bg-transparent p-0 text-[13px] font-medium text-foreground transition-colors duration-150 ease-in-out hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary max-[380px]:justify-self-start"
                type="button"
                onClick={() =>
                  setFormMessage("Contact an administrator to reset your password.")
                }
              >
                Forgot password?
              </button>
            </div>

            {formMessage && (
              <div
                className="-mt-1 rounded-[10px] border border-border-warm bg-surface-warm px-3.5 py-3 text-[13px] leading-normal text-orange-900"
                role="alert"
              >
                {formMessage}
              </div>
            )}

            <button
              className="mt-1 flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border-0 bg-brand-primary px-4 py-3 text-sm font-medium text-white transition-[background,transform] duration-[160ms] ease-in-out hover:bg-brand-primary-hover disabled:opacity-60 [&:active:not(:disabled)]:scale-[0.98]"
              type="submit"
              disabled={isAuthenticating}
            >
              {loginMutation.isPending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              ) : null}
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 mb-[18px] flex items-center gap-4 text-[11px] font-medium tracking-[0.08em] text-muted before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']">
            <span>OR SIGN IN WITH</span>
          </div>

          {googleLoginMutation.isPending && (
            <div
              className="-mt-2 mb-2.5 flex items-center justify-center gap-[9px] text-[13px] font-medium text-muted"
              role="status"
            >
              <span className="size-[15px] animate-spin rounded-full border-2 border-slate-300 border-t-brand-primary" />{" "}
              Signing in with Google...
            </div>
          )}

          <GoogleSignInButton
            disabled={isAuthenticating}
            onCredential={handleGoogleCredential}
            onConfigurationError={setFormMessage}
          />

          <p className="mt-6 mb-0 text-[13px] text-muted">
            Accounts are provided by the university.{" "}
            <strong className="text-foreground">Contact an administrator</strong>
          </p>
        </div>
      </div>

      <footer className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 text-xs text-muted max-[600px]:grid max-[600px]:justify-items-center max-[600px]:gap-[9px] max-[600px]:text-center">
        <span>&copy; 2026 F-Spark. All rights reserved.</span>
        <div className="flex gap-3 max-[600px]:flex-wrap max-[600px]:justify-center">
          <a
            className="inline-flex min-h-11 items-center rounded-lg hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary min-[601px]:min-h-0"
            href="#privacy"
          >
            Privacy Policy
          </a>
          <span>&bull;</span>
          <a
            className="inline-flex min-h-11 items-center rounded-lg hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary min-[601px]:min-h-0"
            href="#terms"
          >
            Terms of Use
          </a>
        </div>
      </footer>
    </section>
  );
}

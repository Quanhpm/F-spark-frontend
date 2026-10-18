"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { InputHTMLAttributes } from "react";

import { Button, TextInput } from "@/shared/components";
import { useAuthHydrated, useAuthStore } from "@/modules/auth";
import { useChangeMyPassword } from "@/modules/users/hooks/use-profile";
import { getPasswordChangeErrorMessage } from "@/modules/users/utils/password-change-error";

function workspacePath(role: "ADMIN" | "STUDENT" | "MENTOR" | "INSTRUCTOR") {
  if (role === "ADMIN") return "/admin/users";
  if (role === "MENTOR") return "/mentor/groups";
  if (role === "INSTRUCTOR") return "/instructor/milestones";
  return "/student/dashboard";
}

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> & {
  hint?: string;
  id: string;
  label: string;
};

function PasswordField({ hint, id, label, ...props }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const fieldName = label.toLowerCase();

  return (
    <div className="relative min-w-0">
      <TextInput
        {...props}
        hint={hint}
        id={id}
        label={label}
        shellClassName="pr-14"
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-controls={id}
        aria-label={`${isVisible ? "Hide" : "Show"} ${fieldName}`}
        aria-pressed={isVisible}
        className="absolute right-1 bottom-[3px] grid size-11 shrink-0 place-items-center rounded-lg border-0 bg-transparent p-0 text-muted transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary"
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      >
        {isVisible ? (
          <EyeOff aria-hidden="true" size={20} />
        ) : (
          <Eye aria-hidden="true" size={20} />
        )}
      </button>
    </div>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const session = useAuthStore((state) => state.session);
  const changePasswordMutation = useChangeMyPassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!session.user.mustChangePassword) {
      router.replace(workspacePath(session.user.role));
    }
  }, [hydrated, router, session]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (Array.from(newPassword).length < 15 || Array.from(newPassword).length > 128) {
      setError("New password must be between 15 and 128 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password confirmation does not match.");
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onError: (mutationError) => {
          setError(getPasswordChangeErrorMessage(mutationError));
        },
        onSuccess: () => {
          window.location.replace("/login");
        },
      },
    );
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background p-5">
      <section className="grid w-full max-w-[460px] gap-6 rounded-2xl border border-border bg-surface p-6 shadow-card min-[641px]:p-8">
        <div className="grid gap-2">
          <p className="m-0 text-xs font-bold tracking-[0.12em] text-brand-primary uppercase">Security update</p>
          <h1 className="m-0 text-2xl font-bold text-foreground">Change your password</h1>
          <p className="m-0 text-sm leading-relaxed text-muted">Your account requires a new password before you can use F-Spark.</p>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <PasswordField
            autoComplete="current-password"
            id="current-password"
            label="Current password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            value={currentPassword}
          />
          <PasswordField
            autoComplete="new-password"
            hint="15–128 characters; common passwords are not accepted"
            id="new-password"
            label="New password"
            maxLength={128}
            minLength={15}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            value={newPassword}
          />
          <PasswordField
            autoComplete="new-password"
            id="confirm-password"
            label="Confirm new password"
            maxLength={128}
            minLength={15}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            value={confirmPassword}
          />
          {error && <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
          <Button disabled={changePasswordMutation.isPending} type="submit">
            {changePasswordMutation.isPending ? "Updating password..." : "Update password"}
          </Button>
        </form>
      </section>
    </main>
  );
}

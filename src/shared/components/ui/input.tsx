import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  fieldClassName?: string;
  hint?: string;
  icon?: ReactNode;
  label?: string;
  shellClassName?: string;
};

export function TextInput({
  className,
  error,
  fieldClassName,
  hint,
  icon,
  id,
  label,
  shellClassName,
  ...props
}: TextInputProps) {
  return (
    <label className={cn("grid min-w-0 gap-[7px]", fieldClassName)} htmlFor={id}>
      {(label || hint) && (
        <span className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {label && (
            <span className="text-[13px] font-medium text-foreground">
              {label}
            </span>
          )}
          {hint && (
            <span className="min-w-0 break-words text-xs text-muted">
              {hint}
            </span>
          )}
        </span>
      )}
      <span
        className={cn(
          "flex h-[50px] min-w-0 items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 text-muted transition-[border-color,box-shadow] duration-[160ms] ease-in-out focus-within:border-brand-secondary focus-within:shadow-[0_0_0_4px_rgba(237,161,47,0.12)] data-[invalid=true]:border-red-500",
          shellClassName,
        )}
        data-invalid={Boolean(error)}
      >
        {icon}
        <input
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent font-sans text-base text-foreground outline-0 placeholder:text-[#a3a3a3] min-[761px]:text-sm",
            className,
          )}
          id={id}
          {...props}
        />
      </span>
      {error && (
        <span className="text-xs leading-[1.45] text-red-600">{error}</span>
      )}
    </label>
  );
}

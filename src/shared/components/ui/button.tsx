import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  isFullWidth?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const baseClassName =
  "inline-flex min-h-11 min-w-11 max-w-full items-center justify-center gap-2 whitespace-normal rounded-xl border border-transparent font-sans font-medium leading-tight text-center transition-[background,border-color,color,box-shadow,transform] duration-[160ms] ease-in-out focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)] disabled:cursor-not-allowed disabled:opacity-[0.58] min-[761px]:min-h-0 min-[761px]:min-w-0 min-[761px]:whitespace-nowrap min-[761px]:leading-none [&:active:not(:disabled)]:scale-[0.98] [&>svg]:shrink-0";

const variantClassNames: Record<ButtonVariant, string> = {
  danger:
    "border-red-200 bg-red-50 text-red-700 [&:hover:not(:disabled)]:bg-red-100",
  ghost:
    "bg-transparent text-foreground [&:hover:not(:disabled)]:bg-background",
  primary:
    "bg-brand-primary text-white [&:hover:not(:disabled)]:bg-brand-primary-hover",
  secondary:
    "border-border bg-surface text-foreground [&:hover:not(:disabled)]:border-border-warm [&:hover:not(:disabled)]:bg-background",
};

const sizeClassNames: Record<ButtonSize, string> = {
  lg: "min-h-[50px] px-5 py-3 text-sm min-[761px]:h-[50px] min-[761px]:py-0",
  md: "px-4 py-2.5 text-sm min-[761px]:h-[42px] min-[761px]:py-0",
  sm: "px-3 py-2 text-[13px] min-[761px]:h-9 min-[761px]:py-0",
};

export function Button({
  children,
  className,
  icon,
  isFullWidth = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        baseClassName,
        variantClassNames[variant],
        sizeClassNames[size],
        isFullWidth && "w-full",
        className,
      )}
      type={type}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

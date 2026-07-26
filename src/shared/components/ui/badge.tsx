import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib";

type BadgeTone = "neutral" | "brand" | "warning" | "success" | "danger";
type BadgeSize = "sm" | "md";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  icon?: ReactNode;
  size?: BadgeSize;
  tone?: BadgeTone;
};

const baseClassName =
  "inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 whitespace-normal rounded-full border border-transparent font-sans text-xs font-medium leading-tight text-center break-words min-[761px]:whitespace-nowrap min-[761px]:leading-none [&>svg]:shrink-0";

const toneClassNames: Record<BadgeTone, string> = {
  brand: "bg-brand-primary text-white",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-border bg-surface text-muted",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
};

const sizeClassNames: Record<BadgeSize, string> = {
  md: "min-h-7 px-[11px] py-1.5 min-[761px]:h-7 min-[761px]:py-0",
  sm: "min-h-6 px-[9px] py-1 min-[761px]:h-6 min-[761px]:py-0",
};

export function Badge({
  children,
  className,
  icon,
  size = "md",
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        baseClassName,
        toneClassNames[tone],
        sizeClassNames[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

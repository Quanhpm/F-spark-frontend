import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

type PersonSummaryProps = {
  className?: string;
  icon: ReactNode;
  label: string;
  name: string;
};

export function PersonSummary({
  className,
  icon,
  label,
  name,
}: PersonSummaryProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-background text-brand-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <span className="block text-xs font-medium text-muted">{label}</span>
        <strong className="mt-0.5 block truncate text-sm font-bold text-foreground min-[1440px]:text-base">
          {name}
        </strong>
      </div>
    </div>
  );
}

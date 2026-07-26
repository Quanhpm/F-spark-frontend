import { Inbox } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  actions?: ReactNode;
  description?: string;
  icon?: ReactNode;
  title: string;
};

export function EmptyState({
  actions,
  className,
  description,
  icon = <Inbox size={22} />,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid min-h-52 min-w-0 place-items-center rounded-xl border border-border bg-surface p-5 text-center min-[761px]:min-h-60 min-[761px]:p-8",
        className,
      )}
      {...props}
    >
      <div className="grid min-w-0 max-w-[420px] justify-items-center gap-2.5">
        <span className="grid size-12 place-items-center rounded-full bg-surface-warm text-brand-primary">
          {icon}
        </span>
        <h2 className="m-0 min-w-0 break-words text-lg leading-[1.3] font-bold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="m-0 min-w-0 break-words text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
        {actions && (
          <div className="mt-1 flex min-w-0 max-w-full flex-wrap justify-center gap-2.5">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

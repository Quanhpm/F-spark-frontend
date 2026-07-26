import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib";

type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  description?: string;
  title?: string;
};

export function LoadingState({
  className,
  description,
  title = "Loading",
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "grid min-h-52 min-w-0 place-items-center rounded-xl border border-border bg-surface p-5 text-center min-[761px]:min-h-60 min-[761px]:p-8",
        className,
      )}
      role="status"
      {...props}
    >
      <div className="grid min-w-0 max-w-[420px] justify-items-center gap-2.5">
        <span className="size-[30px] animate-spin rounded-full border-[3px] border-[#fbd0bd] border-t-brand-primary" />
        <h2 className="m-0 min-w-0 break-words text-lg leading-[1.3] font-bold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="m-0 min-w-0 break-words text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

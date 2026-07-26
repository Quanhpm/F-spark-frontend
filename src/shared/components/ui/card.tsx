import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  isPadded?: boolean;
};

type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
  actions?: ReactNode;
  description?: string;
  title: string;
};

export function Card({
  children,
  className,
  isPadded = false,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-border bg-surface shadow-card",
        isPadded && "p-4 min-[761px]:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  actions,
  className,
  description,
  title,
  ...props
}: CardHeaderProps) {
  return (
    <header
      className={cn(
        "flex min-w-0 flex-col items-stretch gap-4 border-b border-border px-4 py-4 min-[761px]:flex-row min-[761px]:items-start min-[761px]:justify-between min-[761px]:px-6 min-[761px]:py-5",
        className,
      )}
      {...props}
    >
      <div className="grid min-w-0 gap-1">
        <h2 className="m-0 min-w-0 break-words text-[17px] leading-[1.3] font-bold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="m-0 min-w-0 break-words text-[13px] leading-normal text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex min-w-0 flex-wrap items-center gap-2.5 min-[761px]:shrink-0 min-[761px]:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-w-0 p-4 min-[761px]:p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

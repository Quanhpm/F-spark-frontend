import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib";

type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  actions?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "grid min-w-0 gap-4 min-[761px]:flex min-[761px]:items-start min-[761px]:justify-between min-[761px]:gap-5",
        className,
      )}
      {...props}
    >
      <div className="grid min-w-0 gap-[7px]">
        {eyebrow && (
          <span className="text-xs font-bold tracking-[0.04em] text-brand-primary uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="m-0 min-w-0 break-words text-[clamp(28px,3.2vw,36px)] leading-[1.2] font-bold tracking-normal text-foreground">
          {title}
        </h1>
        {description && (
          <p className="m-0 max-w-[720px] min-w-0 break-words text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex min-w-0 flex-wrap justify-start gap-2.5 min-[761px]:shrink-0 min-[761px]:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}

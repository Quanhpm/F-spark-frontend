import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/shared/lib";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  fieldClassName?: string;
  label?: string;
  shellClassName?: string;
};

export function Select({
  children,
  className,
  fieldClassName,
  id,
  label,
  shellClassName,
  ...props
}: SelectProps) {
  return (
    <label className={cn("grid min-w-0 gap-[7px]", fieldClassName)} htmlFor={id}>
      {label && (
        <span className="text-[13px] font-medium text-foreground">
          {label}
        </span>
      )}
      <span
        className={cn(
          "relative flex h-[50px] min-w-0 items-center rounded-xl border border-border bg-surface transition-[border-color,box-shadow] duration-[160ms] ease-in-out focus-within:border-brand-secondary focus-within:shadow-[0_0_0_4px_rgba(237,161,47,0.12)]",
          shellClassName,
        )}
      >
        <select
          className={cn(
            "h-full w-full min-w-0 appearance-none border-0 bg-transparent py-0 pr-10 pl-3.5 font-sans text-base text-foreground outline-0 min-[761px]:text-sm",
            className,
          )}
          id={id}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 text-muted"
          size={16}
        />
      </span>
    </label>
  );
}

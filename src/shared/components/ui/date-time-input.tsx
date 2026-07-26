"use client";

import { useId, useRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib";

type DateTimeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  fieldClassName?: string;
  label?: string;
  shellClassName?: string;
  type?: "date" | "datetime-local" | "time";
};

export function DateTimeInput({
  className,
  fieldClassName,
  id,
  label,
  onClick,
  shellClassName,
  type = "datetime-local",
  ...props
}: DateTimeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  function openPicker() {
    const input = inputRef.current;
    if (!input || input.disabled || input.readOnly) return;

    input.focus();
    try {
      input.showPicker();
    } catch {
      // Focusing keeps the control usable where showPicker is unavailable.
    }
  }

  return (
    <div className={cn("grid min-w-0 gap-[7px]", fieldClassName)}>
      {label && (
        <label
          className="text-[13px] font-medium text-foreground"
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <span
        className={cn(
          "flex h-[50px] min-w-0 cursor-pointer items-center rounded-xl border border-border bg-surface px-3.5 transition-[border-color,box-shadow] duration-[160ms] ease-in-out focus-within:border-brand-secondary focus-within:shadow-[0_0_0_4px_rgba(237,161,47,0.12)]",
          shellClassName,
        )}
        onClick={(event) => {
          if (event.target !== inputRef.current) openPicker();
        }}
      >
        <input
          className={cn(
            "h-full min-w-0 flex-1 cursor-pointer border-0 bg-transparent font-sans text-base text-foreground outline-0 min-[761px]:text-sm",
            className,
          )}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) openPicker();
          }}
          id={inputId}
          ref={inputRef}
          type={type}
          {...props}
        />
      </span>
    </div>
  );
}

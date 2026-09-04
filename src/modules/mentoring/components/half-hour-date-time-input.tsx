"use client";

import { useId } from "react";

import { Select, TextInput } from "@/shared/components";

const HALF_HOUR_TIMES = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

function splitDateTime(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

function joinDateTime(date: string, time: string): string {
  if (date && time) return `${date}T${time}`;
  if (date) return `${date}T`;
  return time ? `T${time}` : "";
}

export function HalfHourDateTimeInput({
  error,
  hint,
  label,
  min,
  onChange,
  required = false,
  value,
}: {
  error?: string;
  hint?: string;
  label: string;
  min?: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  const id = useId();
  const current = splitDateTime(value);
  const minimum = splitDateTime(min ?? "");
  const isUnsupportedHistoricalTime =
    Boolean(current.time) && !HALF_HOUR_TIMES.includes(current.time);

  return (
    <fieldset className="grid min-w-0 gap-[7px] border-0 p-0">
      <legend className="mb-[7px] text-[13px] font-medium text-foreground">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </legend>
      <div className="grid min-w-0 gap-3 min-[520px]:grid-cols-[minmax(0,1fr)_150px]">
        <TextInput
          aria-label={`${label} date`}
          id={`${id}-date`}
          min={minimum.date || undefined}
          onChange={(event) =>
            onChange(joinDateTime(event.target.value, current.time))
          }
          required={required}
          type="date"
          value={current.date}
        />
        <Select
          aria-label={`${label} time`}
          id={`${id}-time`}
          onChange={(event) =>
            onChange(joinDateTime(current.date, event.target.value))
          }
          required={required}
          value={current.time}
        >
          <option value="">Select time</option>
          {isUnsupportedHistoricalTime && (
            <option disabled value={current.time}>
              {current.time} (choose a new time)
            </option>
          )}
          {HALF_HOUR_TIMES.map((time) => {
            const candidate = joinDateTime(current.date, time);
            const beforeMinimum = Boolean(
              min && current.date && candidate && candidate < min,
            );
            return (
              <option disabled={beforeMinimum} key={time} value={time}>
                {time}
              </option>
            );
          })}
        </Select>
      </div>
      {hint && <span className="text-xs text-muted">{hint}</span>}
      {error && (
        <span className="text-xs leading-[1.45] text-red-600">{error}</span>
      )}
    </fieldset>
  );
}

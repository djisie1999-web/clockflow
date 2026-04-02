"use client";

import { cn } from "@/lib/utils";

const DAYS = [
  { value: 0, label: "Sun", short: "S" },
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
];

interface DaySelectorProps {
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

export function DaySelector({ value, onChange, disabled }: DaySelectorProps) {
  function toggleDay(day: number) {
    if (disabled) return;
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort());
    }
  }

  return (
    <div className="flex gap-1">
      {DAYS.map((day) => {
        const selected = value.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            disabled={disabled}
            title={day.label}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors",
              selected
                ? "bg-primary text-primary-foreground"
                : "border bg-background text-muted-foreground hover:bg-accent",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {day.short}
          </button>
        );
      })}
    </div>
  );
}

export function formatDays(days: number[]): string {
  const sorted = [...days].sort();
  if (sorted.length === 7) return "Every day";
  if (
    sorted.length === 5 &&
    sorted[0] === 1 &&
    sorted[4] === 5
  ) {
    return "Mon-Fri";
  }
  if (
    sorted.length === 2 &&
    sorted[0] === 0 &&
    sorted[1] === 6
  ) {
    return "Weekends";
  }
  return sorted
    .map((d) => DAYS.find((day) => day.value === d)?.label || "")
    .join(", ");
}

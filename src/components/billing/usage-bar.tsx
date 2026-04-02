"use client";

import { cn } from "@/lib/utils";

interface UsageBarProps {
  used: number;
  limit: number;
  label?: string;
  className?: string;
}

export function UsageBar({ used, limit, label, className }: UsageBarProps) {
  const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">
            {used} / {limit >= 999999 ? "Unlimited" : limit}
          </span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isCritical
              ? "bg-destructive"
              : isWarning
                ? "bg-yellow-500"
                : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{percentage}% used</p>
    </div>
  );
}

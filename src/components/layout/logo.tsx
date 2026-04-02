import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Clock className="h-5 w-5 text-primary-foreground" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-tight tracking-tight">
            ClockFlow
          </span>
          <span className="text-[10px] leading-tight text-muted-foreground">
            Time & Attendance
          </span>
        </div>
      )}
    </div>
  );
}

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: "up" | "down" | null;
  trendLabel?: string;
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cn("transition-all duration-200 hover:scale-[1.02] hover:shadow-md", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
            {trendLabel && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={cn(
                  "text-slate-400",
                  trend === "up" && "text-green-600",
                  trend === "down" && "text-red-600"
                )}>
                  {trendLabel}
                </span>
              </div>
            )}
          </div>
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50",
            iconClassName
          )}>
            <Icon className="h-5 w-5 text-indigo-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

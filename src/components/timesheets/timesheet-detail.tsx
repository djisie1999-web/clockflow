"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Coffee, Timer } from "lucide-react";

interface DaySummary {
  date: string;
  workedHours: number;
  workedMinutes: number;
  overtimeMinutes: number;
  breakDurationMinutes: number;
  status: "COMPLETE" | "INCOMPLETE" | "ABSENT";
  clockIn: string | null;
  clockOut: string | null;
  pairs: Array<{
    clockIn: string;
    clockOut: string | null;
    durationMs: number;
  }>;
  breaks: Array<{
    breakStart: string;
    breakEnd: string | null;
    durationMs: number;
  }>;
}

interface TimesheetDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  date: string;
  summary: DaySummary | null;
}

function formatTimeFromISO(isoStr: string | null): string {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDurationMs(ms: number): string {
  const totalMinutes = Math.round(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  COMPLETE: { label: "Complete", className: "bg-green-100 text-green-800" },
  INCOMPLETE: { label: "Incomplete", className: "bg-amber-100 text-amber-800" },
  ABSENT: { label: "Absent", className: "bg-red-100 text-red-800" },
};

export function TimesheetDetail({
  open,
  onOpenChange,
  employeeName,
  date,
  summary,
}: TimesheetDetailProps) {
  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  const status = summary ? statusLabels[summary.status] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{employeeName}</DialogTitle>
          <DialogDescription>{formattedDate}</DialogDescription>
        </DialogHeader>

        {!summary || summary.status === "ABSENT" ? (
          <div className="flex h-[100px] items-center justify-center text-sm text-muted-foreground">
            No clock events recorded for this day.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status and summary */}
            <div className="flex items-center justify-between">
              {status && (
                <Badge variant="secondary" className={status.className}>
                  {status.label}
                </Badge>
              )}
              <div className="text-right text-sm">
                <span className="font-medium">{summary.workedHours.toFixed(2)}h</span>
                <span className="text-muted-foreground"> worked</span>
                {summary.overtimeMinutes > 0 && (
                  <span className="ml-2 text-amber-600">
                    +{(summary.overtimeMinutes / 60).toFixed(1)}h OT
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Clock pairs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Clock Events
              </div>
              {summary.pairs.map((pair, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="text-green-600 font-medium">
                      {formatTimeFromISO(pair.clockIn)}
                    </span>
                    <span className="mx-2 text-muted-foreground">to</span>
                    <span className="text-red-600 font-medium">
                      {pair.clockOut ? formatTimeFromISO(pair.clockOut) : "Still clocked in"}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {pair.durationMs > 0 ? formatDurationMs(pair.durationMs) : "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Breaks */}
            {summary.breaks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Coffee className="h-4 w-4" />
                  Breaks ({summary.breakDurationMinutes} min total)
                </div>
                {summary.breaks.map((brk, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="text-amber-600 font-medium">
                        {formatTimeFromISO(brk.breakStart)}
                      </span>
                      <span className="mx-2 text-muted-foreground">to</span>
                      <span className="text-blue-600 font-medium">
                        {brk.breakEnd ? formatTimeFromISO(brk.breakEnd) : "On break"}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {brk.durationMs > 0 ? formatDurationMs(brk.durationMs) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4" />
              <div className="grid grid-cols-3 gap-4 flex-1">
                <div>
                  <div className="text-muted-foreground">Worked</div>
                  <div className="font-medium">{summary.workedHours.toFixed(2)}h</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Breaks</div>
                  <div className="font-medium">{summary.breakDurationMinutes}m</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Overtime</div>
                  <div className="font-medium">
                    {summary.overtimeMinutes > 0
                      ? `${(summary.overtimeMinutes / 60).toFixed(1)}h`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

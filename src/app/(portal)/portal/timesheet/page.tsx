"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DayEntry {
  date: string;
  clockIn?: string;
  clockOut?: string;
  workedMinutes?: number;
  scheduledMinutes?: number;
}

function formatMins(mins?: number) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export default function PortalTimesheetPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const baseDate = new Date();
  const weekStart = startOfWeek(addWeeks(baseDate, weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    setLoading(true);
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(weekEnd, "yyyy-MM-dd");
    fetch(`/api/clockings?from=${from}&to=${to}&mine=true`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.clockings) {
          const dayMap = new Map<string, DayEntry>();
          for (const c of data.clockings) {
            const day = format(new Date(c.clockedAt), "yyyy-MM-dd");
            const existing = dayMap.get(day) ?? { date: day };
            if (c.type === "CLOCK_IN") existing.clockIn = c.clockedAt;
            if (c.type === "CLOCK_OUT") existing.clockOut = c.clockedAt;
            if (existing.clockIn && existing.clockOut) {
              existing.workedMinutes = Math.floor(
                (new Date(existing.clockOut).getTime() - new Date(existing.clockIn).getTime()) / 60000
              );
            }
            dayMap.set(day, existing);
          }
          setEntries(days.map(d => dayMap.get(format(d, "yyyy-MM-dd")) ?? { date: format(d, "yyyy-MM-dd") }));
        } else {
          setEntries(days.map(d => ({ date: format(d, "yyyy-MM-dd") })));
        }
      })
      .finally(() => setLoading(false));
  }, [weekOffset]);

  const totalWorked = entries.reduce((sum, e) => sum + (e.workedMinutes ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Timesheet</h1>
          <p className="text-slate-500">
            {format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
            This Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-indigo-500" />
            Weekly Summary — Total: {formatMins(totalWorked)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 text-left font-medium text-slate-500">Day</th>
                    <th className="pb-2 text-left font-medium text-slate-500">Clock In</th>
                    <th className="pb-2 text-left font-medium text-slate-500">Clock Out</th>
                    <th className="pb-2 text-right font-medium text-slate-500">Hours Worked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {entries.map((entry, i) => {
                    const day = days[i];
                    const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                    return (
                      <tr key={entry.date} className={isToday ? "bg-indigo-50/50" : ""}>
                        <td className="py-3 font-medium text-slate-700">
                          {format(day, "EEE d MMM")}
                          {isToday && <span className="ml-2 text-xs text-indigo-500">Today</span>}
                        </td>
                        <td className="py-3 text-slate-500">
                          {entry.clockIn ? format(new Date(entry.clockIn), "HH:mm") : "—"}
                        </td>
                        <td className="py-3 text-slate-500">
                          {entry.clockOut ? format(new Date(entry.clockOut), "HH:mm") : "—"}
                        </td>
                        <td className={`py-3 text-right font-medium ${entry.workedMinutes && entry.workedMinutes > 0 ? "text-slate-900" : "text-slate-300"}`}>
                          {formatMins(entry.workedMinutes)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200">
                    <td colSpan={3} className="pt-3 font-semibold text-slate-700">Total</td>
                    <td className="pt-3 text-right font-bold text-slate-900">{formatMins(totalWorked)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

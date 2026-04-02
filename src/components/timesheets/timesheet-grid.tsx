"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DaySummary {
  date: string;
  workedHours: number;
  overtimeMinutes: number;
  breakDurationMinutes: number;
  status: "COMPLETE" | "INCOMPLETE" | "ABSENT";
  clockIn: string | null;
  clockOut: string | null;
}

interface TimesheetRow {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string | null;
  };
  days: DaySummary[];
  totalWorkedHours: number;
  totalOvertimeHours: number;
}

interface TimesheetGridProps {
  timesheets: TimesheetRow[];
  dates: string[];
  onCellClick: (employeeId: string, date: string) => void;
}

const statusColors: Record<string, string> = {
  COMPLETE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  INCOMPLETE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function formatDayHeader(dateStr: string): { day: string; date: string } {
  const d = new Date(dateStr + "T00:00:00");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    day: dayNames[d.getDay()],
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
  };
}

export function TimesheetGrid({ timesheets, dates, onCellClick }: TimesheetGridProps) {
  if (timesheets.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-md border text-sm text-muted-foreground">
        No timesheet data found. Select a date range and employees to view timesheets.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-background min-w-[180px]">
              Employee
            </TableHead>
            {dates.map((d) => {
              const { day, date } = formatDayHeader(d);
              const isWeekend = new Date(d + "T00:00:00").getDay() % 6 === 0;
              return (
                <TableHead
                  key={d}
                  className={`min-w-[80px] text-center ${isWeekend ? "bg-muted/50" : ""}`}
                >
                  <div className="text-xs font-medium">{day}</div>
                  <div className="text-xs text-muted-foreground">{date}</div>
                </TableHead>
              );
            })}
            <TableHead className="min-w-[80px] text-center font-bold">Total</TableHead>
            <TableHead className="min-w-[80px] text-center font-bold">OT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timesheets.map((ts) => (
            <TableRow key={ts.employee.id}>
              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                <div>{ts.employee.firstName} {ts.employee.lastName}</div>
                {ts.employee.department && (
                  <div className="text-xs text-muted-foreground">{ts.employee.department}</div>
                )}
              </TableCell>
              {dates.map((d) => {
                const daySummary = ts.days.find((ds) => ds.date === d);
                const isWeekend = new Date(d + "T00:00:00").getDay() % 6 === 0;

                if (!daySummary || daySummary.status === "ABSENT") {
                  return (
                    <TableCell
                      key={d}
                      className={`text-center ${isWeekend ? "bg-muted/30" : ""}`}
                    >
                      {isWeekend ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-xs">
                          —
                        </Badge>
                      )}
                    </TableCell>
                  );
                }

                return (
                  <TableCell
                    key={d}
                    className={`text-center cursor-pointer hover:bg-muted/60 transition-colors ${
                      isWeekend ? "bg-muted/30" : ""
                    }`}
                    onClick={() => onCellClick(ts.employee.id, d)}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {daySummary.workedHours.toFixed(1)}h
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1 py-0 ${statusColors[daySummary.status]}`}
                      >
                        {daySummary.status === "COMPLETE" ? "OK" : "INC"}
                      </Badge>
                    </div>
                  </TableCell>
                );
              })}
              <TableCell className="text-center font-bold">
                {ts.totalWorkedHours.toFixed(1)}h
              </TableCell>
              <TableCell className="text-center">
                {ts.totalOvertimeHours > 0 ? (
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    +{ts.totalOvertimeHours.toFixed(1)}h
                  </span>
                ) : (
                  <span className="text-muted-foreground">0h</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

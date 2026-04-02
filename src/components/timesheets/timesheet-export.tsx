"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DaySummary {
  date: string;
  workedHours: number;
  overtimeMinutes: number;
  breakDurationMinutes: number;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
}

interface TimesheetRow {
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string | null;
  };
  days: DaySummary[];
  totalWorkedHours: number;
  totalOvertimeHours: number;
}

interface TimesheetExportProps {
  timesheets: TimesheetRow[];
  dateFrom: string;
  dateTo: string;
}

export function TimesheetExport({ timesheets, dateFrom, dateTo }: TimesheetExportProps) {
  function handleExport() {
    if (timesheets.length === 0) return;

    // Collect all dates from first timesheet
    const dates = timesheets[0]?.days.map((d) => d.date) || [];

    // Build CSV header
    const headers = [
      "Employee Number",
      "First Name",
      "Last Name",
      "Department",
      ...dates.map((d) => {
        const dt = new Date(d + "T00:00:00");
        return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      }),
      "Total Hours",
      "Overtime Hours",
    ];

    // Build CSV rows
    const rows = timesheets.map((ts) => {
      const dayHours = dates.map((d) => {
        const day = ts.days.find((ds) => ds.date === d);
        return day ? day.workedHours.toFixed(2) : "0.00";
      });

      return [
        ts.employee.employeeNumber,
        ts.employee.firstName,
        ts.employee.lastName,
        ts.employee.department || "",
        ...dayHours,
        ts.totalWorkedHours.toFixed(2),
        ts.totalOvertimeHours.toFixed(2),
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet-${dateFrom}-to-${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={timesheets.length === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}

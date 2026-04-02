"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimesheetGrid } from "@/components/timesheets/timesheet-grid";
import { TimesheetDetail } from "@/components/timesheets/timesheet-detail";
import { TimesheetExport } from "@/components/timesheets/timesheet-export";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  format,
} from "date-fns";

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

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [departmentId, setDepartmentId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState("");
  const [detailDate, setDetailDate] = useState("");
  const [detailSummary, setDetailSummary] = useState<DaySummary | null>(null);

  // Compute date range
  const dateFrom =
    viewMode === "week"
      ? format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
      : format(startOfMonth(currentDate), "yyyy-MM-dd");
  const dateTo =
    viewMode === "week"
      ? format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
      : format(endOfMonth(currentDate), "yyyy-MM-dd");

  // Dates array for grid
  const dates: string[] = [];
  const start = new Date(dateFrom + "T00:00:00");
  const end = new Date(dateTo + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(format(d, "yyyy-MM-dd"));
  }

  const periodLabel =
    viewMode === "week"
      ? `Week of ${new Date(dateFrom + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
      : format(currentDate, "MMMM yyyy");

  const loadTimesheets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);
      if (departmentId && departmentId !== "all") params.set("departmentId", departmentId);
      if (employeeId && employeeId !== "all") params.set("employeeId", employeeId);

      const res = await fetch(`/api/timesheets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTimesheets(data.timesheets);
      }
    } catch {
      // Failed
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, departmentId, employeeId]);

  useEffect(() => {
    loadTimesheets();
  }, [loadTimesheets]);

  useEffect(() => {
    // Load departments and employees for filters
    fetch("/api/departments?limit=100")
      .then((r) => r.json())
      .then((data) => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});

    fetch("/api/employees?limit=500")
      .then((r) => r.json())
      .then((data) => {
        if (data.employees) setEmployees(data.employees);
      })
      .catch(() => {});
  }, []);

  function navigatePeriod(direction: number) {
    if (viewMode === "week") {
      setCurrentDate((d) => addWeeks(d, direction));
    } else {
      setCurrentDate((d) => addMonths(d, direction));
    }
  }

  function handleCellClick(empId: string, date: string) {
    const ts = timesheets.find((t) => t.employee.id === empId);
    if (!ts) return;

    const day = ts.days.find((d) => d.date === date);
    setDetailEmployee(`${ts.employee.firstName} ${ts.employee.lastName}`);
    setDetailDate(date);
    setDetailSummary(day || null);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">
            View employee hours, breaks, and overtime
          </p>
        </div>
        <TimesheetExport
          timesheets={timesheets}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {periodLabel}
            </CardTitle>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "week" | "month")}
            >
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Period navigation */}
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigatePeriod(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <label className="text-sm text-muted-foreground">Period</label>
                <Input
                  type="date"
                  value={format(currentDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) setCurrentDate(new Date(e.target.value + "T00:00:00"));
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigatePeriod(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Department filter */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Department</label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee filter */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Employee</label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick nav */}
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <TimesheetGrid
              timesheets={timesheets}
              dates={dates}
              onCellClick={handleCellClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <TimesheetDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        employeeName={detailEmployee}
        date={detailDate}
        summary={detailSummary}
      />
    </div>
  );
}

"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportTable } from "@/components/reports/report-table";
import { ReportChart } from "@/components/reports/report-chart";
import { ExportButton } from "@/components/reports/export-button";

interface ReportConfig {
  title: string;
  description: string;
  apiPath: string;
  columns: { key: string; label: string; align?: "left" | "right" | "center" }[];
  chartConfig?: {
    title: string;
    type: "bar" | "line";
    xKey: string;
    yKey: string;
    dataSource: "rows" | "departmentBreakdown";
  };
  showDateRange: boolean;
}

const reportConfigs: Record<string, ReportConfig> = {
  attendance: {
    title: "Attendance Report",
    description: "Present/absent rates per employee",
    apiPath: "/api/reports/attendance",
    columns: [
      { key: "employeeNumber", label: "Emp #" },
      { key: "name", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "expectedDays", label: "Expected", align: "right" },
      { key: "present", label: "Present", align: "right" },
      { key: "absent", label: "Absent", align: "right" },
      { key: "attendanceRate", label: "Rate %", align: "right" },
    ],
    chartConfig: {
      title: "Attendance Rate by Employee",
      type: "bar",
      xKey: "name",
      yKey: "attendanceRate",
      dataSource: "rows",
    },
    showDateRange: true,
  },
  hours: {
    title: "Hours Worked Report",
    description: "Total hours worked by employee and department",
    apiPath: "/api/reports/hours",
    columns: [
      { key: "employeeNumber", label: "Emp #" },
      { key: "name", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "totalHours", label: "Total Hours", align: "right" },
    ],
    chartConfig: {
      title: "Hours by Department",
      type: "bar",
      xKey: "department",
      yKey: "totalHours",
      dataSource: "departmentBreakdown",
    },
    showDateRange: true,
  },
  overtime: {
    title: "Overtime Report",
    description: "Overtime hours and cost per employee",
    apiPath: "/api/reports/overtime",
    columns: [
      { key: "employeeNumber", label: "Emp #" },
      { key: "name", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "overtimeHours", label: "OT Hours", align: "right" },
      { key: "multiplier", label: "Multiplier", align: "right" },
      { key: "overtimeCost", label: "OT Cost", align: "right" },
    ],
    chartConfig: {
      title: "Overtime Hours by Employee",
      type: "bar",
      xKey: "name",
      yKey: "overtimeHours",
      dataSource: "rows",
    },
    showDateRange: true,
  },
  "leave-balance": {
    title: "Leave Balance Report",
    description: "Allowance, used, and remaining leave per employee",
    apiPath: "/api/reports/leave-balance",
    columns: [
      { key: "employeeNumber", label: "Emp #" },
      { key: "name", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "leaveDetail", label: "Leave Breakdown" },
    ],
    showDateRange: false,
  },
  "late-arrivals": {
    title: "Late Arrivals Report",
    description: "Employees who clocked in after their shift start",
    apiPath: "/api/reports/late-arrivals",
    columns: [
      { key: "employeeNumber", label: "Emp #" },
      { key: "name", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "date", label: "Date" },
      { key: "shiftStart", label: "Shift Start" },
      { key: "clockedIn", label: "Clocked In" },
      { key: "lateMinutes", label: "Late (min)", align: "right" },
    ],
    chartConfig: {
      title: "Late Minutes by Employee",
      type: "bar",
      xKey: "name",
      yKey: "lateMinutes",
      dataSource: "rows",
    },
    showDateRange: true,
  },
};

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function ReportViewerPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const config = reportConfigs[type];

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  if (!config) {
    return (
      <div className="space-y-6">
        <PageHeader title="Report Not Found" description="The requested report type does not exist." />
        <Link href="/reports"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports</Button></Link>
      </div>
    );
  }

  async function handleApply(filters: { startDate: string; endDate: string; departmentId: string; employeeId: string }) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.departmentId) params.set("departmentId", filters.departmentId);
      if (filters.employeeId) params.set("employeeId", filters.employeeId);
      if (!config.showDateRange) params.set("year", new Date().getFullYear().toString());

      const res = await fetch(`${config.apiPath}?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const rows = (data?.rows as Record<string, unknown>[]) || [];
  const summary = (data?.summary as Record<string, unknown>) || {};
  const chartData = config.chartConfig?.dataSource === "departmentBreakdown"
    ? (data?.departmentBreakdown as Record<string, unknown>[]) || []
    : rows;

  // For leave-balance, flatten allowances into leaveDetail string
  const displayRows = type === "leave-balance"
    ? rows.map((r) => {
        const allowances = r.allowances as Array<{ leaveType: string; totalDays: number; usedDays: number; remaining: number }> | undefined;
        return {
          ...r,
          leaveDetail: allowances
            ? allowances.map((a) => `${a.leaveType}: ${a.remaining}/${a.totalDays}`).join(", ")
            : "-",
        };
      })
    : rows;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        </Link>
        <PageHeader title={config.title} description={config.description} />
      </div>

      <ReportFilters onApply={handleApply} showDateRange={config.showDateRange} loading={loading} />

      {data && (
        <>
          {/* Summary KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(summary).map(([key, value]) => (
              <KpiCard key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} value={String(value)} />
            ))}
          </div>

          {/* Chart */}
          {config.chartConfig && chartData.length > 0 && (
            <ReportChart
              title={config.chartConfig.title}
              data={chartData.slice(0, 20)}
              type={config.chartConfig.type}
              xKey={config.chartConfig.xKey}
              yKey={config.chartConfig.yKey}
            />
          )}

          {/* Table + Export */}
          <div className="flex justify-end">
            <ExportButton data={displayRows} columns={config.columns} filename={`${type}-report`} />
          </div>
          <ReportTable columns={config.columns} rows={displayRows} />
        </>
      )}

      {!data && !loading && (
        <div className="flex h-32 items-center justify-center rounded-md border text-sm text-muted-foreground">
          Configure filters above and click &quot;Run Report&quot; to generate data.
        </div>
      )}
    </div>
  );
}

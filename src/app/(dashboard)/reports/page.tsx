"use client";

import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  Timer,
  Palmtree,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const reports = [
  {
    type: "attendance",
    title: "Attendance Report",
    description: "View present/absent/late statistics per employee over a date range",
    icon: CalendarCheck,
    color: "text-green-600",
  },
  {
    type: "hours",
    title: "Hours Worked",
    description: "Total and average hours worked, broken down by department",
    icon: Clock,
    color: "text-blue-600",
  },
  {
    type: "overtime",
    title: "Overtime Report",
    description: "Overtime hours and estimated cost per employee",
    icon: Timer,
    color: "text-orange-600",
  },
  {
    type: "leave-balance",
    title: "Leave Balance",
    description: "Allowance, used, and remaining leave days per employee",
    icon: Palmtree,
    color: "text-teal-600",
  },
  {
    type: "late-arrivals",
    title: "Late Arrivals",
    description: "Employees who clocked in after their shift start time",
    icon: AlertCircle,
    color: "text-red-600",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export workforce reports"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.type} href={`/reports/${report.type}`}>
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <report.icon className={`h-6 w-6 ${report.color}`} />
                <CardTitle className="text-base">{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{report.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

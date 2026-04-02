"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { Clock, Calendar, Timer, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PortalDashboard {
  weeklyHours: number;
  leaveBalance: number;
  recentClockings: {
    id: string;
    clockedAt: string;
    type: string;
  }[];
  pendingLeave: number;
}

export default function PortalDashboardPage() {
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  useEffect(() => {
    // Try to fetch real data; fall back to placeholders
    Promise.all([
      fetch(`/api/clockings?from=${format(weekStart, "yyyy-MM-dd")}&to=${format(weekEnd, "yyyy-MM-dd")}`).then(r => r.ok ? r.json() : null),
      fetch("/api/leave/allowances").then(r => r.ok ? r.json() : null),
      fetch("/api/leave/requests?status=PENDING&mine=true").then(r => r.ok ? r.json() : null),
    ]).then(([clockingsData, allowancesData, pendingData]) => {
      setData({
        weeklyHours: clockingsData?.totalMinutes ? Math.round(clockingsData.totalMinutes / 60) : 32,
        leaveBalance: allowancesData?.remaining ?? 14,
        recentClockings: clockingsData?.clockings?.slice(0, 5) ?? [],
        pendingLeave: pendingData?.total ?? 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-slate-500">
          Week of {format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Timer,
            label: "Hours This Week",
            value: `${data?.weeklyHours ?? 0}h`,
            sub: "tracked so far",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            icon: Calendar,
            label: "Leave Balance",
            value: `${data?.leaveBalance ?? 0} days`,
            sub: "remaining this year",
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            icon: AlertCircle,
            label: "Pending Requests",
            value: `${data?.pendingLeave ?? 0}`,
            sub: "awaiting approval",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            icon: Clock,
            label: "Next Shift",
            value: "Mon 09:00",
            sub: "in 2 days",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/portal/absence/request">
              <Button className="w-full bg-indigo-500 hover:bg-indigo-600">
                Request Leave
              </Button>
            </Link>
            <Link href="/portal/timesheet">
              <Button variant="outline" className="w-full">
                View My Timesheet
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Clockings</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.recentClockings?.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-400">No clockings recorded yet</p>
            ) : (
              <div className="space-y-2">
                {data?.recentClockings?.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className={c.type === "CLOCK_IN" ? "text-green-600" : "text-slate-600"}>
                      {c.type === "CLOCK_IN" ? "Clocked In" : c.type === "CLOCK_OUT" ? "Clocked Out" : c.type}
                    </span>
                    <span className="text-slate-400">{format(new Date(c.clockedAt), "EEE HH:mm")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Clock,
  Timer,
  Palmtree,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalEmployees: number;
  activeToday: number;
  hoursToday: number;
  pendingLeave: number;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: "up" | "down" | null;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {trend === "up" && (
                <TrendingUp className="h-3 w-3 text-green-500" />
              )}
              {trend === "down" && (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              {description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Fallback to empty stats
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your workforce today
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees ?? 0}
          description="Active employees"
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Clocked In Today"
          value={stats?.activeToday ?? 0}
          description="Currently on site"
          icon={Clock}
          trend="up"
          loading={loading}
        />
        <StatCard
          title="Hours Today"
          value={stats?.hoursToday ? `${stats.hoursToday.toFixed(1)}h` : "0h"}
          description="Total hours worked"
          icon={Timer}
          loading={loading}
        />
        <StatCard
          title="Pending Leave"
          value={stats?.pendingLeave ?? 0}
          description="Awaiting approval"
          icon={Palmtree}
          loading={loading}
        />
      </div>

      {/* Recent activity and charts placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Clockings</CardTitle>
            <CardDescription>
              Latest clock in/out activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              Clock in some employees to see activity here
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>
              This week&apos;s attendance rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              Attendance data will appear once employees are clocking in
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

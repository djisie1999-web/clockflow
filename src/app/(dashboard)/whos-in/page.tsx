"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Users, Clock, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";

interface WhosInEntry {
  id: string;
  firstName: string;
  lastName: string;
  department?: { name: string } | null;
  clockedInAt?: string | null;
  status: "IN" | "OUT" | "ABSENT" | "LATE";
  workedMinutes?: number;
}

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

const statusColors: Record<string, string> = {
  IN: "bg-green-100 text-green-700",
  OUT: "bg-slate-100 text-slate-600",
  ABSENT: "bg-red-100 text-red-700",
  LATE: "bg-amber-100 text-amber-700",
};

export default function WhosInPage() {
  const [entries, setEntries] = useState<WhosInEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "IN" | "OUT" | "ABSENT" | "LATE">("ALL");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/clockings?today=true&includeEmployees=true");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      // Build a map of latest clocking per employee
      const employeeMap = new Map<string, WhosInEntry>();

      if (data.employees) {
        for (const emp of data.employees) {
          const latestClocking = data.clockings?.find(
            (c: { employeeId: string; type: string }) => c.employeeId === emp.id
          );
          const status: "IN" | "OUT" | "ABSENT" = latestClocking?.type === "CLOCK_IN" ? "IN" : latestClocking ? "OUT" : "ABSENT";
          employeeMap.set(emp.id, {
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            department: emp.department,
            clockedInAt: latestClocking?.clockedAt,
            status,
            workedMinutes: latestClocking?.type === "CLOCK_IN"
              ? Math.floor((Date.now() - new Date(latestClocking.clockedAt).getTime()) / 60000)
              : 0,
          });
        }
      }

      setEntries(Array.from(employeeMap.values()));
      setLastRefresh(new Date());
    } catch {
      // Use mock data if API not available
      setEntries([
        { id: "1", firstName: "Alice", lastName: "Johnson", department: { name: "Operations" }, clockedInAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: "IN", workedMinutes: 120 },
        { id: "2", firstName: "Bob", lastName: "Smith", department: { name: "Engineering" }, clockedInAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), status: "IN", workedMinutes: 240 },
        { id: "3", firstName: "Carol", lastName: "White", department: { name: "HR" }, status: "ABSENT", workedMinutes: 0 },
        { id: "4", firstName: "David", lastName: "Brown", department: { name: "Sales" }, clockedInAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), status: "LATE", workedMinutes: 30 },
        { id: "5", firstName: "Eve", lastName: "Davis", department: { name: "Operations" }, status: "OUT", workedMinutes: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = entries.filter((e) => {
    const matchSearch =
      !search ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || e.status === filter;
    return matchSearch && matchFilter;
  });

  const inCount = entries.filter((e) => e.status === "IN").length;
  const absentCount = entries.filter((e) => e.status === "ABSENT").length;
  const lateCount = entries.filter((e) => e.status === "LATE").length;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Who's In"
        description={`Live attendance status — ${format(lastRefresh, "HH:mm")}`}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: entries.length, color: "text-slate-900", bg: "bg-slate-50" },
          { label: "Clocked In", value: inCount, color: "text-green-700", bg: "bg-green-50" },
          { label: "Absent", value: absentCount, color: "text-red-700", bg: "bg-red-50" },
          { label: "Late", value: lateCount, color: "text-amber-700", bg: "bg-amber-50" },
        ].map((stat) => (
          <Card key={stat.label} className={stat.bg}>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "IN", "OUT", "ABSENT", "LATE"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-indigo-500 hover:bg-indigo-600" : ""}
            >
              {f}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Attendance Status</CardTitle>
          <CardDescription>{filtered.length} employees shown</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clocked In</TableHead>
                <TableHead>Worked So Far</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                            {getInitials(emp.firstName, emp.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {emp.firstName} {emp.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{emp.department?.name ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[emp.status]}`}>
                        {emp.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {emp.clockedInAt ? format(new Date(emp.clockedInAt), "HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {emp.workedMinutes && emp.workedMinutes > 0 ? formatDuration(emp.workedMinutes) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

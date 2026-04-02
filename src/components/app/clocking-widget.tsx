"use client";

import { useState, useEffect } from "react";
import { Clock, LogIn, LogOut, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export function ClockingWidget() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/employees?limit=100&isActive=true")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.employees) setEmployees(data.employees);
      });
  }, []);

  async function clocking(type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END") {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/clockings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          type,
          source: "WEB",
          clockedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to record clocking");
      const emp = employees.find((e) => e.id === selectedEmployee);
      setLastAction(`${emp?.firstName ?? "Employee"} ${type === "CLOCK_IN" ? "clocked in" : type === "CLOCK_OUT" ? "clocked out" : type === "BREAK_START" ? "started break" : "ended break"} at ${format(new Date(), "HH:mm")}`);
    } catch {
      alert("Failed to record clocking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-indigo-500" />
          Quick Clocking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live clock */}
        <div className="rounded-xl bg-slate-900 p-4 text-center">
          <p className="font-mono text-4xl font-bold text-white">{format(time, "HH:mm:ss")}</p>
          <p className="mt-1 text-sm text-slate-400">{format(time, "EEEE, d MMMM yyyy")}</p>
        </div>

        {/* Employee selector */}
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">Select employee...</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={() => clocking("CLOCK_IN")}
            disabled={loading || !selectedEmployee}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <LogIn className="mr-1.5 h-4 w-4" />
            Clock In
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => clocking("CLOCK_OUT")}
            disabled={loading || !selectedEmployee}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            Clock Out
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => clocking("BREAK_START")}
            disabled={loading || !selectedEmployee}
          >
            <Coffee className="mr-1.5 h-4 w-4" />
            Break Start
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => clocking("BREAK_END")}
            disabled={loading || !selectedEmployee}
          >
            <Coffee className="mr-1.5 h-4 w-4" />
            Break End
          </Button>
        </div>

        {lastAction && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
            {lastAction}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

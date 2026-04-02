"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface ReportFiltersProps {
  onApply: (filters: {
    startDate: string;
    endDate: string;
    departmentId: string;
    employeeId: string;
  }) => void;
  showDateRange?: boolean;
  loading?: boolean;
}

export function ReportFilters({ onApply, showDateRange = true, loading }: ReportFiltersProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [departmentId, setDepartmentId] = useState("all");
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    // Could fetch departments from API if one existed; for now rely on empty state
    fetch("/api/reports/attendance?startDate=2000-01-01&endDate=2000-01-01")
      .catch(() => {});
  }, []);

  function handleApply() {
    onApply({
      startDate,
      endDate,
      departmentId: departmentId === "all" ? "" : departmentId,
      employeeId,
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
      {showDateRange && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
          </div>
        </>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Department</Label>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Employee ID</Label>
        <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Optional" className="w-[160px]" />
      </div>
      <Button onClick={handleApply} disabled={loading}>
        <Search className="mr-2 h-4 w-4" />
        {loading ? "Loading..." : "Run Report"}
      </Button>
    </div>
  );
}

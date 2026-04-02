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
import { ClockingTable } from "@/components/clockings/clocking-table";
import { ClockingForm } from "@/components/clockings/clocking-form";
import { BulkUploadDialog } from "@/components/clockings/bulk-upload-dialog";
import { Plus, Upload, ChevronLeft, ChevronRight } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

interface Clocking {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  notes: string | null;
  originalTimestamp: string | null;
  editedAt: string | null;
  editedBy: string | null;
  date: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClockingsPage() {
  const [clockings, setClockings] = useState<Clocking[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [employeeId, setEmployeeId] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingClocking, setEditingClocking] = useState<Clocking | null>(null);

  const loadClockings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (employeeId && employeeId !== "all") params.set("employeeId", employeeId);
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/clockings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClockings(data.clockings);
        setPagination(data.pagination);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo, employeeId, typeFilter]);

  useEffect(() => {
    loadClockings();
  }, [loadClockings]);

  useEffect(() => {
    fetch("/api/employees?limit=500")
      .then((r) => r.json())
      .then((data) => {
        if (data.employees) setEmployees(data.employees);
      })
      .catch(() => {});
  }, []);

  function handleEdit(clocking: Clocking) {
    setEditingClocking(clocking);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this clocking?")) return;
    try {
      const res = await fetch(`/api/clockings/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadClockings();
      }
    } catch {
      // Failed
    }
  }

  function handleFormSubmit() {
    setEditingClocking(null);
    loadClockings();
  }

  function handleNewClocking() {
    setEditingClocking(null);
    setFormOpen(true);
  }

  const formData = editingClocking
    ? {
        id: editingClocking.id,
        employeeId: editingClocking.employee.id,
        type: editingClocking.type,
        timestamp: editingClocking.timestamp.slice(0, 16),
        date: editingClocking.date.slice(0, 10),
        notes: editingClocking.notes || "",
        originalTimestamp: editingClocking.originalTimestamp || undefined,
        editedAt: editingClocking.editedAt || undefined,
        editedBy: editingClocking.editedBy || undefined,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clockings</h1>
          <p className="text-muted-foreground">
            View and manage employee clock events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={handleNewClocking}>
            <Plus className="mr-2 h-4 w-4" />
            Add Clocking
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Employee</label>
              <Select
                value={employeeId}
                onValueChange={(v) => {
                  setEmployeeId(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Type</label>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="CLOCK_IN">Clock In</SelectItem>
                  <SelectItem value="CLOCK_OUT">Clock Out</SelectItem>
                  <SelectItem value="BREAK_START">Break Start</SelectItem>
                  <SelectItem value="BREAK_END">Break End</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <ClockingTable
              clockings={clockings}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} clockings
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ClockingForm
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditingClocking(null);
        }}
        onSubmit={handleFormSubmit}
        clocking={formData}
      />

      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onComplete={loadClockings}
      />
    </div>
  );
}

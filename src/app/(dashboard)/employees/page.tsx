"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmployeeTable } from "@/components/employees/employee-table";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  employmentType: string;
  startDate: string;
  isActive: boolean;
  department: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState("lastName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Import state
  const [importing, setImporting] = useState(false);

  // Load departments once
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await fetch("/api/departments?pageSize=100");
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.departments);
        }
      } catch {
        // silent
      }
    }
    loadDepts();
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortField,
        sortOrder,
        status,
        ...(search ? { search } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(employmentType ? { employmentType } : {}),
      });
      const res = await fetch(`/api/employees?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        setTotal(data.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortOrder, status, search, departmentId, employmentType]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, departmentId, employmentType, status]);

  function handleSort(field: string) {
    if (field === sortField) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchEmployees();
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/employees/import", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        fetchEmployees();
      }
    } catch {
      // silent
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage your workforce"
        actions={
          <div className="flex items-center gap-2">
            <label>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
                disabled={importing}
              />
              <Button variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? "Importing..." : "Import CSV"}
                </span>
              </Button>
            </label>
            <Button onClick={() => router.push("/employees/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search employees..."
          className="w-full max-w-sm"
        />
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={employmentType} onValueChange={setEmploymentType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="FULL_TIME">Full Time</SelectItem>
            <SelectItem value="PART_TIME">Part Time</SelectItem>
            <SelectItem value="CONTRACT">Contract</SelectItem>
            <SelectItem value="CASUAL">Casual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!loading && employees.length === 0 && !search && !departmentId && !employmentType ? (
        <EmptyState
          icon={Users}
          title="No employees yet"
          description="Add your first employee to start tracking time and attendance."
          action={
            <Button onClick={() => router.push("/employees/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${search}-${departmentId}-${employmentType}-${status}-${page}-${sortField}-${sortOrder}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <EmployeeTable
                  employees={employees}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  onDelete={setDeleteTarget}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Deactivate Employee"
        description={`Are you sure you want to deactivate ${deleteTarget?.firstName} ${deleteTarget?.lastName}? They will be excluded from scheduling and clockings.`}
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

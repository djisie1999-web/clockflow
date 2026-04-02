"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Building2, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DepartmentForm } from "@/components/departments/department-form";
import { DataTable, type Column } from "@/components/shared/data-table";
import type { DepartmentInput } from "@/lib/validations";

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { employees: number };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<
    (Partial<DepartmentInput> & { id?: string }) | undefined
  >(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        includeInactive: "true",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/departments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments);
        setTotal(data.total);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  async function handleSubmit(data: DepartmentInput, id?: string) {
    setSaving(true);
    try {
      const url = id ? `/api/departments/${id}` : "/api/departments";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setFormOpen(false);
        setEditingDept(undefined);
        fetchDepartments();
      }
    } catch {
      // handle silently
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/departments/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchDepartments();
      }
    } catch {
      // handle silently
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Department>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (dept) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{dept.name}</span>
          {dept.code && (
            <span className="text-xs text-muted-foreground">({dept.code})</span>
          )}
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      className: "hidden md:table-cell",
      render: (dept) => (
        <span className="text-muted-foreground line-clamp-1">
          {dept.description || "--"}
        </span>
      ),
    },
    {
      key: "employees",
      label: "Employees",
      render: (dept) => (
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{dept._count.employees}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (dept) => (
        <Badge variant={dept.isActive ? "default" : "secondary"}>
          {dept.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[100px]",
      render: (dept) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setEditingDept({
                id: dept.id,
                name: dept.name,
                code: dept.code || "",
                description: dept.description || "",
                isActive: dept.isActive,
                sortOrder: dept.sortOrder,
              });
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(dept);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Organise your employees into departments"
        actions={
          <Button
            onClick={() => {
              setEditingDept(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search departments..."
          className="w-full max-w-sm"
        />
      </div>

      {!loading && departments.length === 0 && !search ? (
        <EmptyState
          icon={Building2}
          title="No departments yet"
          description="Create your first department to start organising employees."
          action={
            <Button
              onClick={() => {
                setEditingDept(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${search}-${page}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <DataTable
                  columns={columns}
                  data={departments}
                  keyExtractor={(d) => d.id}
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

      <DepartmentForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingDept(undefined);
        }}
        defaultValues={editingDept}
        onSubmit={handleSubmit}
        loading={saving}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Deactivate Department"
        description={`Are you sure you want to deactivate "${deleteTarget?.name}"? Employees in this department will not be affected.`}
        confirmLabel="Deactivate"
        variant="destructive"
        loading={saving}
        onConfirm={handleDelete}
      />
    </div>
  );
}

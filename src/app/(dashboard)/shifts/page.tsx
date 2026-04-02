"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, CalendarClock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ShiftPatternCard } from "@/components/shifts/shift-pattern-card";
import { ShiftPatternForm } from "@/components/shifts/shift-pattern-form";
import { ShiftAssignmentForm } from "@/components/shifts/shift-assignment-form";

interface ShiftPattern {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: number[];
  breakDuration: number;
  breakPaid: boolean;
  nightShift: boolean;
  color: string;
  isActive: boolean;
  _count: { assignments: number };
}

interface ShiftAssignment {
  id: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  shiftPattern: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    color: string;
  };
}

export default function ShiftsPage() {
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pattern form state
  const [patternFormOpen, setPatternFormOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<ShiftPattern | null>(null);

  // Assignment form state
  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ShiftAssignment | null>(null);

  // Delete state
  const [deletePatternTarget, setDeletePatternTarget] = useState<ShiftPattern | null>(null);
  const [deleteAssignTarget, setDeleteAssignTarget] = useState<ShiftAssignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPatterns = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/shifts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPatterns(data.shiftPatterns);
      }
    } catch {
      // silent
    }
  }, [search]);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch("/api/shift-assignments?pageSize=100");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPatterns(), fetchAssignments()]).finally(() =>
      setLoading(false)
    );
  }, [fetchPatterns, fetchAssignments]);

  // Pattern CRUD
  async function handlePatternSubmit(data: {
    id?: string;
    name: string;
    startTime: string;
    endTime: string;
    days: number[];
    breakDuration: number;
    breakPaid: boolean;
    breakTriggerMinutes?: number;
    nightShift: boolean;
    color: string;
    isActive: boolean;
  }) {
    const isEdit = !!data.id;
    const res = await fetch(isEdit ? `/api/shifts/${data.id}` : "/api/shifts", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save");
    }
    fetchPatterns();
    fetchAssignments();
  }

  async function handleDeletePattern() {
    if (!deletePatternTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shifts/${deletePatternTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete");
      } else {
        fetchPatterns();
      }
    } finally {
      setDeleting(false);
      setDeletePatternTarget(null);
    }
  }

  // Assignment CRUD
  async function handleAssignmentSubmit(data: {
    id?: string;
    employeeId: string;
    shiftPatternId: string;
    effectiveFrom: string;
    effectiveTo?: string;
  }) {
    const isEdit = !!data.id;
    const res = await fetch(
      isEdit ? `/api/shift-assignments/${data.id}` : "/api/shift-assignments",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save");
    }
    fetchAssignments();
    fetchPatterns();
  }

  async function handleDeleteAssignment() {
    if (!deleteAssignTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shift-assignments/${deleteAssignTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAssignments();
        fetchPatterns();
      }
    } finally {
      setDeleting(false);
      setDeleteAssignTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shifts"
        description="Manage shift patterns and employee assignments"
      />

      <Tabs defaultValue="patterns">
        <TabsList>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        {/* ───── Patterns Tab ───── */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search shift patterns..."
              className="w-full max-w-sm"
            />
            <Button onClick={() => { setEditingPattern(null); setPatternFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Pattern
            </Button>
          </div>

          {!loading && patterns.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No shift patterns"
              description="Create your first shift pattern to define working hours for your team."
              action={
                <Button onClick={() => { setEditingPattern(null); setPatternFormOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Pattern
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {patterns.map((pattern) => (
                <ShiftPatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onEdit={() => {
                    setEditingPattern(pattern);
                    setPatternFormOpen(true);
                  }}
                  onDelete={() => setDeletePatternTarget(pattern)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ───── Assignments Tab ───── */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingAssignment(null); setAssignFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Shift
            </Button>
          </div>

          {!loading && assignments.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No shift assignments"
              description="Assign shift patterns to employees to start scheduling."
              action={
                <Button onClick={() => { setEditingAssignment(null); setAssignFormOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Shift
                </Button>
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Shift Pattern</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective To</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.employee.firstName} {a.employee.lastName}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({a.employee.employeeNumber})
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="gap-1.5"
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: a.shiftPattern.color }}
                          />
                          {a.shiftPattern.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.shiftPattern.startTime} - {a.shiftPattern.endTime}
                      </TableCell>
                      <TableCell>
                        {new Date(a.effectiveFrom).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {a.effectiveTo
                          ? new Date(a.effectiveTo).toLocaleDateString()
                          : "Ongoing"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingAssignment(a);
                              setAssignFormOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteAssignTarget(a)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ShiftPatternForm
        open={patternFormOpen}
        onOpenChange={(open) => {
          setPatternFormOpen(open);
          if (!open) setEditingPattern(null);
        }}
        initialData={editingPattern ? {
          id: editingPattern.id,
          name: editingPattern.name,
          startTime: editingPattern.startTime,
          endTime: editingPattern.endTime,
          days: editingPattern.days,
          breakDuration: editingPattern.breakDuration,
          breakPaid: editingPattern.breakPaid,
          nightShift: editingPattern.nightShift,
          color: editingPattern.color,
          isActive: editingPattern.isActive,
        } : undefined}
        onSubmit={handlePatternSubmit}
      />

      <ShiftAssignmentForm
        open={assignFormOpen}
        onOpenChange={(open) => {
          setAssignFormOpen(open);
          if (!open) setEditingAssignment(null);
        }}
        initialData={editingAssignment ? {
          id: editingAssignment.id,
          employeeId: editingAssignment.employee.id,
          shiftPatternId: editingAssignment.shiftPattern.id,
          effectiveFrom: editingAssignment.effectiveFrom.slice(0, 10),
          effectiveTo: editingAssignment.effectiveTo?.slice(0, 10),
        } : undefined}
        onSubmit={handleAssignmentSubmit}
      />

      <ConfirmDialog
        open={!!deletePatternTarget}
        onOpenChange={(open) => {
          if (!open) setDeletePatternTarget(null);
        }}
        title="Delete Shift Pattern"
        description={`Are you sure you want to delete "${deletePatternTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeletePattern}
      />

      <ConfirmDialog
        open={!!deleteAssignTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteAssignTarget(null);
        }}
        title="Remove Shift Assignment"
        description={`Remove shift assignment for ${deleteAssignTarget?.employee.firstName} ${deleteAssignTarget?.employee.lastName}?`}
        confirmLabel="Remove"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteAssignment}
      />
    </div>
  );
}

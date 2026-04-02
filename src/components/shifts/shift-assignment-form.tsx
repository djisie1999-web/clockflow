"use client";

import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AssignmentData {
  id?: string;
  employeeId: string;
  shiftPatternId: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

interface ShiftPattern {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
}

interface ShiftAssignmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AssignmentData;
  onSubmit: (data: AssignmentData) => Promise<void>;
}

const DEFAULT_DATA: AssignmentData = {
  employeeId: "",
  shiftPatternId: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
};

export function ShiftAssignmentForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: ShiftAssignmentFormProps) {
  const [data, setData] = useState<AssignmentData>(initialData || DEFAULT_DATA);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (open) {
      // Load employees
      fetch("/api/employees?pageSize=100&status=active")
        .then((r) => r.json())
        .then((d) => setEmployees(d.employees || []))
        .catch(() => {});

      // Load shift patterns
      fetch("/api/shifts")
        .then((r) => r.json())
        .then((d) => setShiftPatterns(d.shiftPatterns || []))
        .catch(() => {});

      if (initialData) {
        setData(initialData);
      } else {
        setData(DEFAULT_DATA);
      }
    }
  }, [open, initialData]);

  function handleChange<K extends keyof AssignmentData>(
    key: K,
    value: AssignmentData[K]
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.employeeId) {
      setError("Please select an employee");
      return;
    }
    if (!data.shiftPatternId) {
      setError("Please select a shift pattern");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save assignment";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Shift Assignment" : "Assign Shift"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the shift assignment details."
              : "Assign a shift pattern to an employee."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select
              value={data.employeeId}
              onValueChange={(v) => handleChange("employeeId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Shift Pattern</Label>
            <Select
              value={data.shiftPatternId}
              onValueChange={(v) => handleChange("shiftPatternId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shift pattern" />
              </SelectTrigger>
              <SelectContent>
                {shiftPatterns.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: sp.color }}
                      />
                      {sp.name} ({sp.startTime}-{sp.endTime})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="effectiveFrom">Effective From</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={data.effectiveFrom}
                onChange={(e) => handleChange("effectiveFrom", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="effectiveTo">Effective To</Label>
              <Input
                id="effectiveTo"
                type="date"
                value={data.effectiveTo || ""}
                onChange={(e) =>
                  handleChange("effectiveTo", e.target.value || undefined)
                }
                placeholder="Ongoing"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

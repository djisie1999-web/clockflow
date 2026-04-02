"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

interface ClockingFormData {
  id?: string;
  employeeId: string;
  type: string;
  timestamp: string;
  date: string;
  notes: string;
  originalTimestamp?: string;
  editedBy?: string;
  editedAt?: string;
}

interface ClockingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  clocking?: ClockingFormData | null;
}

export function ClockingForm({
  open,
  onOpenChange,
  onSubmit,
  clocking,
}: ClockingFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState("CLOCK_IN");
  const [timestamp, setTimestamp] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!clocking?.id;

  useEffect(() => {
    if (open) {
      // Load employees
      fetch("/api/employees?limit=500")
        .then((r) => r.json())
        .then((data) => {
          if (data.employees) setEmployees(data.employees);
        })
        .catch(() => {});

      if (clocking) {
        setEmployeeId(clocking.employeeId);
        setType(clocking.type);
        setTimestamp(clocking.timestamp);
        setDate(clocking.date);
        setNotes(clocking.notes || "");
      } else {
        // Default to now
        const now = new Date();
        setEmployeeId("");
        setType("CLOCK_IN");
        setTimestamp(toLocalDatetimeString(now));
        setDate(toLocalDateString(now));
        setNotes("");
      }
      setError("");
    }
  }, [open, clocking]);

  function toLocalDatetimeString(d: Date): string {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function toLocalDateString(d: Date): string {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = isEdit
        ? { type, timestamp, date, notes }
        : { employeeId, type, timestamp, date, notes, source: "MANUAL" };

      const url = isEdit ? `/api/clockings/${clocking!.id}` : "/api/clockings";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save clocking");
        return;
      }

      onSubmit();
      onOpenChange(false);
    } catch {
      setError("Failed to save clocking");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Clocking" : "Add Clocking"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the clocking entry. Changes are tracked for audit."
              : "Manually add a clock event for an employee."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
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
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLOCK_IN">Clock In</SelectItem>
                <SelectItem value="CLOCK_OUT">Clock Out</SelectItem>
                <SelectItem value="BREAK_START">Break Start</SelectItem>
                <SelectItem value="BREAK_END">Break End</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timestamp">Date & Time</Label>
            <Input
              id="timestamp"
              type="datetime-local"
              value={timestamp}
              onChange={(e) => {
                setTimestamp(e.target.value);
                // Auto-set working date from the timestamp
                if (e.target.value) {
                  setDate(e.target.value.slice(0, 10));
                }
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Working Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              For night shifts, the working date may differ from the timestamp date.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          {isEdit && clocking?.originalTimestamp && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Edit History</p>
              <p className="text-muted-foreground">
                Original time: {new Date(clocking.originalTimestamp).toLocaleString("en-GB")}
              </p>
              {clocking.editedAt && (
                <p className="text-muted-foreground">
                  Last edited: {new Date(clocking.editedAt).toLocaleString("en-GB")}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || (!isEdit && !employeeId)}>
              {saving ? "Saving..." : isEdit ? "Update" : "Add Clocking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

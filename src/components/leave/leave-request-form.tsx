"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

interface LeaveType {
  id: string;
  name: string;
  color: string;
}

interface LeaveRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function LeaveRequestForm({ open, onClose, onSave }: LeaveRequestFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/leave/types").then((r) => r.json()).then(setLeaveTypes).catch(() => {});

    // Fetch employees - we use a simple approach
    fetch("/api/reports/leave-balance?year=" + new Date().getFullYear())
      .then((r) => r.json())
      .then((data) => {
        if (data.rows) {
          setEmployees(
            data.rows.map((r: { employeeId: string; employeeNumber: string; name: string }) => ({
              id: r.employeeId,
              employeeNumber: r.employeeNumber,
              firstName: r.name.split(" ")[0],
              lastName: r.name.split(" ").slice(1).join(" "),
            }))
          );
        }
      })
      .catch(() => {});
  }, [open]);

  function calculateTotalDays(): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return halfDay ? 0.5 : count;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const totalDays = calculateTotalDays();
    if (totalDays <= 0) {
      setError("Invalid date range");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, leaveTypeId, startDate, endDate, halfDay, totalDays, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create request");
        return;
      }

      onSave();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
              <SelectContent>
                {leaveTypes.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: lt.color }} />
                      {lt.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lr-start">Start Date</Label>
              <Input id="lr-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lr-end">End Date</Label>
              <Input id="lr-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lr-half">Half Day</Label>
            <Switch id="lr-half" checked={halfDay} onCheckedChange={setHalfDay} />
          </div>

          {startDate && endDate && (
            <p className="text-sm text-muted-foreground">
              Total: <strong>{calculateTotalDays()}</strong> day(s)
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="lr-reason">Reason (optional)</Label>
            <Textarea id="lr-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

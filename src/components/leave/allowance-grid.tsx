"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus } from "lucide-react";

interface Allowance {
  id: string;
  year: number;
  totalDays: number;
  usedDays: number;
  carriedOver: number;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string };
  leaveType: { id: string; name: string; color: string };
}

interface LeaveType {
  id: string;
  name: string;
  color: string;
}

export function AllowanceGrid() {
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [formOpen, setFormOpen] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formLeaveTypeId, setFormLeaveTypeId] = useState("");
  const [formTotalDays, setFormTotalDays] = useState("25");
  const [formCarriedOver, setFormCarriedOver] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, ltRes] = await Promise.all([
        fetch(`/api/leave/allowances?year=${year}`),
        fetch("/api/leave/types"),
      ]);
      if (aRes.ok) {
        const data = await aRes.json();
        setAllowances(
          data.map((a: Record<string, unknown>) => ({
            ...a,
            totalDays: Number(a.totalDays),
            usedDays: Number(a.usedDays),
            carriedOver: Number(a.carriedOver),
          }))
        );
      }
      if (ltRes.ok) setLeaveTypes(await ltRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/leave/allowances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: formEmployeeId,
          leaveTypeId: formLeaveTypeId,
          year,
          totalDays: parseFloat(formTotalDays),
          carriedOver: parseFloat(formCarriedOver),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      setFormOpen(false);
      loadData();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  // Group by employee
  const grouped = new Map<string, { name: string; empNo: string; allowances: Allowance[] }>();
  for (const a of allowances) {
    const key = a.employee.id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        name: `${a.employee.firstName} ${a.employee.lastName}`,
        empNo: a.employee.employeeNumber,
        allowances: [],
      });
    }
    grouped.get(key)!.allowances.push(a);
  }

  // Get unique employee IDs for the form select
  const uniqueEmployees = Array.from(grouped.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    empNo: data.empNo,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>Year:</Label>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Set Allowance
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : allowances.length === 0 ? (
        <p className="text-sm text-muted-foreground">No allowances set for {year}. Click &quot;Set Allowance&quot; to add one.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Carried Over</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(grouped.entries()).map(([empId, data]) =>
                data.allowances.map((a, idx) => (
                  <TableRow key={a.id}>
                    {idx === 0 && (
                      <TableCell rowSpan={data.allowances.length} className="font-medium align-top">
                        {data.name}
                        <div className="text-xs text-muted-foreground">{data.empNo}</div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: a.leaveType.color }} />
                        {a.leaveType.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{a.totalDays}</TableCell>
                    <TableCell className="text-right">{a.carriedOver}</TableCell>
                    <TableCell className="text-right">{a.usedDays}</TableCell>
                    <TableCell className="text-right font-medium">
                      {a.totalDays + a.carriedOver - a.usedDays}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Leave Allowance ({year})</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label>Employee ID</Label>
              {uniqueEmployees.length > 0 ? (
                <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {uniqueEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name} ({e.empNo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={formEmployeeId} onChange={(e) => setFormEmployeeId(e.target.value)} placeholder="Employee ID" required />
              )}
            </div>
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={formLeaveTypeId} onValueChange={setFormLeaveTypeId}>
                <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Days</Label>
                <Input type="number" step="0.5" value={formTotalDays} onChange={(e) => setFormTotalDays(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Carried Over</Label>
                <Input type="number" step="0.5" value={formCarriedOver} onChange={(e) => setFormCarriedOver(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

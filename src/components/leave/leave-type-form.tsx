"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveTypeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initial?: {
    id?: string;
    name: string;
    color: string;
    isPaid: boolean;
    requiresApproval: boolean;
    isActive: boolean;
  };
}

export function LeaveTypeForm({ open, onClose, onSave, initial }: LeaveTypeFormProps) {
  const [name, setName] = useState(initial?.name || "");
  const [color, setColor] = useState(initial?.color || "#10B981");
  const [isPaid, setIsPaid] = useState(initial?.isPaid ?? true);
  const [requiresApproval, setRequiresApproval] = useState(initial?.requiresApproval ?? true);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initial?.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEdit ? `/api/leave/types/${initial!.id}` : "/api/leave/types";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, isPaid, requiresApproval, isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Leave Type" : "Create Leave Type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="lt-name">Name</Label>
            <Input id="lt-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lt-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="lt-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="lt-paid">Paid Leave</Label>
            <Switch id="lt-paid" checked={isPaid} onCheckedChange={setIsPaid} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="lt-approval">Requires Approval</Label>
            <Switch id="lt-approval" checked={requiresApproval} onCheckedChange={setRequiresApproval} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="lt-active">Active</Label>
            <Switch id="lt-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

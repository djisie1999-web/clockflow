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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OvertimeRuleFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initial?: {
    id?: string;
    name: string;
    triggerType: string;
    thresholdHours: number;
    multiplier: number;
    priority: number;
    exemptDays: string[];
    isActive: boolean;
  };
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function OvertimeRuleForm({ open, onClose, onSave, initial }: OvertimeRuleFormProps) {
  const [name, setName] = useState(initial?.name || "");
  const [triggerType, setTriggerType] = useState(initial?.triggerType || "DAILY");
  const [thresholdHours, setThresholdHours] = useState(initial?.thresholdHours?.toString() || "8");
  const [multiplier, setMultiplier] = useState(initial?.multiplier?.toString() || "1.5");
  const [priority, setPriority] = useState(initial?.priority?.toString() || "0");
  const [exemptDays, setExemptDays] = useState<string[]>(initial?.exemptDays || []);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initial?.id;

  function toggleDay(day: string) {
    setExemptDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEdit ? `/api/overtime/${initial!.id}` : "/api/overtime";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          triggerType,
          thresholdHours: parseFloat(thresholdHours),
          multiplier: parseFloat(multiplier),
          priority: parseInt(priority),
          exemptDays,
          isActive,
        }),
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
          <DialogTitle>{isEdit ? "Edit Overtime Rule" : "Create Overtime Rule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="ot-name">Rule Name</Label>
            <Input id="ot-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Trigger Type</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="PERIOD">Period</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ot-threshold">Threshold Hours</Label>
              <Input id="ot-threshold" type="number" step="0.5" value={thresholdHours} onChange={(e) => setThresholdHours(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ot-multiplier">Multiplier</Label>
              <Input id="ot-multiplier" type="number" step="0.25" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ot-priority">Priority</Label>
            <Input id="ot-priority" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Exempt Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant={exemptDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day)}
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ot-active">Active</Label>
            <Switch id="ot-active" checked={isActive} onCheckedChange={setIsActive} />
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

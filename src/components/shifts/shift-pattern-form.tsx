"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DaySelector } from "./day-selector";
import { TimePicker } from "./time-picker";

interface ShiftPatternData {
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
}

interface ShiftPatternFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ShiftPatternData;
  onSubmit: (data: ShiftPatternData) => Promise<void>;
}

const DEFAULT_DATA: ShiftPatternData = {
  name: "",
  startTime: "09:00",
  endTime: "17:00",
  days: [1, 2, 3, 4, 5],
  breakDuration: 30,
  breakPaid: false,
  nightShift: false,
  color: "#3B82F6",
  isActive: true,
};

const COLOR_OPTIONS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

export function ShiftPatternForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: ShiftPatternFormProps) {
  const [data, setData] = useState<ShiftPatternData>(initialData || DEFAULT_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!initialData?.id;

  function handleChange<K extends keyof ShiftPatternData>(
    key: K,
    value: ShiftPatternData[K]
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.name.trim()) {
      setError("Shift name is required");
      return;
    }
    if (data.days.length === 0) {
      setError("Select at least one day");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(data);
      onOpenChange(false);
      if (!isEditing) setData(DEFAULT_DATA);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save shift pattern";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Shift Pattern" : "Create Shift Pattern"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the shift pattern configuration."
              : "Define a new shift pattern for your team."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Shift Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Morning Shift"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TimePicker
              label="Start Time"
              value={data.startTime}
              onChange={(v) => handleChange("startTime", v)}
            />
            <TimePicker
              label="End Time"
              value={data.endTime}
              onChange={(v) => handleChange("endTime", v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Working Days</Label>
            <DaySelector
              value={data.days}
              onChange={(v) => handleChange("days", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="breakDuration">Break (minutes)</Label>
              <Input
                id="breakDuration"
                type="number"
                min={0}
                value={data.breakDuration}
                onChange={(e) => handleChange("breakDuration", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="breakTrigger">Break Trigger (min)</Label>
              <Input
                id="breakTrigger"
                type="number"
                min={0}
                value={data.breakTriggerMinutes || ""}
                onChange={(e) =>
                  handleChange(
                    "breakTriggerMinutes",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="breakPaid">Break Paid</Label>
            <Switch
              id="breakPaid"
              checked={data.breakPaid}
              onCheckedChange={(v) => handleChange("breakPaid", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="nightShift">Night Shift</Label>
            <Switch
              id="nightShift"
              checked={data.nightShift}
              onCheckedChange={(v) => handleChange("nightShift", v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-7 w-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: data.color === c ? "var(--foreground)" : "transparent",
                  }}
                  onClick={() => handleChange("color", c)}
                />
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={data.isActive}
                onCheckedChange={(v) => handleChange("isActive", v)}
              />
            </div>
          )}

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
              {saving ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

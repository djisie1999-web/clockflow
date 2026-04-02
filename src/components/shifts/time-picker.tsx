"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimePicker({ label, value, onChange, disabled }: TimePickerProps) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
}

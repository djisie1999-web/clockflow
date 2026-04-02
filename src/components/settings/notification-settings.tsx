"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationPref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_PREFS: NotificationPref[] = [
  {
    key: "leave_request",
    label: "Leave Requests",
    description: "Email when an employee submits a leave request",
    enabled: true,
  },
  {
    key: "leave_approved",
    label: "Leave Approved/Rejected",
    description: "Email employees when their leave is approved or rejected",
    enabled: true,
  },
  {
    key: "overtime_alert",
    label: "Overtime Alerts",
    description: "Alert when employees approach overtime thresholds",
    enabled: true,
  },
  {
    key: "missed_clocking",
    label: "Missed Clockings",
    description: "Alert when employees miss clock-in or clock-out",
    enabled: false,
  },
  {
    key: "weekly_summary",
    label: "Weekly Summary",
    description: "Weekly attendance summary email to managers",
    enabled: false,
  },
  {
    key: "payroll_ready",
    label: "Payroll Ready",
    description: "Notification when timesheet data is ready for payroll export",
    enabled: true,
  },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function togglePref(key: string) {
    setPrefs((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p))
    );
  }

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    // In production, these would be persisted to a tenant_notification_settings table
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose which notifications are sent to managers and employees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {prefs.map((pref) => (
            <div key={pref.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{pref.label}</Label>
                <p className="text-sm text-muted-foreground">{pref.description}</p>
              </div>
              <Switch
                checked={pref.enabled}
                onCheckedChange={() => togglePref(pref.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Notification Preferences"}
        </Button>
        {success && (
          <span className="text-sm text-green-600">Preferences saved</span>
        )}
      </div>
    </div>
  );
}

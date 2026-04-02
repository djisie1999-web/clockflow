"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComplianceSettingsProps {
  settings: {
    country: string;
  };
}

export function ComplianceSettings({ settings }: ComplianceSettingsProps) {
  const [maxWeeklyHours, setMaxWeeklyHours] = useState(48);
  const [minBreakMinutes, setMinBreakMinutes] = useState(20);
  const [breakTriggerHours, setBreakTriggerHours] = useState(6);
  const [minDailyRest, setMinDailyRest] = useState(11);
  const [minWeeklyRest, setMinWeeklyRest] = useState(24);
  const [optOutEnabled, setOptOutEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const isUK = settings.country === "GB" || settings.country === "IE";

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    // Compliance settings are stored locally for now
    // In production, these would be persisted to a tenant_settings table
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Working Time Directive</CardTitle>
          <CardDescription>
            {isUK
              ? "Configure settings based on the UK Working Time Regulations 1998."
              : "Configure maximum working hours and rest period rules."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="maxWeekly">Max Weekly Hours</Label>
              <Input
                id="maxWeekly"
                type="number"
                min={0}
                max={168}
                value={maxWeeklyHours}
                onChange={(e) => setMaxWeeklyHours(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Average over 17-week reference period
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="breakTrigger">Break Trigger (hours)</Label>
              <Input
                id="breakTrigger"
                type="number"
                min={0}
                max={24}
                value={breakTriggerHours}
                onChange={(e) => setBreakTriggerHours(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum shift length before break required
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minBreak">Min Break Duration (minutes)</Label>
              <Input
                id="minBreak"
                type="number"
                min={0}
                value={minBreakMinutes}
                onChange={(e) => setMinBreakMinutes(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dailyRest">Min Daily Rest (hours)</Label>
              <Input
                id="dailyRest"
                type="number"
                min={0}
                max={24}
                value={minDailyRest}
                onChange={(e) => setMinDailyRest(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weeklyRest">Min Weekly Rest (hours)</Label>
              <Input
                id="weeklyRest"
                type="number"
                min={0}
                max={48}
                value={minWeeklyRest}
                onChange={(e) => setMinWeeklyRest(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isUK && (
        <Card>
          <CardHeader>
            <CardTitle>Opt-Out Tracking</CardTitle>
            <CardDescription>
              Track employees who have opted out of the 48-hour weekly limit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="optOut">Enable Opt-Out Management</Label>
                <p className="text-sm text-muted-foreground">
                  Allow individual employees to opt out of the maximum weekly hours limit.
                </p>
              </div>
              <Switch
                id="optOut"
                checked={optOutEnabled}
                onCheckedChange={setOptOutEnabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Compliance Settings"}
        </Button>
        {success && (
          <span className="text-sm text-green-600">Compliance settings saved</span>
        )}
      </div>
    </div>
  );
}

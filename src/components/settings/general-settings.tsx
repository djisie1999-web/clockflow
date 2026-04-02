"use client";

import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TIMEZONES = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
];

const COUNTRIES = [
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "AE", name: "United Arab Emirates" },
];

const COLOR_OPTIONS = [
  "#0F766E", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444",
  "#F59E0B", "#10B981", "#06B6D4", "#6366F1", "#84CC16",
];

interface GeneralSettingsProps {
  settings: {
    name: string;
    logo: string | null;
    primaryColor: string;
    timezone: string;
    country: string;
  };
  onSave: (data: Record<string, unknown>) => Promise<void>;
}

export function GeneralSettings({ settings, onSave }: GeneralSettingsProps) {
  const [name, setName] = useState(settings.name);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [country, setCountry] = useState(settings.country);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    try {
      await onSave({ name, timezone, country, primaryColor });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update your company details and branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Company Ltd"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {settings.logo ? (
                <div className="h-12 w-12 rounded-lg border bg-muted" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                  Logo
                </div>
              )}
              <Button variant="outline" size="sm" disabled>
                Upload (coming soon)
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Primary Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-8 w-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: primaryColor === c ? "var(--foreground)" : "transparent",
                  }}
                  onClick={() => setPrimaryColor(c)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locale Settings</CardTitle>
          <CardDescription>
            Configure timezone and country for accurate time tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        {success && (
          <span className="text-sm text-green-600">Settings saved successfully</span>
        )}
      </div>
    </div>
  );
}

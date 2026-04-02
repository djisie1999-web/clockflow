"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { GeneralSettings } from "@/components/settings/general-settings";
import { ComplianceSettings } from "@/components/settings/compliance-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { Skeleton } from "@/components/ui/skeleton";

interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
  timezone: string;
  country: string;
  planTier: string;
  subscriptionStatus: string;
  employeeLimit: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave(data: Record<string, unknown>) {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save settings");
    }
    const result = await res.json();
    setSettings(result.settings);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your workspace configuration" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your workspace configuration" />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Settings className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Unable to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your workspace configuration"
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettings
            settings={{
              name: settings.name,
              logo: settings.logo,
              primaryColor: settings.primaryColor,
              timezone: settings.timezone,
              country: settings.country,
            }}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <ComplianceSettings
            settings={{ country: settings.country }}
          />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

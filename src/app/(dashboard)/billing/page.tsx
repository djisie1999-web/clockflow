"use client";

import { useEffect, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { UsageBar } from "@/components/billing/usage-bar";
import { PlanCard } from "@/components/billing/plan-card";
import { PlanComparison } from "@/components/billing/plan-comparison";

interface BillingData {
  billing: {
    currentPlan: {
      tier: string;
      name: string;
      price: number;
      employeeLimit: number;
    };
    usage: {
      employeeCount: number;
      employeeLimit: number;
      percentage: number;
    };
    subscription: {
      status: string;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
      trialEndsAt: string | null;
    };
  };
  plans: Array<{
    tier: string;
    name: string;
    price: number;
    employeeLimit: number;
    isCurrent: boolean;
  }>;
}

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: [
    "Up to 5 employees",
    "Basic time tracking",
    "Simple timesheets",
    "Leave management",
  ],
  STARTER: [
    "Up to 25 employees",
    "All Free features",
    "Overtime rules",
    "Advanced reports",
    "CSV export",
    "Multi-department",
  ],
  PRO: [
    "Up to 100 employees",
    "All Starter features",
    "Kiosk mode",
    "API access",
    "Custom branding",
    "Priority support",
  ],
  ENTERPRISE: [
    "Unlimited employees",
    "All Pro features",
    "SSO integration",
    "Dedicated support",
    "Custom integrations",
    "SLA guarantee",
  ],
};

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    async function loadBilling() {
      try {
        const res = await fetch("/api/billing");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadBilling();
  }, []);

  async function handleUpgrade(tier: string) {
    setUpgrading(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier: tier }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.url) {
          window.location.href = result.url;
        } else {
          alert(result.message || "Upgrade feature coming soon.");
        }
      }
    } finally {
      setUpgrading(null);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        if (result.url) {
          window.location.href = result.url;
        } else {
          alert(result.message || "Billing portal coming soon.");
        }
      }
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Billing" description="Manage your subscription and usage" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Billing" description="Manage your subscription and usage" />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <CreditCard className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Unable to load billing information</p>
        </div>
      </div>
    );
  }

  const { billing, plans } = data;
  const statusColor =
    billing.subscription.status === "ACTIVE"
      ? "default"
      : billing.subscription.status === "TRIAL"
        ? "secondary"
        : "destructive";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing"
        description="Manage your subscription and usage"
        actions={
          billing.subscription.stripeSubscriptionId ? (
            <Button variant="outline" onClick={handleManageBilling}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          ) : undefined
        }
      />

      {/* Current Plan & Usage */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
            <CardDescription>
              Your active subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{billing.currentPlan.name}</span>
              <Badge variant={statusColor as "default" | "secondary" | "destructive"}>
                {billing.subscription.status}
              </Badge>
            </div>
            {billing.currentPlan.price > 0 ? (
              <p className="text-muted-foreground">
                &pound;{billing.currentPlan.price.toFixed(2)} per user/month
              </p>
            ) : (
              <p className="text-muted-foreground">Free plan</p>
            )}
            {billing.subscription.trialEndsAt && (
              <p className="text-sm text-yellow-600">
                Trial ends: {new Date(billing.subscription.trialEndsAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage</CardTitle>
            <CardDescription>
              Employee count vs plan limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsageBar
              used={billing.usage.employeeCount}
              limit={billing.usage.employeeLimit}
              label="Employees"
            />
          </CardContent>
        </Card>
      </div>

      {/* Plan Cards */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.tier}
              tier={plan.tier}
              name={plan.name}
              price={plan.price}
              employeeLimit={plan.employeeLimit}
              isCurrent={plan.isCurrent}
              features={PLAN_FEATURES[plan.tier] || []}
              onSelect={() => handleUpgrade(plan.tier)}
              loading={upgrading === plan.tier}
            />
          ))}
        </div>
      </div>

      {/* Feature Comparison */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Feature Comparison</h2>
        <PlanComparison currentTier={billing.currentPlan.tier} />
      </div>
    </div>
  );
}

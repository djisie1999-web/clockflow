import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const PLAN_DETAILS = {
  FREE: { name: "Free", price: 0, employeeLimit: 5 },
  STARTER: { name: "Starter", price: 4, employeeLimit: 25 },
  PRO: { name: "Pro", price: 3.5, employeeLimit: 100 },
  ENTERPRISE: { name: "Enterprise", price: 3, employeeLimit: 999999 },
} as const;

// GET /api/billing — Get current plan, usage, subscription status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        planTier: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        employeeLimit: true,
        trialEndsAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const employeeCount = await db.employee.count({
      where: { tenantId: user.tenantId, isActive: true },
    });

    const planTier = tenant.planTier as keyof typeof PLAN_DETAILS;
    const currentPlan = PLAN_DETAILS[planTier] || PLAN_DETAILS.FREE;

    return NextResponse.json({
      billing: {
        currentPlan: {
          tier: tenant.planTier,
          ...currentPlan,
        },
        usage: {
          employeeCount,
          employeeLimit: tenant.employeeLimit,
          percentage: tenant.employeeLimit > 0
            ? Math.round((employeeCount / tenant.employeeLimit) * 100)
            : 0,
        },
        subscription: {
          status: tenant.subscriptionStatus,
          stripeCustomerId: tenant.stripeCustomerId,
          stripeSubscriptionId: tenant.stripeSubscriptionId,
          trialEndsAt: tenant.trialEndsAt,
        },
      },
      plans: Object.entries(PLAN_DETAILS).map(([tier, details]) => ({
        tier,
        ...details,
        isCurrent: tier === tenant.planTier,
      })),
    });
  } catch (error) {
    console.error("GET /api/billing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

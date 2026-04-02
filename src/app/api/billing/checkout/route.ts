import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// POST /api/billing/checkout — Create Stripe checkout session for plan upgrade
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { planTier } = body;

    if (!["STARTER", "PRO", "ENTERPRISE"].includes(planTier)) {
      return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 });
    }

    // Stripe integration placeholder
    // In production, this would create a Stripe checkout session:
    // const session = await stripe.checkout.sessions.create({ ... });
    // return NextResponse.json({ url: session.url });

    return NextResponse.json({
      url: null,
      message: "Stripe integration pending. Contact sales@clockflow.io to upgrade.",
    });
  } catch (error) {
    console.error("POST /api/billing/checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

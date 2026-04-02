import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// POST /api/billing/portal — Create Stripe customer portal session
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Stripe integration placeholder
    // In production, this would create a Stripe customer portal session:
    // const session = await stripe.billingPortal.sessions.create({ ... });
    // return NextResponse.json({ url: session.url });

    return NextResponse.json({
      url: null,
      message: "Stripe integration pending. Contact sales@clockflow.io to manage your subscription.",
    });
  } catch (error) {
    console.error("POST /api/billing/portal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

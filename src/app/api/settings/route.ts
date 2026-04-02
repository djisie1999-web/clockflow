import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations";

// GET /api/settings — Get tenant settings
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
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        timezone: true,
        country: true,
        planTier: true,
        subscriptionStatus: true,
        employeeLimit: true,
        trialEndsAt: true,
        onboardingComplete: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ settings: tenant });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/settings — Update tenant settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.logo !== undefined) updateData.logo = parsed.data.logo;
    if (parsed.data.primaryColor !== undefined) updateData.primaryColor = parsed.data.primaryColor;
    if (parsed.data.timezone !== undefined) updateData.timezone = parsed.data.timezone;
    if (parsed.data.country !== undefined) updateData.country = parsed.data.country;

    const tenant = await db.tenant.update({
      where: { id: user.tenantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        timezone: true,
        country: true,
        planTier: true,
        subscriptionStatus: true,
        employeeLimit: true,
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "UPDATE",
        entityType: "Tenant",
        entityId: tenant.id,
        details: { updatedFields: Object.keys(updateData) },
      },
    });

    return NextResponse.json({ settings: tenant });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

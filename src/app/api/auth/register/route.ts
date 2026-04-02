import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashPassword, generateTokenPair, setAuthCookies } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { companyName, firstName, lastName, email, password } = parsed.data;

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate unique slug
    let slug = slugify(companyName);
    const existingTenant = await db.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create tenant + admin user in a transaction
    const passwordHash = await hashPassword(password);

    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          role: "ADMIN",
          emailVerified: true,
        },
      });

      // Create default leave types
      await tx.leaveType.createMany({
        data: [
          { tenantId: tenant.id, name: "Annual Leave", color: "#10B981", isPaid: true },
          { tenantId: tenant.id, name: "Sick Leave", color: "#EF4444", isPaid: true },
          { tenantId: tenant.id, name: "Unpaid Leave", color: "#6B7280", isPaid: false },
          { tenantId: tenant.id, name: "Maternity Leave", color: "#EC4899", isPaid: true },
          { tenantId: tenant.id, name: "Paternity Leave", color: "#8B5CF6", isPaid: true },
        ],
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: "CREATE",
          entityType: "Tenant",
          entityId: tenant.id,
          details: { event: "account_created", companyName },
        },
      });

      return { tenant, user };
    });

    // Generate tokens and set cookies
    const { accessToken, refreshToken } = await generateTokenPair({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      tenantId: result.user.tenantId,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
    });

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { overtimeRuleSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await db.overtimeRule.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { priority: "desc" },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Overtime GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const parsed = overtimeRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rule = await db.overtimeRule.create({
      data: {
        tenantId: user.tenantId,
        ...parsed.data,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Overtime POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

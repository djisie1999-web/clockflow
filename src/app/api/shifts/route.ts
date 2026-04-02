import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { shiftPatternSchema } from "@/lib/validations";

// GET /api/shifts — List shift patterns with search
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where = {
      tenantId: user.tenantId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            name: { contains: search, mode: "insensitive" as const },
          }
        : {}),
    };

    const shiftPatterns = await db.shiftPattern.findMany({
      where,
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ shiftPatterns });
  } catch (error) {
    console.error("GET /api/shifts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/shifts — Create shift pattern
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
    const parsed = shiftPatternSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check duplicate name
    const existing = await db.shiftPattern.findUnique({
      where: { tenantId_name: { tenantId: user.tenantId, name: parsed.data.name } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A shift pattern with this name already exists" },
        { status: 409 }
      );
    }

    // Calculate expected hours per day from start/end time
    const [startH, startM] = parsed.data.startTime.split(":").map(Number);
    const [endH, endM] = parsed.data.endTime.split(":").map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes <= 0) totalMinutes += 24 * 60; // night shift
    const breakMins = parsed.data.breakPaid ? 0 : (parsed.data.breakDuration || 0);
    const expectedHours = (totalMinutes - breakMins) / 60;

    const shiftPattern = await db.shiftPattern.create({
      data: {
        tenantId: user.tenantId,
        ...parsed.data,
        expectedHoursPerDay: expectedHours,
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "CREATE",
        entityType: "ShiftPattern",
        entityId: shiftPattern.id,
        details: { name: shiftPattern.name },
      },
    });

    return NextResponse.json(shiftPattern, { status: 201 });
  } catch (error) {
    console.error("POST /api/shifts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

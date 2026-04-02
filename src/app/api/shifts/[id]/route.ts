import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { shiftPatternSchema } from "@/lib/validations";

// PUT /api/shifts/[id] — Update shift pattern
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.shiftPattern.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Shift pattern not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = shiftPatternSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check duplicate name (exclude current)
    if (parsed.data.name !== existing.name) {
      const duplicate = await db.shiftPattern.findUnique({
        where: { tenantId_name: { tenantId: user.tenantId, name: parsed.data.name } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A shift pattern with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Calculate expected hours per day
    const [startH, startM] = parsed.data.startTime.split(":").map(Number);
    const [endH, endM] = parsed.data.endTime.split(":").map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes <= 0) totalMinutes += 24 * 60;
    const breakMins = parsed.data.breakPaid ? 0 : (parsed.data.breakDuration || 0);
    const expectedHours = (totalMinutes - breakMins) / 60;

    const shiftPattern = await db.shiftPattern.update({
      where: { id },
      data: {
        ...parsed.data,
        expectedHoursPerDay: expectedHours,
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "UPDATE",
        entityType: "ShiftPattern",
        entityId: shiftPattern.id,
        details: { name: shiftPattern.name },
      },
    });

    return NextResponse.json(shiftPattern);
  } catch (error) {
    console.error("PUT /api/shifts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/shifts/[id] — Delete (only if no active assignments)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.shiftPattern.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Shift pattern not found" }, { status: 404 });
    }

    // Check for active assignments
    const activeAssignments = await db.shiftAssignment.count({
      where: {
        shiftPatternId: id,
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
    });

    if (activeAssignments > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${activeAssignments} active assignment(s) exist. Remove assignments first.` },
        { status: 409 }
      );
    }

    await db.shiftPattern.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "DELETE",
        entityType: "ShiftPattern",
        entityId: id,
        details: { name: existing.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/shifts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

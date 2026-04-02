import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { shiftAssignmentSchema } from "@/lib/validations";

// PUT /api/shift-assignments/[id] — Update
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.shiftAssignment.findFirst({
      where: { id },
      include: { employee: { select: { tenantId: true } } },
    });
    if (!existing || existing.employee.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = shiftAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const effectiveFrom = new Date(parsed.data.effectiveFrom);
    const effectiveTo = parsed.data.effectiveTo ? new Date(parsed.data.effectiveTo) : null;

    // Check for overlapping assignments (exclude current)
    const overlapping = await db.shiftAssignment.findFirst({
      where: {
        id: { not: id },
        employeeId: parsed.data.employeeId,
        AND: [
          { effectiveFrom: { lte: effectiveTo ?? new Date("2099-12-31") } },
          {
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: effectiveFrom } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "Employee already has an overlapping shift assignment for this period" },
        { status: 409 }
      );
    }

    const assignment = await db.shiftAssignment.update({
      where: { id },
      data: {
        employeeId: parsed.data.employeeId,
        shiftPatternId: parsed.data.shiftPatternId,
        effectiveFrom,
        effectiveTo,
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNumber: true },
        },
        shiftPattern: {
          select: { id: true, name: true, startTime: true, endTime: true, color: true },
        },
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "UPDATE",
        entityType: "ShiftAssignment",
        entityId: assignment.id,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("PUT /api/shift-assignments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/shift-assignments/[id] — Delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.shiftAssignment.findFirst({
      where: { id },
      include: { employee: { select: { tenantId: true } } },
    });
    if (!existing || existing.employee.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await db.shiftAssignment.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "DELETE",
        entityType: "ShiftAssignment",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/shift-assignments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

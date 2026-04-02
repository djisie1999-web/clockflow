import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { clockingEditSchema } from "@/lib/validations";

// PUT /api/clockings/[id] — Edit clocking with audit trail
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.clocking.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Clocking not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = clockingEditSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, timestamp, date, notes } = parsed.data;

    const updateData: Record<string, unknown> = {
      editedBy: user.id,
      editedAt: new Date(),
    };

    // Store original timestamp on first edit
    if (timestamp && !existing.originalTimestamp) {
      updateData.originalTimestamp = existing.timestamp;
    }

    if (type) updateData.type = type;
    if (timestamp) updateData.timestamp = new Date(timestamp);
    if (date) updateData.date = new Date(date);
    if (notes !== undefined) updateData.notes = notes || null;

    const updated = await db.clocking.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "UPDATE",
        entityType: "Clocking",
        entityId: id,
        details: {
          changes: parsed.data,
          originalTimestamp: existing.timestamp.toISOString(),
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update clocking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/clockings/[id] — Delete clocking with audit log
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.clocking.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Clocking not found" }, { status: 404 });
    }

    await db.clocking.delete({ where: { id } });

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "DELETE",
        entityType: "Clocking",
        entityId: id,
        details: {
          deletedClocking: {
            type: existing.type,
            timestamp: existing.timestamp.toISOString(),
            employeeId: existing.employeeId,
            employeeName: `${existing.employee.firstName} ${existing.employee.lastName}`,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete clocking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

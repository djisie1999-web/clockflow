import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { departmentSchema } from "@/lib/validations";

// PUT /api/departments/[id] — Update
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

    const existing = await db.department.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check duplicate name (exclude current)
    if (parsed.data.name !== existing.name) {
      const duplicate = await db.department.findUnique({
        where: { tenantId_name: { tenantId: user.tenantId, name: parsed.data.name } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A department with this name already exists" },
          { status: 409 }
        );
      }
    }

    const department = await db.department.update({
      where: { id },
      data: parsed.data,
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "UPDATE",
        entityType: "Department",
        entityId: department.id,
        details: { name: department.name },
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("PUT /api/departments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/departments/[id] — Soft delete
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

    const existing = await db.department.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    await db.department.update({
      where: { id },
      data: { isActive: false },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "DELETE",
        entityType: "Department",
        entityId: id,
        details: { name: existing.name, softDelete: true },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/departments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

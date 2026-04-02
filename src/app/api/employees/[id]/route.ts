import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { employeeSchema } from "@/lib/validations";

// GET /api/employees/[id] — Single employee with relations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const employee = await db.employee.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        department: { select: { id: true, name: true } },
        shiftAssignments: {
          include: { shiftPattern: true },
          orderBy: { effectiveFrom: "desc" },
          take: 10,
        },
        clockings: {
          orderBy: { timestamp: "desc" },
          take: 20,
        },
        leaveRequests: {
          include: { leaveType: { select: { name: true, color: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        leaveAllowances: {
          include: { leaveType: { select: { name: true } } },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/employees/[id] — Update
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

    const existing = await db.employee.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = employeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check duplicate employee number (if changed)
    if (parsed.data.employeeNumber !== existing.employeeNumber) {
      const duplicate = await db.employee.findUnique({
        where: {
          tenantId_employeeNumber: {
            tenantId: user.tenantId,
            employeeNumber: parsed.data.employeeNumber,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "An employee with this number already exists" },
          { status: 409 }
        );
      }
    }

    const employee = await db.employee.update({
      where: { id },
      data: {
        employeeNumber: parsed.data.employeeNumber,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
        nationalInsurance: parsed.data.nationalInsurance || null,
        departmentId: parsed.data.departmentId || null,
        employmentType: parsed.data.employmentType,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        payRate: parsed.data.payRate,
        payFrequency: parsed.data.payFrequency,
        isActive: parsed.data.isActive,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "UPDATE",
        entityType: "Employee",
        entityId: employee.id,
        details: {
          name: `${employee.firstName} ${employee.lastName}`,
          employeeNumber: employee.employeeNumber,
        },
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("PUT /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/employees/[id] — Soft deactivate
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

    const existing = await db.employee.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    await db.employee.update({
      where: { id },
      data: { isActive: false },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "DELETE",
        entityType: "Employee",
        entityId: id,
        details: {
          name: `${existing.firstName} ${existing.lastName}`,
          softDelete: true,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

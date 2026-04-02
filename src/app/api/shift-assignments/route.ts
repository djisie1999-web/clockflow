import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { shiftAssignmentSchema } from "@/lib/validations";

// GET /api/shift-assignments — List assignments with employee/shift filter
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId") || "";
    const shiftPatternId = searchParams.get("shiftPatternId") || "";
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "25")));

    const where = {
      employee: { tenantId: user.tenantId },
      ...(employeeId ? { employeeId } : {}),
      ...(shiftPatternId ? { shiftPatternId } : {}),
      ...(activeOnly
        ? {
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: new Date() } },
            ],
          }
        : {}),
    };

    const [assignments, total] = await Promise.all([
      db.shiftAssignment.findMany({
        where,
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeNumber: true },
          },
          shiftPattern: {
            select: { id: true, name: true, startTime: true, endTime: true, color: true },
          },
        },
        orderBy: { effectiveFrom: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.shiftAssignment.count({ where }),
    ]);

    return NextResponse.json({ assignments, total, page, pageSize });
  } catch (error) {
    console.error("GET /api/shift-assignments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/shift-assignments — Create assignment (validate no overlapping)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = shiftAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify employee belongs to tenant
    const employee = await db.employee.findFirst({
      where: { id: parsed.data.employeeId, tenantId: user.tenantId },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Verify shift pattern belongs to tenant
    const shiftPattern = await db.shiftPattern.findFirst({
      where: { id: parsed.data.shiftPatternId, tenantId: user.tenantId },
    });
    if (!shiftPattern) {
      return NextResponse.json({ error: "Shift pattern not found" }, { status: 404 });
    }

    // Check for overlapping assignments
    const effectiveFrom = new Date(parsed.data.effectiveFrom);
    const effectiveTo = parsed.data.effectiveTo ? new Date(parsed.data.effectiveTo) : null;

    const overlapping = await db.shiftAssignment.findFirst({
      where: {
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

    const assignment = await db.shiftAssignment.create({
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
        action: "CREATE",
        entityType: "ShiftAssignment",
        entityId: assignment.id,
        details: {
          employeeName: `${employee.firstName} ${employee.lastName}`,
          shiftName: shiftPattern.name,
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("POST /api/shift-assignments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

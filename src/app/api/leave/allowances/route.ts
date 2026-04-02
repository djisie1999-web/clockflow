import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { leaveAllowanceSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    const year = url.searchParams.get("year");

    const where: Record<string, unknown> = {
      employee: { tenantId: user.tenantId },
    };
    if (employeeId) where.employeeId = employeeId;
    if (year) where.year = parseInt(year);

    const allowances = await db.leaveAllowance.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        leaveType: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ employee: { lastName: "asc" } }, { leaveType: { name: "asc" } }],
    });

    return NextResponse.json(allowances);
  } catch (error) {
    console.error("Leave allowances GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const parsed = leaveAllowanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Validate employee belongs to tenant
    const employee = await db.employee.findFirst({
      where: { id: parsed.data.employeeId, tenantId: user.tenantId },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Upsert allowance
    const allowance = await db.leaveAllowance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: parsed.data.employeeId,
          leaveTypeId: parsed.data.leaveTypeId,
          year: parsed.data.year,
        },
      },
      update: {
        totalDays: parsed.data.totalDays,
        carriedOver: parsed.data.carriedOver,
      },
      create: {
        employeeId: parsed.data.employeeId,
        leaveTypeId: parsed.data.leaveTypeId,
        year: parsed.data.year,
        totalDays: parsed.data.totalDays,
        carriedOver: parsed.data.carriedOver,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        leaveType: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(allowance, { status: 201 });
  } catch (error) {
    console.error("Leave allowances POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

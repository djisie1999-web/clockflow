import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());
    const departmentId = url.searchParams.get("departmentId");
    const employeeId = url.searchParams.get("employeeId");

    const employeeWhere: Record<string, unknown> = {
      tenantId: user.tenantId,
      isActive: true,
    };
    if (departmentId) employeeWhere.departmentId = departmentId;
    if (employeeId) employeeWhere.id = employeeId;

    const employees = await db.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        department: { select: { name: true } },
        leaveAllowances: {
          where: { year },
          include: { leaveType: { select: { id: true, name: true, color: true } } },
        },
      },
      orderBy: { lastName: "asc" },
    });

    const rows = employees.map((emp) => ({
      employeeId: emp.id,
      employeeNumber: emp.employeeNumber,
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department?.name || "Unassigned",
      allowances: emp.leaveAllowances.map((a) => ({
        leaveType: a.leaveType.name,
        leaveTypeColor: a.leaveType.color,
        totalDays: Number(a.totalDays),
        carriedOver: Number(a.carriedOver),
        usedDays: Number(a.usedDays),
        remaining: Number(a.totalDays) + Number(a.carriedOver) - Number(a.usedDays),
      })),
    }));

    const totalAllowance = rows.reduce(
      (s, r) => s + r.allowances.reduce((a, b) => a + b.totalDays + b.carriedOver, 0),
      0
    );
    const totalUsed = rows.reduce(
      (s, r) => s + r.allowances.reduce((a, b) => a + b.usedDays, 0),
      0
    );

    return NextResponse.json({
      rows,
      summary: {
        totalEmployees: employees.length,
        totalAllowance: Math.round(totalAllowance * 10) / 10,
        totalUsed: Math.round(totalUsed * 10) / 10,
        totalRemaining: Math.round((totalAllowance - totalUsed) * 10) / 10,
        year,
      },
    });
  } catch (error) {
    console.error("Leave balance report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

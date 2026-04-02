import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const departmentId = url.searchParams.get("departmentId");
    const employeeId = url.searchParams.get("employeeId");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

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
      },
      orderBy: { lastName: "asc" },
    });

    const clockings = await db.clocking.findMany({
      where: {
        tenantId: user.tenantId,
        timestamp: { gte: start, lte: end },
        employeeId: { in: employees.map((e) => e.id) },
      },
      orderBy: [{ employeeId: "asc" }, { timestamp: "asc" }],
      select: { employeeId: true, type: true, timestamp: true },
    });

    // Calculate hours per employee
    const hoursMap = new Map<string, number>();
    const empClockings = new Map<string, { clockIn: Date | null }>();

    for (const c of clockings) {
      if (!empClockings.has(c.employeeId)) {
        empClockings.set(c.employeeId, { clockIn: null });
        hoursMap.set(c.employeeId, 0);
      }
      const state = empClockings.get(c.employeeId)!;

      if (c.type === "CLOCK_IN") {
        state.clockIn = c.timestamp;
      } else if (c.type === "CLOCK_OUT" && state.clockIn) {
        const ms = c.timestamp.getTime() - state.clockIn.getTime();
        hoursMap.set(c.employeeId, (hoursMap.get(c.employeeId) || 0) + ms / 3600000);
        state.clockIn = null;
      }
    }

    const rows = employees.map((emp) => {
      const totalHours = Math.round((hoursMap.get(emp.id) || 0) * 100) / 100;
      return {
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || "Unassigned",
        totalHours,
      };
    });

    // Department aggregates
    const byDepartment = new Map<string, { hours: number; count: number }>();
    for (const row of rows) {
      const dept = row.department;
      if (!byDepartment.has(dept)) byDepartment.set(dept, { hours: 0, count: 0 });
      const d = byDepartment.get(dept)!;
      d.hours += row.totalHours;
      d.count++;
    }

    const departmentBreakdown = Array.from(byDepartment.entries()).map(([name, data]) => ({
      department: name,
      totalHours: Math.round(data.hours * 100) / 100,
      avgHours: Math.round((data.hours / data.count) * 100) / 100,
      employeeCount: data.count,
    }));

    const totalHours = rows.reduce((s, r) => s + r.totalHours, 0);

    return NextResponse.json({
      rows,
      departmentBreakdown,
      summary: {
        totalEmployees: employees.length,
        totalHours: Math.round(totalHours * 100) / 100,
        avgHoursPerEmployee: employees.length > 0 ? Math.round((totalHours / employees.length) * 100) / 100 : 0,
      },
    });
  } catch (error) {
    console.error("Hours report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

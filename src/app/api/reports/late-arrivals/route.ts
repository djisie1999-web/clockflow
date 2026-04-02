import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfDay, endOfDay, format } from "date-fns";

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
        shiftAssignments: {
          where: {
            effectiveFrom: { lte: end },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
          },
          include: { shiftPattern: { select: { startTime: true, days: true } } },
          take: 1,
        },
      },
      orderBy: { lastName: "asc" },
    });

    // Get first clock-in per employee per day
    const clockIns = await db.clocking.findMany({
      where: {
        tenantId: user.tenantId,
        type: "CLOCK_IN",
        timestamp: { gte: start, lte: end },
        employeeId: { in: employees.map((e) => e.id) },
      },
      orderBy: { timestamp: "asc" },
      select: { employeeId: true, timestamp: true, date: true },
    });

    // Group first clock-in per employee per day
    const firstClockIn = new Map<string, Date>();
    for (const c of clockIns) {
      const key = `${c.employeeId}_${format(c.date, "yyyy-MM-dd")}`;
      if (!firstClockIn.has(key)) {
        firstClockIn.set(key, c.timestamp);
      }
    }

    const lateArrivals: Array<{
      employeeId: string;
      employeeNumber: string;
      name: string;
      department: string;
      date: string;
      shiftStart: string;
      clockedIn: string;
      lateMinutes: number;
    }> = [];

    for (const emp of employees) {
      const assignment = emp.shiftAssignments[0];
      if (!assignment) continue;

      const shiftStartTime = assignment.shiftPattern.startTime;
      const [shiftH, shiftM] = shiftStartTime.split(":").map(Number);

      for (const [key, clockTime] of firstClockIn.entries()) {
        if (!key.startsWith(emp.id)) continue;

        const clockH = clockTime.getHours();
        const clockM = clockTime.getMinutes();
        const shiftMinutes = shiftH * 60 + shiftM;
        const clockMinutes = clockH * 60 + clockM;

        if (clockMinutes > shiftMinutes) {
          const lateBy = clockMinutes - shiftMinutes;
          lateArrivals.push({
            employeeId: emp.id,
            employeeNumber: emp.employeeNumber,
            name: `${emp.firstName} ${emp.lastName}`,
            department: emp.department?.name || "Unassigned",
            date: key.split("_")[1],
            shiftStart: shiftStartTime,
            clockedIn: format(clockTime, "HH:mm"),
            lateMinutes: lateBy,
          });
        }
      }
    }

    lateArrivals.sort((a, b) => b.lateMinutes - a.lateMinutes);

    const uniqueEmployees = new Set(lateArrivals.map((r) => r.employeeId)).size;
    const totalLateMinutes = lateArrivals.reduce((s, r) => s + r.lateMinutes, 0);

    return NextResponse.json({
      rows: lateArrivals,
      summary: {
        totalLateInstances: lateArrivals.length,
        uniqueEmployees,
        totalLateMinutes,
        avgLateMinutes: lateArrivals.length > 0 ? Math.round(totalLateMinutes / lateArrivals.length) : 0,
      },
    });
  } catch (error) {
    console.error("Late arrivals report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

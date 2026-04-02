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
        payRate: true,
        department: { select: { name: true } },
      },
      orderBy: { lastName: "asc" },
    });

    // Get overtime rules
    const rules = await db.overtimeRule.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { priority: "desc" },
    });

    // Get clockings and calculate daily hours
    const clockings = await db.clocking.findMany({
      where: {
        tenantId: user.tenantId,
        timestamp: { gte: start, lte: end },
        employeeId: { in: employees.map((e) => e.id) },
      },
      orderBy: [{ employeeId: "asc" }, { timestamp: "asc" }],
      select: { employeeId: true, type: true, timestamp: true, date: true },
    });

    // Calculate daily hours per employee
    const dailyHours = new Map<string, Map<string, number>>();
    const empState = new Map<string, Date | null>();

    for (const c of clockings) {
      const dateKey = c.date.toISOString().slice(0, 10);
      if (!dailyHours.has(c.employeeId)) dailyHours.set(c.employeeId, new Map());
      const empDays = dailyHours.get(c.employeeId)!;

      if (c.type === "CLOCK_IN") {
        empState.set(c.employeeId, c.timestamp);
      } else if (c.type === "CLOCK_OUT") {
        const clockIn = empState.get(c.employeeId);
        if (clockIn) {
          const hrs = (c.timestamp.getTime() - clockIn.getTime()) / 3600000;
          empDays.set(dateKey, (empDays.get(dateKey) || 0) + hrs);
          empState.set(c.employeeId, null);
        }
      }
    }

    // Apply daily overtime rules
    const dailyThreshold = rules.find((r) => r.triggerType === "DAILY");
    const threshold = dailyThreshold ? Number(dailyThreshold.thresholdHours) : 8;
    const multiplier = dailyThreshold ? Number(dailyThreshold.multiplier) : 1.5;

    const rows = employees.map((emp) => {
      const empDays = dailyHours.get(emp.id);
      let totalOvertimeHours = 0;

      if (empDays) {
        for (const hours of empDays.values()) {
          if (hours > threshold) {
            totalOvertimeHours += hours - threshold;
          }
        }
      }

      const overtimeCost = Math.round(totalOvertimeHours * Number(emp.payRate) * multiplier * 100) / 100;

      return {
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || "Unassigned",
        overtimeHours: Math.round(totalOvertimeHours * 100) / 100,
        multiplier,
        overtimeCost,
      };
    });

    const totalOTHours = rows.reduce((s, r) => s + r.overtimeHours, 0);
    const totalOTCost = rows.reduce((s, r) => s + r.overtimeCost, 0);

    return NextResponse.json({
      rows,
      summary: {
        totalEmployees: employees.length,
        totalOvertimeHours: Math.round(totalOTHours * 100) / 100,
        totalOvertimeCost: Math.round(totalOTCost * 100) / 100,
        avgOvertimePerEmployee: employees.length > 0 ? Math.round((totalOTHours / employees.length) * 100) / 100 : 0,
      },
    });
  } catch (error) {
    console.error("Overtime report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

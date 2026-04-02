import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = user.tenantId;
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    const [totalEmployees, activeToday, todayClockings, pendingLeave] =
      await Promise.all([
        // Total active employees
        db.employee.count({
          where: { tenantId, isActive: true },
        }),

        // Employees who clocked in today
        db.clocking.groupBy({
          by: ["employeeId"],
          where: {
            tenantId,
            type: "CLOCK_IN",
            timestamp: { gte: dayStart, lte: dayEnd },
          },
        }),

        // All clockings today for hour calculation
        db.clocking.findMany({
          where: {
            tenantId,
            timestamp: { gte: dayStart, lte: dayEnd },
          },
          orderBy: { timestamp: "asc" },
          select: {
            employeeId: true,
            type: true,
            timestamp: true,
          },
        }),

        // Pending leave requests
        db.leaveRequest.count({
          where: { tenantId, status: "PENDING" },
        }),
      ]);

    // Calculate total hours worked today
    let hoursToday = 0;
    const employeeClockings = new Map<
      string,
      { clockIn: Date | null; totalMs: number }
    >();

    for (const c of todayClockings) {
      if (!employeeClockings.has(c.employeeId)) {
        employeeClockings.set(c.employeeId, { clockIn: null, totalMs: 0 });
      }
      const emp = employeeClockings.get(c.employeeId)!;

      if (c.type === "CLOCK_IN") {
        emp.clockIn = c.timestamp;
      } else if (c.type === "CLOCK_OUT" && emp.clockIn) {
        emp.totalMs += c.timestamp.getTime() - emp.clockIn.getTime();
        emp.clockIn = null;
      }
    }

    // Add still-clocked-in time
    for (const emp of employeeClockings.values()) {
      if (emp.clockIn) {
        emp.totalMs += today.getTime() - emp.clockIn.getTime();
      }
      hoursToday += emp.totalMs / (1000 * 60 * 60);
    }

    return NextResponse.json({
      totalEmployees,
      activeToday: activeToday.length,
      hoursToday: Math.round(hoursToday * 10) / 10,
      pendingLeave,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

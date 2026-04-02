import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfDay, endOfDay, parseISO, eachDayOfInterval, format } from "date-fns";
import { buildDailySummary, type ClockEvent } from "@/lib/timesheet-calculator";

// GET /api/timesheets — Structured daily summaries
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const employeeId = searchParams.get("employeeId");
    const departmentId = searchParams.get("departmentId");

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 }
      );
    }

    const start = startOfDay(parseISO(dateFrom));
    const end = endOfDay(parseISO(dateTo));

    // Build employee filter
    const employeeWhere: Record<string, unknown> = {
      tenantId: user.tenantId,
      isActive: true,
    };

    if (employeeId) {
      employeeWhere.id = employeeId;
    }

    if (departmentId) {
      employeeWhere.departmentId = departmentId;
    }

    // Get employees matching filter
    const employees = await db.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        departmentId: true,
        department: { select: { name: true } },
        shiftAssignments: {
          where: {
            effectiveFrom: { lte: end },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: start } },
            ],
          },
          include: {
            shiftPattern: {
              select: {
                expectedHoursPerDay: true,
                breakDuration: true,
                breakPaid: true,
              },
            },
          },
          take: 1,
          orderBy: { effectiveFrom: "desc" },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const employeeIds = employees.map((e) => e.id);

    // Get all clockings for these employees in date range
    const clockings = await db.clocking.findMany({
      where: {
        tenantId: user.tenantId,
        employeeId: { in: employeeIds },
        timestamp: { gte: start, lte: end },
      },
      orderBy: { timestamp: "asc" },
    });

    // Group clockings by employee and date
    const clockingMap = new Map<string, ClockEvent[]>();
    for (const c of clockings) {
      const dateKey = format(c.timestamp, "yyyy-MM-dd");
      const key = `${c.employeeId}|${dateKey}`;
      if (!clockingMap.has(key)) {
        clockingMap.set(key, []);
      }
      clockingMap.get(key)!.push({
        id: c.id,
        employeeId: c.employeeId,
        type: c.type,
        timestamp: c.timestamp,
        date: c.date,
      });
    }

    // Build summaries for each employee/date
    const days = eachDayOfInterval({ start, end });
    const timesheets = employees.map((emp) => {
      const shift = emp.shiftAssignments[0]?.shiftPattern;
      const expectedMinutes = shift
        ? Number(shift.expectedHoursPerDay) * 60
        : 480; // default 8h

      const dailySummaries = days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const key = `${emp.id}|${dateKey}`;
        const dayClockings = clockingMap.get(key) || [];
        return buildDailySummary(emp.id, dateKey, dayClockings, expectedMinutes);
      });

      const totalWorkedMinutes = dailySummaries.reduce(
        (sum, d) => sum + d.workedMinutes,
        0
      );
      const totalOvertimeMinutes = dailySummaries.reduce(
        (sum, d) => sum + d.overtimeMinutes,
        0
      );

      return {
        employee: {
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          employeeNumber: emp.employeeNumber,
          department: emp.department?.name || null,
        },
        days: dailySummaries,
        totalWorkedHours: Math.round((totalWorkedMinutes / 60) * 100) / 100,
        totalOvertimeHours: Math.round((totalOvertimeMinutes / 60) * 100) / 100,
      };
    });

    return NextResponse.json({
      dateFrom: format(start, "yyyy-MM-dd"),
      dateTo: format(end, "yyyy-MM-dd"),
      timesheets,
    });
  } catch (error) {
    console.error("Timesheet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

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
        type: "CLOCK_IN",
        ...(employeeId ? { employeeId } : {}),
      },
      select: { employeeId: true, date: true },
    });

    // Get shift assignments to determine expected days
    const shiftAssignments = await db.shiftAssignment.findMany({
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        effectiveFrom: { lte: end },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
      },
      include: { shiftPattern: { select: { days: true, startTime: true } } },
    });

    const clockedDays = new Map<string, Set<string>>();
    for (const c of clockings) {
      const key = c.employeeId;
      if (!clockedDays.has(key)) clockedDays.set(key, new Set());
      clockedDays.get(key)!.add(format(c.date, "yyyy-MM-dd"));
    }

    const days = eachDayOfInterval({ start, end });
    const shiftMap = new Map<string, number[]>();
    for (const sa of shiftAssignments) {
      shiftMap.set(sa.employeeId, sa.shiftPattern.days as number[]);
    }

    const rows = employees.map((emp) => {
      const clocked = clockedDays.get(emp.id) || new Set();
      const assignedDays = shiftMap.get(emp.id) || [1, 2, 3, 4, 5];
      let expectedDays = 0;
      let present = 0;
      let absent = 0;

      for (const day of days) {
        const dayOfWeek = day.getDay();
        if (assignedDays.includes(dayOfWeek)) {
          expectedDays++;
          if (clocked.has(format(day, "yyyy-MM-dd"))) {
            present++;
          } else {
            absent++;
          }
        }
      }

      return {
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || "Unassigned",
        expectedDays,
        present,
        absent,
        attendanceRate: expectedDays > 0 ? Math.round((present / expectedDays) * 100) : 0,
      };
    });

    const totalPresent = rows.reduce((s, r) => s + r.present, 0);
    const totalExpected = rows.reduce((s, r) => s + r.expectedDays, 0);

    return NextResponse.json({
      rows,
      summary: {
        totalEmployees: employees.length,
        totalPresent,
        totalAbsent: rows.reduce((s, r) => s + r.absent, 0),
        overallAttendanceRate: totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Attendance report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

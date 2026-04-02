import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { leaveRequestSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const employeeId = url.searchParams.get("employeeId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const where: Record<string, unknown> = { tenantId: user.tenantId };
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) (where.startDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.startDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const requests = await db.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        leaveType: { select: { id: true, name: true, color: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Leave requests GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = leaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { employeeId, leaveTypeId, startDate, endDate, halfDay, totalDays, reason } = parsed.data;

    // Validate employee belongs to tenant
    const employee = await db.employee.findFirst({
      where: { id: employeeId, tenantId: user.tenantId },
    });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    // Check allowance
    const year = start.getFullYear();
    const allowance = await db.leaveAllowance.findFirst({
      where: { employeeId, leaveTypeId, year },
    });
    if (allowance) {
      const remaining = Number(allowance.totalDays) + Number(allowance.carriedOver) - Number(allowance.usedDays);
      if (totalDays > remaining) {
        return NextResponse.json(
          { error: `Insufficient leave balance. Remaining: ${remaining} days` },
          { status: 400 }
        );
      }
    }

    // Detect overlapping leave requests
    const overlapping = await db.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });
    if (overlapping) {
      return NextResponse.json(
        { error: "Overlapping leave request exists for this period" },
        { status: 409 }
      );
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        tenantId: user.tenantId,
        employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        halfDay,
        totalDays,
        reason,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        leaveType: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error("Leave requests POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

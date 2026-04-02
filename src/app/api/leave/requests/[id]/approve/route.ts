import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await db.leaveRequest.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending requests can be approved" }, { status: 400 });
    }

    // Approve and update allowance in a transaction
    const result = await db.$transaction(async (tx) => {
      const leaveRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById: user.id,
          approvedAt: new Date(),
        },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
          leaveType: { select: { id: true, name: true, color: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Update used days on the allowance
      const year = leaveRequest.startDate.getFullYear();
      const allowance = await tx.leaveAllowance.findFirst({
        where: {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
          year,
        },
      });

      if (allowance) {
        await tx.leaveAllowance.update({
          where: { id: allowance.id },
          data: {
            usedDays: { increment: Number(leaveRequest.totalDays) },
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: "APPROVE",
          entityType: "LeaveRequest",
          entityId: id,
          details: {
            employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
            leaveType: leaveRequest.leaveType.name,
            totalDays: Number(leaveRequest.totalDays),
          },
        },
      });

      return leaveRequest;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Leave approve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

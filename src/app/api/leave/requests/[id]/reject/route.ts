import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const rejectionReason = body.reason as string | undefined;

    const existing = await db.leaveRequest.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending requests can be rejected" }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const leaveRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedById: user.id,
          approvedAt: new Date(),
          rejectionReason,
        },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
          leaveType: { select: { id: true, name: true, color: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: "REJECT",
          entityType: "LeaveRequest",
          entityId: id,
          details: {
            employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
            leaveType: leaveRequest.leaveType.name,
            reason: rejectionReason,
          },
        },
      });

      return leaveRequest;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Leave reject error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

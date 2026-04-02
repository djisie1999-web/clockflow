import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { leaveRequestSchema } from "@/lib/validations";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.leaveRequest.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending requests can be updated" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = leaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { startDate, endDate, halfDay, totalDays, reason, leaveTypeId } = parsed.data;

    const leaveRequest = await db.leaveRequest.update({
      where: { id },
      data: {
        leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        halfDay,
        totalDays,
        reason,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        leaveType: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Leave request PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

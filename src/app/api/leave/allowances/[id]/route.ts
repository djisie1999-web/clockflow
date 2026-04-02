import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
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

    const existing = await db.leaveAllowance.findUnique({
      where: { id },
      include: { employee: { select: { tenantId: true } } },
    });
    if (!existing || existing.employee.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const allowance = await db.leaveAllowance.update({
      where: { id },
      data: {
        totalDays: body.totalDays ?? undefined,
        carriedOver: body.carriedOver ?? undefined,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        leaveType: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(allowance);
  } catch (error) {
    console.error("Leave allowance PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

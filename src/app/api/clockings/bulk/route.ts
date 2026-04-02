import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { bulkClockingSchema } from "@/lib/validations";

// POST /api/clockings/bulk — Bulk upload clockings
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bulkClockingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const tenantId = user.tenantId;

    // Verify all employee IDs belong to the tenant
    const employeeIds = [...new Set(parsed.data.clockings.map((c) => c.employeeId))];
    const validEmployees = await db.employee.findMany({
      where: { id: { in: employeeIds }, tenantId },
      select: { id: true },
    });
    const validEmployeeIds = new Set(validEmployees.map((e) => e.id));

    const errors: { index: number; error: string }[] = [];
    const validClockings: {
      tenantId: string;
      employeeId: string;
      type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";
      timestamp: Date;
      date: Date;
      source: "MANUAL" | "PORTAL" | "KIOSK" | "MOBILE" | "API";
      notes: string | null;
    }[] = [];

    for (let i = 0; i < parsed.data.clockings.length; i++) {
      const c = parsed.data.clockings[i];
      if (!validEmployeeIds.has(c.employeeId)) {
        errors.push({ index: i, error: `Employee ${c.employeeId} not found in tenant` });
        continue;
      }
      validClockings.push({
        tenantId,
        employeeId: c.employeeId,
        type: c.type,
        timestamp: new Date(c.timestamp),
        date: new Date(c.date),
        source: c.source || "MANUAL",
        notes: c.notes || null,
      });
    }

    let created = 0;
    if (validClockings.length > 0) {
      const result = await db.clocking.createMany({
        data: validClockings,
      });
      created = result.count;
    }

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: "IMPORT",
        entityType: "Clocking",
        details: {
          totalSubmitted: parsed.data.clockings.length,
          created,
          errors: errors.length,
        },
      },
    });

    return NextResponse.json({
      created,
      errors,
      total: parsed.data.clockings.length,
    }, { status: 201 });
  } catch (error) {
    console.error("Bulk clocking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

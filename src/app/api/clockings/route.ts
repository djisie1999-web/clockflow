import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { clockingSchema } from "@/lib/validations";
import { startOfDay, endOfDay, parseISO } from "date-fns";

// GET /api/clockings — List clockings with filters + pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const employeeId = searchParams.get("employeeId");
    const type = searchParams.get("type");

    // Build where clause
    const where: Record<string, unknown> = {
      tenantId: user.tenantId,
    };

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        (where.timestamp as Record<string, unknown>).gte = startOfDay(parseISO(dateFrom));
      }
      if (dateTo) {
        (where.timestamp as Record<string, unknown>).lte = endOfDay(parseISO(dateTo));
      }
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (type && ["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"].includes(type)) {
      where.type = type;
    }

    const [clockings, total] = await Promise.all([
      db.clocking.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      db.clocking.count({ where }),
    ]);

    return NextResponse.json({
      clockings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List clockings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/clockings — Create manual clocking entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = clockingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { employeeId, type, timestamp, date, source, notes, latitude, longitude } = parsed.data;

    // Verify employee belongs to tenant
    const employee = await db.employee.findFirst({
      where: { id: employeeId, tenantId: user.tenantId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const clocking = await db.clocking.create({
      data: {
        tenantId: user.tenantId,
        employeeId,
        type,
        timestamp: new Date(timestamp),
        date: new Date(date),
        source: source || "MANUAL",
        notes: notes || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "CREATE",
        entityType: "Clocking",
        entityId: clocking.id,
        details: { type, employeeId, source: source || "MANUAL" },
      },
    });

    return NextResponse.json(clocking, { status: 201 });
  } catch (error) {
    console.error("Create clocking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

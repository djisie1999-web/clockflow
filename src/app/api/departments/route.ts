import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { departmentSchema } from "@/lib/validations";

// GET /api/departments — List with search, pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "25")));
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where = {
      tenantId: user.tenantId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { code: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [departments, total] = await Promise.all([
      db.department.findMany({
        where,
        include: { _count: { select: { employees: true } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.department.count({ where }),
    ]);

    return NextResponse.json({ departments, total, page, pageSize });
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/departments — Create
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = departmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check duplicate name
    const existing = await db.department.findUnique({
      where: { tenantId_name: { tenantId: user.tenantId, name: parsed.data.name } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 409 }
      );
    }

    const department = await db.department.create({
      data: {
        tenantId: user.tenantId,
        ...parsed.data,
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "CREATE",
        entityType: "Department",
        entityId: department.id,
        details: { name: department.name },
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("POST /api/departments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { employeeSchema } from "@/lib/validations";

// GET /api/employees — List with search, filter, pagination, sorting
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const employmentType = searchParams.get("employmentType") || "";
    const status = searchParams.get("status") || "active"; // active | inactive | all
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "25")));
    const sortField = searchParams.get("sortField") || "lastName";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    const where: Record<string, unknown> = {
      tenantId: user.tenantId,
    };

    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;

    if (departmentId) where.departmentId = departmentId;
    if (employmentType) where.employmentType = employmentType;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy
    const allowedSortFields = [
      "firstName",
      "lastName",
      "employeeNumber",
      "startDate",
      "employmentType",
    ];
    const orderByField = allowedSortFields.includes(sortField) ? sortField : "lastName";

    const [employees, total] = await Promise.all([
      db.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.employee.count({ where }),
    ]);

    return NextResponse.json({ employees, total, page, pageSize });
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/employees — Create with auto-generated employee number
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Auto-generate employee number if not provided
    if (!body.employeeNumber) {
      const lastEmployee = await db.employee.findFirst({
        where: { tenantId: user.tenantId },
        orderBy: { employeeNumber: "desc" },
        select: { employeeNumber: true },
      });

      let nextNum = 1;
      if (lastEmployee?.employeeNumber) {
        const match = lastEmployee.employeeNumber.match(/(\d+)$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      body.employeeNumber = `EMP${String(nextNum).padStart(4, "0")}`;
    }

    const parsed = employeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check duplicate employee number
    const existing = await db.employee.findUnique({
      where: {
        tenantId_employeeNumber: {
          tenantId: user.tenantId,
          employeeNumber: parsed.data.employeeNumber,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An employee with this number already exists" },
        { status: 409 }
      );
    }

    const employee = await db.employee.create({
      data: {
        tenantId: user.tenantId,
        employeeNumber: parsed.data.employeeNumber,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
        nationalInsurance: parsed.data.nationalInsurance || null,
        departmentId: parsed.data.departmentId || null,
        employmentType: parsed.data.employmentType,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        payRate: parsed.data.payRate,
        payFrequency: parsed.data.payFrequency,
        isActive: parsed.data.isActive,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "CREATE",
        entityType: "Employee",
        entityId: employee.id,
        details: {
          name: `${employee.firstName} ${employee.lastName}`,
          employeeNumber: employee.employeeNumber,
        },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

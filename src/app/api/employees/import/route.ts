import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { employeeSchema } from "@/lib/validations";

interface CsvRow {
  [key: string]: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

// Column name mapping (flexible CSV headers)
function mapCsvRow(row: CsvRow) {
  return {
    firstName: row["firstName"] || row["first_name"] || row["First Name"] || "",
    lastName: row["lastName"] || row["last_name"] || row["Last Name"] || "",
    email: row["email"] || row["Email"] || "",
    phone: row["phone"] || row["Phone"] || "",
    employeeNumber: row["employeeNumber"] || row["employee_number"] || row["Employee Number"] || "",
    departmentName: row["department"] || row["Department"] || "",
    employmentType: (row["employmentType"] || row["employment_type"] || row["Employment Type"] || "FULL_TIME").toUpperCase(),
    startDate: row["startDate"] || row["start_date"] || row["Start Date"] || "",
    payRate: row["payRate"] || row["pay_rate"] || row["Pay Rate"] || "0",
    payFrequency: (row["payFrequency"] || row["pay_frequency"] || row["Pay Frequency"] || "MONTHLY").toUpperCase(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const csvRows = parseCsv(text);

    if (csvRows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or has no data rows" }, { status: 400 });
    }

    // Get departments for name->id mapping
    const departments = await db.department.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, name: true },
    });
    const deptMap = new Map(departments.map((d) => [d.name.toLowerCase(), d.id]));

    // Get next employee number
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

    const results: { row: number; status: "success" | "error"; error?: string; employeeNumber?: string }[] = [];

    for (let i = 0; i < csvRows.length; i++) {
      const mapped = mapCsvRow(csvRows[i]);

      // Auto-assign employee number if missing
      if (!mapped.employeeNumber) {
        mapped.employeeNumber = `EMP${String(nextNum).padStart(4, "0")}`;
        nextNum++;
      }

      // Resolve department
      let departmentId: string | undefined;
      if (mapped.departmentName) {
        departmentId = deptMap.get(mapped.departmentName.toLowerCase());
      }

      // Validate employment type
      const validTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "CASUAL"];
      const empType = validTypes.includes(mapped.employmentType)
        ? mapped.employmentType
        : "FULL_TIME";

      const validFrequencies = ["WEEKLY", "BIWEEKLY", "FOUR_WEEKLY", "MONTHLY"];
      const payFreq = validFrequencies.includes(mapped.payFrequency)
        ? mapped.payFrequency
        : "MONTHLY";

      const rowData = {
        employeeNumber: mapped.employeeNumber,
        firstName: mapped.firstName,
        lastName: mapped.lastName,
        email: mapped.email || undefined,
        phone: mapped.phone || undefined,
        departmentId: departmentId || undefined,
        employmentType: empType,
        startDate: mapped.startDate || new Date().toISOString().split("T")[0],
        payRate: parseFloat(mapped.payRate) || 0,
        payFrequency: payFreq,
        isActive: true,
      };

      const parsed = employeeSchema.safeParse(rowData);
      if (!parsed.success) {
        const errors = parsed.error.flatten();
        const errorMsg = Object.entries(errors.fieldErrors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join("; ");
        results.push({ row: i + 2, status: "error", error: errorMsg });
        continue;
      }

      try {
        await db.employee.create({
          data: {
            tenantId: user.tenantId!,
            employeeNumber: parsed.data.employeeNumber,
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            email: parsed.data.email || null,
            phone: parsed.data.phone || null,
            departmentId: departmentId || null,
            employmentType: parsed.data.employmentType as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "CASUAL",
            startDate: new Date(parsed.data.startDate),
            payRate: parsed.data.payRate,
            payFrequency: parsed.data.payFrequency as "WEEKLY" | "BIWEEKLY" | "FOUR_WEEKLY" | "MONTHLY",
            isActive: true,
          },
        });
        results.push({ row: i + 2, status: "success", employeeNumber: parsed.data.employeeNumber });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({ row: i + 2, status: "error", error: message });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "IMPORT",
        entityType: "Employee",
        details: {
          totalRows: csvRows.length,
          successCount,
          errorCount,
        },
      },
    });

    return NextResponse.json({
      total: csvRows.length,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    console.error("POST /api/employees/import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

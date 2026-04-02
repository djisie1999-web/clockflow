import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-company" },
    update: {},
    create: {
      name: "Demo Company",
      slug: "demo-company",
      planTier: "PRO",
      subscriptionStatus: "ACTIVE",
      employeeLimit: 50,
      onboardingComplete: true,
    },
  });

  // Create admin user
  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@demo.com",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  // Create departments
  const departments = await Promise.all(
    [
      { name: "Operations", code: "OPS" },
      { name: "Engineering", code: "ENG" },
      { name: "Sales", code: "SALES" },
      { name: "HR", code: "HR" },
    ].map((dept) =>
      prisma.department.upsert({
        where: {
          tenantId_name: { tenantId: tenant.id, name: dept.name },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          ...dept,
        },
      })
    )
  );

  // Create shift pattern
  const shift = await prisma.shiftPattern.upsert({
    where: {
      tenantId_name: { tenantId: tenant.id, name: "Standard 9-5" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Standard 9-5",
      startTime: "09:00",
      endTime: "17:00",
      days: [1, 2, 3, 4, 5],
      breakDuration: 60,
      breakPaid: false,
      breakTriggerMinutes: 360,
      expectedHoursPerDay: 7.0,
      color: "#3B82F6",
    },
  });

  // Create leave types
  await Promise.all(
    [
      { name: "Annual Leave", color: "#10B981", isPaid: true },
      { name: "Sick Leave", color: "#EF4444", isPaid: true },
      { name: "Unpaid Leave", color: "#6B7280", isPaid: false },
    ].map((lt) =>
      prisma.leaveType.upsert({
        where: {
          tenantId_name: { tenantId: tenant.id, name: lt.name },
        },
        update: {},
        create: { tenantId: tenant.id, ...lt },
      })
    )
  );

  // Create sample employees
  const employees = [
    { firstName: "James", lastName: "Wilson", employeeNumber: "EMP001" },
    { firstName: "Sarah", lastName: "Chen", employeeNumber: "EMP002" },
    { firstName: "Marcus", lastName: "Johnson", employeeNumber: "EMP003" },
    { firstName: "Emily", lastName: "Taylor", employeeNumber: "EMP004" },
    { firstName: "David", lastName: "Brown", employeeNumber: "EMP005" },
  ];

  for (const emp of employees) {
    const employee = await prisma.employee.upsert({
      where: {
        tenantId_employeeNumber: {
          tenantId: tenant.id,
          employeeNumber: emp.employeeNumber,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        departmentId: departments[Math.floor(Math.random() * departments.length)].id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        employeeNumber: emp.employeeNumber,
        email: `${emp.firstName.toLowerCase()}@demo.com`,
        employmentType: "FULL_TIME",
        startDate: new Date("2024-01-15"),
        payRate: 25000 + Math.floor(Math.random() * 20000),
        payFrequency: "MONTHLY",
      },
    });

    // Assign shift
    await prisma.shiftAssignment.create({
      data: {
        employeeId: employee.id,
        shiftPatternId: shift.id,
        effectiveFrom: new Date("2024-01-15"),
      },
    });
  }

  console.log("Seed complete!");
  console.log(`  Tenant: ${tenant.name} (${tenant.slug})`);
  console.log(`  Admin: ${admin.email} / Admin123!`);
  console.log(`  Employees: ${employees.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

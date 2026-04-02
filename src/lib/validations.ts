import { z } from "zod";

// ─── Auth ───────────────────────────────────────────────────

export const registerSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Employee ───────────────────────────────────────────────

export const employeeSchema = z.object({
  employeeNumber: z.string().min(1, "Employee number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationalInsurance: z.string().optional(),
  departmentId: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "CASUAL"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  payRate: z.coerce.number().min(0, "Pay rate must be positive"),
  payFrequency: z.enum(["WEEKLY", "BIWEEKLY", "FOUR_WEEKLY", "MONTHLY"]),
  isActive: z.boolean().default(true),
});

// ─── Department ─────────────────────────────────────────────

export const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
});

// ─── Shift Pattern ──────────────────────────────────────────

export const shiftPatternSchema = z.object({
  name: z.string().min(1, "Shift name is required"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  days: z.array(z.number().min(0).max(6)).min(1, "Select at least one day"),
  breakDuration: z.coerce.number().min(0).default(0),
  breakPaid: z.boolean().default(false),
  breakTriggerMinutes: z.coerce.number().optional(),
  nightShift: z.boolean().default(false),
  color: z.string().default("#3B82F6"),
  isActive: z.boolean().default(true),
});

// ─── Shift Assignment ───────────────────────────────────────

export const shiftAssignmentSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  shiftPatternId: z.string().min(1, "Shift pattern is required"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().optional(),
});

// ─── Settings ───────────────────────────────────────────────

export const settingsSchema = z.object({
  name: z.string().min(1, "Company name is required").optional(),
  logo: z.string().optional().nullable(),
  primaryColor: z.string().optional(),
  timezone: z.string().optional(),
  country: z.string().optional(),
});

// ─── Clocking ───────────────────────────────────────────────

export const clockingSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
  timestamp: z.string().min(1, "Timestamp is required"),
  date: z.string().min(1, "Working date is required"),
  source: z.enum(["MANUAL", "PORTAL", "KIOSK", "MOBILE", "API"]).default("MANUAL"),
  notes: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

// ─── Leave Type ─────────────────────────────────────────────

export const leaveTypeSchema = z.object({
  name: z.string().min(1, "Leave type name is required"),
  color: z.string().default("#10B981"),
  isPaid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

// ─── Leave Request ──────────────────────────────────────────

export const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  halfDay: z.boolean().default(false),
  totalDays: z.coerce.number().min(0.5, "Minimum 0.5 days"),
  reason: z.string().optional(),
});

// ─── Leave Allowance ────────────────────────────────────────

export const leaveAllowanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  year: z.coerce.number().min(2020).max(2100),
  totalDays: z.coerce.number().min(0),
  carriedOver: z.coerce.number().min(0).default(0),
});

// ─── Overtime Rule ──────────────────────────────────────────

export const overtimeRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  triggerType: z.enum(["DAILY", "WEEKLY", "PERIOD"]),
  thresholdHours: z.coerce.number().min(0, "Threshold must be positive"),
  multiplier: z.coerce.number().min(1, "Multiplier must be at least 1"),
  priority: z.coerce.number().default(0),
  exemptDays: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

// ─── Report Preset ──────────────────────────────────────────

export const reportPresetSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  reportType: z.enum([
    "ATTENDANCE",
    "HOURS",
    "OVERTIME",
    "LATE_ARRIVALS",
    "LEAVE_BALANCE",
    "PAYROLL",
    "PERIOD_TOTALS",
  ]),
  filters: z.record(z.unknown()).default({}),
});

// ─── Bulk Clocking ─────────────────────────────────────────

export const bulkClockingSchema = z.object({
  clockings: z.array(clockingSchema).min(1, "At least one clocking is required").max(500, "Maximum 500 clockings per batch"),
});

// ─── Clocking Edit ─────────────────────────────────────────

export const clockingEditSchema = z.object({
  type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]).optional(),
  timestamp: z.string().min(1, "Timestamp is required").optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Type exports ───────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type ShiftPatternInput = z.infer<typeof shiftPatternSchema>;
export type ShiftAssignmentInput = z.infer<typeof shiftAssignmentSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ClockingInput = z.infer<typeof clockingSchema>;
export type LeaveTypeInput = z.infer<typeof leaveTypeSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type LeaveAllowanceInput = z.infer<typeof leaveAllowanceSchema>;
export type OvertimeRuleInput = z.infer<typeof overtimeRuleSchema>;
export type ReportPresetInput = z.infer<typeof reportPresetSchema>;
export type BulkClockingInput = z.infer<typeof bulkClockingSchema>;
export type ClockingEditInput = z.infer<typeof clockingEditSchema>;

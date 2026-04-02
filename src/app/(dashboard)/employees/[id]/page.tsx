"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, Clock, Calendar, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "@/components/employees/employee-form";
import { formatDate, formatTime, formatCurrency, getInitials } from "@/lib/utils";
import type { EmployeeInput } from "@/lib/validations";

interface EmployeeDetail {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  nationalInsurance: string | null;
  employmentType: string;
  startDate: string;
  endDate: string | null;
  payRate: string;
  payFrequency: string;
  isActive: boolean;
  department: { id: string; name: string } | null;
  shiftAssignments: Array<{
    id: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    shiftPattern: { name: string; startTime: string; endTime: string; color: string };
  }>;
  clockings: Array<{
    id: string;
    type: string;
    timestamp: string;
    date: string;
    source: string;
  }>;
  leaveRequests: Array<{
    id: string;
    startDate: string;
    endDate: string;
    totalDays: string;
    status: string;
    leaveType: { name: string; color: string };
  }>;
  leaveAllowances: Array<{
    id: string;
    year: number;
    totalDays: string;
    usedDays: string;
    leaveType: { name: string };
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  CASUAL: "Casual",
  CLOCK_IN: "Clock In",
  CLOCK_OUT: "Clock Out",
  BREAK_START: "Break Start",
  BREAK_END: "Break End",
};

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-Weekly",
  FOUR_WEEKLY: "Four Weekly",
  MONTHLY: "Monthly",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
  CANCELLED: "bg-gray-500",
};

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") === "true";

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(editMode);

  useEffect(() => {
    async function loadEmployee() {
      try {
        const res = await fetch(`/api/employees/${id}`);
        if (res.ok) {
          const data = await res.json();
          setEmployee(data);
        } else {
          router.push("/employees");
        }
      } catch {
        router.push("/employees");
      } finally {
        setLoading(false);
      }
    }
    loadEmployee();
  }, [id, router]);

  async function handleUpdate(data: EmployeeInput) {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        // Reload full data
        const fullRes = await fetch(`/api/employees/${id}`);
        if (fullRes.ok) {
          setEmployee(await fullRes.json());
        }
        setEditing(false);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!employee) return null;

  const defaultValues: Partial<EmployeeInput> = {
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email || "",
    phone: employee.phone || "",
    dateOfBirth: employee.dateOfBirth
      ? new Date(employee.dateOfBirth).toISOString().split("T")[0]
      : "",
    nationalInsurance: employee.nationalInsurance || "",
    departmentId: employee.department?.id || "",
    employmentType: employee.employmentType as EmployeeInput["employmentType"],
    startDate: new Date(employee.startDate).toISOString().split("T")[0],
    endDate: employee.endDate
      ? new Date(employee.endDate).toISOString().split("T")[0]
      : "",
    payRate: parseFloat(employee.payRate),
    payFrequency: employee.payFrequency as EmployeeInput["payFrequency"],
    isActive: employee.isActive,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`${employee.employeeNumber} - ${employee.department?.name || "No department"}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/employees")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {!editing && (
              <Button onClick={() => setEditing(true)}>Edit Employee</Button>
            )}
          </div>
        }
      />

      {editing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Edit Employee</h2>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
          <EmployeeForm
            defaultValues={defaultValues}
            onSubmit={handleUpdate}
            loading={saving}
            isEditing
          />
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <Card>
            <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(employee.firstName, employee.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={employee.isActive ? "default" : "secondary"}>
                    {employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {TYPE_LABELS[employee.employmentType] || employee.employmentType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pay Rate</p>
                  <p className="font-medium">
                    {formatCurrency(parseFloat(employee.payRate))}{" "}
                    <span className="text-xs text-muted-foreground">
                      / {FREQ_LABELS[employee.payFrequency]?.toLowerCase() || employee.payFrequency}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(employee.startDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">
                <User className="mr-1.5 h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="shifts">
                <Briefcase className="mr-1.5 h-4 w-4" />
                Shifts
              </TabsTrigger>
              <TabsTrigger value="clockings">
                <Clock className="mr-1.5 h-4 w-4" />
                Clockings
              </TabsTrigger>
              <TabsTrigger value="leave">
                <Calendar className="mr-1.5 h-4 w-4" />
                Leave
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="mr-1.5 h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Email" value={employee.email || "--"} />
                    <InfoRow label="Phone" value={employee.phone || "--"} />
                    <InfoRow
                      label="Date of Birth"
                      value={
                        employee.dateOfBirth
                          ? formatDate(employee.dateOfBirth)
                          : "--"
                      }
                    />
                    <InfoRow
                      label="National Insurance"
                      value={employee.nationalInsurance || "--"}
                    />
                    <InfoRow
                      label="Department"
                      value={employee.department?.name || "--"}
                    />
                    <InfoRow
                      label="End Date"
                      value={
                        employee.endDate
                          ? formatDate(employee.endDate)
                          : "--"
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shifts Tab */}
            <TabsContent value="shifts">
              <Card>
                <CardHeader>
                  <CardTitle>Shift Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {employee.shiftAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No shift assignments yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {employee.shiftAssignments.map((sa) => (
                        <div
                          key={sa.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: sa.shiftPattern.color }}
                            />
                            <div>
                              <p className="font-medium">{sa.shiftPattern.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {sa.shiftPattern.startTime} - {sa.shiftPattern.endTime}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>From: {formatDate(sa.effectiveFrom)}</p>
                            {sa.effectiveTo && (
                              <p>To: {formatDate(sa.effectiveTo)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clockings Tab */}
            <TabsContent value="clockings">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Clockings</CardTitle>
                </CardHeader>
                <CardContent>
                  {employee.clockings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No clockings recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {employee.clockings.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">
                              {TYPE_LABELS[c.type] || c.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {c.source}
                            </span>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{formatTime(c.timestamp)}</p>
                            <p className="text-muted-foreground">
                              {formatDate(c.date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leave Tab */}
            <TabsContent value="leave">
              <div className="space-y-6">
                {/* Allowances */}
                <Card>
                  <CardHeader>
                    <CardTitle>Leave Allowances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employee.leaveAllowances.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No leave allowances configured.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {employee.leaveAllowances.map((la) => (
                          <div key={la.id} className="rounded-lg border p-3">
                            <p className="font-medium">{la.leaveType.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {la.usedDays} / {la.totalDays} days used ({la.year})
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Leave Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employee.leaveRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No leave requests.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {employee.leaveRequests.map((lr) => (
                          <div
                            key={lr.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: lr.leaveType.color }}
                              />
                              <div>
                                <p className="font-medium">{lr.leaveType.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(lr.startDate)} - {formatDate(lr.endDate)} ({lr.totalDays} days)
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">{lr.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Employee notes feature coming soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

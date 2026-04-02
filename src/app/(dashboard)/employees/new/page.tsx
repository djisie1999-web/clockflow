"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "@/components/employees/employee-form";
import type { EmployeeInput } from "@/lib/validations";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: EmployeeInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const employee = await res.json();
        router.push(`/employees/${employee.id}`);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Employee"
        description="Add a new employee to your organisation"
        actions={
          <Button variant="outline" onClick={() => router.push("/employees")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        }
      />
      <EmployeeForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}

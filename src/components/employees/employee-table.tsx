"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatDate, getInitials } from "@/lib/utils";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  employmentType: string;
  startDate: string;
  isActive: boolean;
  department: { id: string; name: string } | null;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  CASUAL: "Casual",
};

interface EmployeeTableProps {
  employees: Employee[];
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onDelete: (employee: Employee) => void;
}

export function EmployeeTable({
  employees,
  sortField,
  sortOrder,
  onSort,
  onDelete,
}: EmployeeTableProps) {
  const router = useRouter();

  const columns: Column<Employee>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(emp.firstName, emp.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {emp.firstName} {emp.lastName}
            </div>
            {emp.email && (
              <div className="text-xs text-muted-foreground">{emp.email}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "employeeNumber",
      label: "Employee #",
      sortable: true,
      render: (emp) => (
        <span className="font-mono text-sm">{emp.employeeNumber}</span>
      ),
    },
    {
      key: "department",
      label: "Department",
      className: "hidden md:table-cell",
      render: (emp) => (
        <span className="text-muted-foreground">
          {emp.department?.name || "--"}
        </span>
      ),
    },
    {
      key: "employmentType",
      label: "Type",
      className: "hidden lg:table-cell",
      render: (emp) => (
        <Badge variant="outline">
          {EMPLOYMENT_TYPE_LABELS[emp.employmentType] || emp.employmentType}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (emp) => (
        <Badge variant={emp.isActive ? "default" : "secondary"}>
          {emp.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "startDate",
      label: "Start Date",
      sortable: true,
      className: "hidden lg:table-cell",
      render: (emp) => (
        <span className="text-muted-foreground">{formatDate(emp.startDate)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[60px]",
      render: (emp) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/employees/${emp.id}`);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/employees/${emp.id}?edit=true`);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(emp);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={employees}
      sortField={sortField}
      sortOrder={sortOrder}
      onSort={onSort}
      onRowClick={(emp) => router.push(`/employees/${emp.id}`)}
      keyExtractor={(emp) => emp.id}
    />
  );
}

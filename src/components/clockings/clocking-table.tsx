"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface Clocking {
  id: string;
  type: string;
  timestamp: string;
  date: string;
  source: string;
  notes: string | null;
  originalTimestamp: string | null;
  editedBy: string | null;
  editedAt: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
}

interface ClockingTableProps {
  clockings: Clocking[];
  onEdit: (clocking: Clocking) => void;
  onDelete: (id: string) => void;
}

const typeColors: Record<string, string> = {
  CLOCK_IN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CLOCK_OUT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  BREAK_START: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  BREAK_END: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const typeLabels: Record<string, string> = {
  CLOCK_IN: "Clock In",
  CLOCK_OUT: "Clock Out",
  BREAK_START: "Break Start",
  BREAK_END: "Break End",
};

const sourceLabels: Record<string, string> = {
  MANUAL: "Manual",
  PORTAL: "Portal",
  KIOSK: "Kiosk",
  MOBILE: "Mobile",
  API: "API",
};

export function ClockingTable({ clockings, onEdit, onDelete }: ClockingTableProps) {
  if (clockings.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-md border text-sm text-muted-foreground">
        No clockings found for the selected filters.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clockings.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">
              {c.employee.firstName} {c.employee.lastName}
              <span className="ml-1 text-xs text-muted-foreground">
                ({c.employee.employeeNumber})
              </span>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className={typeColors[c.type] || ""}>
                {typeLabels[c.type] || c.type}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(c.timestamp)}</TableCell>
            <TableCell>
              {formatTime(c.timestamp)}
              {c.originalTimestamp && (
                <span className="ml-1 text-xs text-muted-foreground" title={`Original: ${formatTime(c.originalTimestamp)}`}>
                  (edited)
                </span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-xs">{sourceLabels[c.source] || c.source}</span>
            </TableCell>
            <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
              {c.notes || "—"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(c)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(c.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

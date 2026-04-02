"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReportTableProps {
  columns: { key: string; label: string; align?: "left" | "right" | "center" }[];
  rows: Record<string, unknown>[];
}

export function ReportTable({ columns, rows }: ReportTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border text-sm text-muted-foreground">
        No data found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.align === "right" ? "text-right" : ""}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.align === "right" ? "text-right" : ""}>
                  {String(row[col.key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

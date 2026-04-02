"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  filename: string;
}

export function ExportButton({ data, columns, filename }: ExportButtonProps) {
  function handleExport() {
    if (data.length === 0) return;

    const header = columns.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = row[c.key];
        const str = String(val ?? "");
        // Escape commas and quotes in CSV
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={data.length === 0}>
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}

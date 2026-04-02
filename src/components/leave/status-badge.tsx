"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}

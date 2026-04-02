"use client";

import { Check, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Feature {
  name: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const FEATURES: Feature[] = [
  { name: "Employee Management", free: true, starter: true, pro: true, enterprise: true },
  { name: "Clock In/Out", free: true, starter: true, pro: true, enterprise: true },
  { name: "Timesheets", free: true, starter: true, pro: true, enterprise: true },
  { name: "Leave Management", free: true, starter: true, pro: true, enterprise: true },
  { name: "Shift Patterns", free: "Basic", starter: true, pro: true, enterprise: true },
  { name: "Overtime Rules", free: false, starter: true, pro: true, enterprise: true },
  { name: "Reports & Analytics", free: "Basic", starter: true, pro: true, enterprise: true },
  { name: "CSV Export", free: false, starter: true, pro: true, enterprise: true },
  { name: "Multi-Department", free: false, starter: true, pro: true, enterprise: true },
  { name: "Kiosk Mode", free: false, starter: false, pro: true, enterprise: true },
  { name: "API Access", free: false, starter: false, pro: true, enterprise: true },
  { name: "Custom Branding", free: false, starter: false, pro: true, enterprise: true },
  { name: "SSO Integration", free: false, starter: false, pro: false, enterprise: true },
  { name: "Dedicated Support", free: false, starter: false, pro: false, enterprise: true },
  { name: "Custom Integrations", free: false, starter: false, pro: false, enterprise: true },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-primary" />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />;
  }
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

interface PlanComparisonProps {
  currentTier: string;
}

export function PlanComparison({ currentTier }: PlanComparisonProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Feature</TableHead>
            <TableHead className={`text-center ${currentTier === "FREE" ? "bg-primary/5" : ""}`}>
              Free
            </TableHead>
            <TableHead className={`text-center ${currentTier === "STARTER" ? "bg-primary/5" : ""}`}>
              Starter
            </TableHead>
            <TableHead className={`text-center ${currentTier === "PRO" ? "bg-primary/5" : ""}`}>
              Pro
            </TableHead>
            <TableHead className={`text-center ${currentTier === "ENTERPRISE" ? "bg-primary/5" : ""}`}>
              Enterprise
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURES.map((feature) => (
            <TableRow key={feature.name}>
              <TableCell className="font-medium">{feature.name}</TableCell>
              <TableCell className={`text-center ${currentTier === "FREE" ? "bg-primary/5" : ""}`}>
                <FeatureValue value={feature.free} />
              </TableCell>
              <TableCell className={`text-center ${currentTier === "STARTER" ? "bg-primary/5" : ""}`}>
                <FeatureValue value={feature.starter} />
              </TableCell>
              <TableCell className={`text-center ${currentTier === "PRO" ? "bg-primary/5" : ""}`}>
                <FeatureValue value={feature.pro} />
              </TableCell>
              <TableCell className={`text-center ${currentTier === "ENTERPRISE" ? "bg-primary/5" : ""}`}>
                <FeatureValue value={feature.enterprise} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

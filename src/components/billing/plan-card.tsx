"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  tier: string;
  name: string;
  price: number;
  employeeLimit: number;
  isCurrent: boolean;
  features: string[];
  onSelect: () => void;
  loading?: boolean;
}

export function PlanCard({
  tier,
  name,
  price,
  employeeLimit,
  isCurrent,
  features,
  onSelect,
  loading,
}: PlanCardProps) {
  return (
    <Card className={cn("relative flex flex-col", isCurrent && "border-primary ring-1 ring-primary")}>
      {isCurrent && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          Current Plan
        </Badge>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-lg">{name}</CardTitle>
        <div className="mt-2">
          {price === 0 ? (
            <span className="text-3xl font-bold">Free</span>
          ) : (
            <div>
              <span className="text-3xl font-bold">
                &pound;{price.toFixed(2)}
              </span>
              <span className="text-muted-foreground">/user/month</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {employeeLimit >= 999999
            ? "Unlimited employees"
            : `Up to ${employeeLimit} employees`}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrent ? "outline" : "default"}
          disabled={isCurrent || loading}
          onClick={onSelect}
        >
          {isCurrent ? "Current Plan" : loading ? "Processing..." : `Upgrade to ${name}`}
        </Button>
      </CardFooter>
    </Card>
  );
}

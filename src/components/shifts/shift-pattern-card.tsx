"use client";

import { Clock, Moon, Users, Pencil, Trash2, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDays } from "./day-selector";

interface ShiftPatternCardProps {
  pattern: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    days: number[];
    breakDuration: number;
    breakPaid: boolean;
    nightShift: boolean;
    color: string;
    isActive: boolean;
    _count: { assignments: number };
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function ShiftPatternCard({ pattern, onEdit, onDelete }: ShiftPatternCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: pattern.color }}
      />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pl-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold leading-none">{pattern.name}</h3>
            {pattern.nightShift && (
              <Badge variant="secondary" className="gap-1">
                <Moon className="h-3 w-3" />
                Night
              </Badge>
            )}
            {!pattern.isActive && (
              <Badge variant="outline" className="text-muted-foreground">
                Inactive
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pl-5">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {pattern.startTime} - {pattern.endTime}
            </span>
          </div>
          {pattern.breakDuration > 0 && (
            <div className="flex items-center gap-1.5">
              <Coffee className="h-3.5 w-3.5" />
              <span>
                {pattern.breakDuration}min {pattern.breakPaid ? "(paid)" : "(unpaid)"}
              </span>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDays(pattern.days)}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {pattern._count.assignments} employee{pattern._count.assignments !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

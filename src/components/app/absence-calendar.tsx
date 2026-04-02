"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AbsenceEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  type: string;
  color?: string;
  status: string;
}

interface AbsenceCalendarProps {
  absences: AbsenceEvent[];
  title?: string;
}

export function AbsenceCalendar({ absences, title = "Absence Calendar" }: AbsenceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function getAbsencesForDay(day: Date) {
    return absences.filter(
      (a) =>
        a.status !== "REJECTED" &&
        a.status !== "CANCELLED" &&
        day >= a.startDate &&
        day <= a.endDate
    );
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px">
          {weekDays.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-slate-400">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dayAbsences = getAbsencesForDay(day);
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`relative min-h-[72px] rounded-lg p-1.5 ${
                  !inMonth ? "opacity-30" : ""
                } ${today ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-slate-50"}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    today
                      ? "bg-indigo-500 font-bold text-white"
                      : "text-slate-600"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayAbsences.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: a.color ? `${a.color}20` : "#e0e7ff",
                        color: a.color ?? "#6366f1",
                      }}
                      title={`${a.employeeName} — ${a.type}`}
                    >
                      {a.employeeName.split(" ")[0]}
                    </div>
                  ))}
                  {dayAbsences.length > 2 && (
                    <p className="text-[10px] text-slate-400">+{dayAbsences.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

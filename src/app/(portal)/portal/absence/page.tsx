"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  leaveType: { name: string; color?: string };
  reason?: string;
}

interface Allowance {
  id: string;
  leaveType: { name: string };
  allowanceDays: number;
  usedDays: number;
  remaining: number;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

export default function PortalAbsencePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/leave/requests?mine=true").then(r => r.ok ? r.json() : { requests: [] }),
      fetch("/api/leave/allowances?mine=true").then(r => r.ok ? r.json() : { allowances: [] }),
    ]).then(([reqData, allowData]) => {
      setRequests(reqData.requests ?? reqData ?? []);
      setAllowances(allowData.allowances ?? allowData ?? []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Absence &amp; Leave</h1>
          <p className="text-slate-500">View your leave history and balances</p>
        </div>
        <Link href="/portal/absence/request">
          <Button className="bg-indigo-500 hover:bg-indigo-600">
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </Link>
      </div>

      {/* Entitlement balances */}
      {allowances.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {allowances.map((a) => {
            const pct = a.allowanceDays > 0 ? Math.round((a.usedDays / a.allowanceDays) * 100) : 0;
            return (
              <Card key={a.id}>
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-slate-700">{a.leaveType.name}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{a.remaining} <span className="text-sm font-normal text-slate-400">days left</span></p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{a.usedDays} / {a.allowanceDays} days used</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-indigo-500" />
            Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Calendar className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No leave requests yet
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-slate-800">{req.leaveType.name}</p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(req.startDate), "d MMM yyyy")} – {format(new Date(req.endDate), "d MMM yyyy")}
                      {" "}({req.totalDays} day{req.totalDays !== 1 ? "s" : ""})
                    </p>
                    {req.reason && <p className="mt-0.5 text-xs text-slate-400">{req.reason}</p>}
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

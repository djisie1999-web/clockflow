"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Check, X, Trash2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/leave/status-badge";
import { LeaveTypeForm } from "@/components/leave/leave-type-form";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { AllowanceGrid } from "@/components/leave/allowance-grid";
import { useAppStore } from "@/stores/app-store";
import { formatDate } from "@/lib/utils";

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  halfDay: boolean;
  status: string;
  reason: string | null;
  rejectionReason: string | null;
  createdAt: string;
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string };
  leaveType: { id: string; name: string; color: string };
  approvedBy: { id: string; firstName: string; lastName: string } | null;
}

interface LeaveType {
  id: string;
  name: string;
  color: string;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
}

export default function LeavePage() {
  const { user } = useAppStore();
  const isManager = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, typeRes] = await Promise.all([
        fetch("/api/leave/requests"),
        fetch("/api/leave/types"),
      ]);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.map((r: Record<string, unknown>) => ({
          ...r,
          totalDays: Number(r.totalDays),
        })));
      }
      if (typeRes.ok) setLeaveTypes(await typeRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/leave/requests/${id}/approve`, { method: "POST" });
      if (res.ok) loadData();
    } catch {
      // ignore
    } finally {
      setActionLoading("");
    }
  }

  async function handleReject() {
    setActionLoading(rejectingId);
    try {
      const res = await fetch(`/api/leave/requests/${rejectingId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        loadData();
        setRejectDialogOpen(false);
        setRejectReason("");
      }
    } catch {
      // ignore
    } finally {
      setActionLoading("");
    }
  }

  async function handleDeleteType(id: string) {
    if (!confirm("Delete this leave type?")) return;
    try {
      const res = await fetch(`/api/leave/types/${id}`, { method: "DELETE" });
      if (res.ok) loadData();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Manage leave requests, types, and allowances"
        actions={
          <Button onClick={() => setRequestFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        }
      />

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="allowances">Allowances</TabsTrigger>
        </TabsList>

        {/* REQUESTS TAB */}
        <TabsContent value="requests" className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : requests.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-md border text-sm text-muted-foreground">
              No leave requests yet
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    {isManager && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {req.employee.firstName} {req.employee.lastName}
                        <div className="text-xs text-muted-foreground">{req.employee.employeeNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: req.leaveType.color }} />
                          {req.leaveType.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(req.startDate)} - {formatDate(req.endDate)}
                        {req.halfDay && <span className="ml-1 text-xs text-muted-foreground">(Half day)</span>}
                      </TableCell>
                      <TableCell className="text-right">{req.totalDays}</TableCell>
                      <TableCell><StatusBadge status={req.status} /></TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {req.rejectionReason || req.reason || "-"}
                      </TableCell>
                      {isManager && (
                        <TableCell className="text-right">
                          {req.status === "PENDING" && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                onClick={() => handleApprove(req.id)}
                                disabled={actionLoading === req.id}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => {
                                  setRejectingId(req.id);
                                  setRejectDialogOpen(true);
                                }}
                                disabled={actionLoading === req.id}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {req.status !== "PENDING" && req.approvedBy && (
                            <span className="text-xs text-muted-foreground">
                              by {req.approvedBy.firstName} {req.approvedBy.lastName}
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* TYPES TAB */}
        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditingType(null); setTypeFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Type
            </Button>
          </div>
          {leaveTypes.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-md border text-sm text-muted-foreground">
              No leave types configured
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Requires Approval</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((lt) => (
                    <TableRow key={lt.id}>
                      <TableCell>
                        <div className="h-6 w-6 rounded-full" style={{ backgroundColor: lt.color }} />
                      </TableCell>
                      <TableCell className="font-medium">{lt.name}</TableCell>
                      <TableCell>{lt.isPaid ? "Yes" : "No"}</TableCell>
                      <TableCell>{lt.requiresApproval ? "Yes" : "No"}</TableCell>
                      <TableCell>{lt.isActive ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingType(lt); setTypeFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteType(lt.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ALLOWANCES TAB */}
        <TabsContent value="allowances">
          <AllowanceGrid />
        </TabsContent>
      </Tabs>

      {/* Leave Request Form Dialog */}
      <LeaveRequestForm open={requestFormOpen} onClose={() => setRequestFormOpen(false)} onSave={loadData} />

      {/* Leave Type Form Dialog */}
      {typeFormOpen && (
        <LeaveTypeForm
          open={typeFormOpen}
          onClose={() => { setTypeFormOpen(false); setEditingType(null); }}
          onSave={loadData}
          initial={editingType ? editingType : undefined}
        />
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(o) => !o && setRejectDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for rejection (optional)</Label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={actionLoading === rejectingId}>
                {actionLoading === rejectingId ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

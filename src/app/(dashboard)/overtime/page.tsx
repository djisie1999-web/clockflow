"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OvertimeRuleForm } from "@/components/overtime/overtime-rule-form";

interface OvertimeRule {
  id: string;
  name: string;
  triggerType: string;
  thresholdHours: number;
  multiplier: number;
  priority: number;
  exemptDays: string[];
  isActive: boolean;
}

export default function OvertimePage() {
  const [rules, setRules] = useState<OvertimeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OvertimeRule | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/overtime");
      if (res.ok) {
        const data = await res.json();
        setRules(
          data.map((r: Record<string, unknown>) => ({
            ...r,
            thresholdHours: Number(r.thresholdHours),
            multiplier: Number(r.multiplier),
            exemptDays: (r.exemptDays as string[]) || [],
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this overtime rule?")) return;
    try {
      const res = await fetch(`/api/overtime/${id}`, { method: "DELETE" });
      if (res.ok) loadData();
    } catch {
      // ignore
    }
  }

  const triggerLabels: Record<string, string> = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    PERIOD: "Period",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overtime Rules"
        description="Configure overtime calculation rules"
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Rule
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : rules.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border text-sm text-muted-foreground">
          No overtime rules configured. Click &quot;Add Rule&quot; to create one.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead className="text-right">Multiplier</TableHead>
                <TableHead className="text-right">Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Exempt Days</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{triggerLabels[rule.triggerType] || rule.triggerType}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{rule.thresholdHours}h</TableCell>
                  <TableCell className="text-right">{rule.multiplier}x</TableCell>
                  <TableCell className="text-right">{rule.priority}</TableCell>
                  <TableCell>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {rule.exemptDays.length > 0 ? rule.exemptDays.map((d) => d.slice(0, 3)).join(", ") : "None"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(rule); setFormOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(rule.id)}>
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

      {formOpen && (
        <OvertimeRuleForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSave={loadData}
          initial={editing ? editing : undefined}
        />
      )}
    </div>
  );
}

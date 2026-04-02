"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

interface ParsedRow {
  employeeId: string;
  type: string;
  timestamp: string;
  date: string;
  notes: string;
  valid: boolean;
  error?: string;
}

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const VALID_TYPES = ["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"];

export function BulkUploadDialog({
  open,
  onOpenChange,
  onComplete,
}: BulkUploadDialogProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: number } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setRows([]);
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setResult(null);
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());

      if (lines.length < 2) {
        setError("CSV must have a header row and at least one data row.");
        return;
      }

      // Parse header
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const idxEmployeeId = header.indexOf("employeeid");
      const idxType = header.indexOf("type");
      const idxTimestamp = header.indexOf("timestamp");
      const idxDate = header.indexOf("date");
      const idxNotes = header.indexOf("notes");

      if (idxEmployeeId === -1 || idxType === -1 || idxTimestamp === -1) {
        setError("CSV must have columns: employeeId, type, timestamp. Optional: date, notes");
        return;
      }

      const parsed: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const employeeId = cols[idxEmployeeId] || "";
        const type = (cols[idxType] || "").toUpperCase();
        const timestamp = cols[idxTimestamp] || "";
        const dateStr = idxDate >= 0 ? cols[idxDate] || "" : "";
        const notes = idxNotes >= 0 ? cols[idxNotes] || "" : "";

        let valid = true;
        let rowError: string | undefined;

        if (!employeeId) { valid = false; rowError = "Missing employeeId"; }
        else if (!VALID_TYPES.includes(type)) { valid = false; rowError = `Invalid type: ${type}`; }
        else if (!timestamp || isNaN(Date.parse(timestamp))) { valid = false; rowError = "Invalid timestamp"; }

        const computedDate = dateStr || (timestamp ? timestamp.slice(0, 10) : "");

        parsed.push({
          employeeId,
          type,
          timestamp,
          date: computedDate,
          notes,
          valid,
          error: rowError,
        });
      }

      setRows(parsed);
    };
    reader.readAsText(file);
  }

  async function handleUpload() {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      setError("No valid rows to upload.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/clockings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clockings: validRows.map((r) => ({
            employeeId: r.employeeId,
            type: r.type,
            timestamp: r.timestamp,
            date: r.date,
            source: "MANUAL",
            notes: r.notes || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        return;
      }

      const data = await res.json();
      setResult({ created: data.created, errors: data.errors?.length || 0 });
      onComplete();
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Clockings</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: employeeId, type, timestamp, date (optional), notes (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File picker */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Choose CSV File
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {rows.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {rows.length} rows parsed
              </span>
            )}
          </div>

          {/* Validation summary */}
          {rows.length > 0 && (
            <div className="flex gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {invalidCount} invalid
                </Badge>
              )}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((r, i) => (
                    <TableRow key={i} className={!r.valid ? "bg-red-50 dark:bg-red-950/20" : ""}>
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs font-mono">{r.employeeId}</TableCell>
                      <TableCell className="text-xs">{r.type}</TableCell>
                      <TableCell className="text-xs">{r.timestamp}</TableCell>
                      <TableCell>
                        {r.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-destructive">{r.error}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                        ... and {rows.length - 50} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-md bg-green-50 p-3 text-sm dark:bg-green-950/20">
              <p className="font-medium text-green-800 dark:text-green-200">
                Upload complete: {result.created} clockings created
                {result.errors > 0 && `, ${result.errors} errors`}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleUpload}
              disabled={uploading || validCount === 0}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : `Upload ${validCount} Clockings`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

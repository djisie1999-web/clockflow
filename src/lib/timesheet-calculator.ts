import { ClockingType } from "@prisma/client";

// ─── Types ─────────────────────────────────────────────────

export interface ClockEvent {
  id: string;
  employeeId: string;
  type: ClockingType;
  timestamp: Date;
  date: Date;
}

export interface ClockPair {
  clockIn: Date;
  clockOut: Date | null;
  durationMs: number;
}

export interface BreakPair {
  breakStart: Date;
  breakEnd: Date | null;
  durationMs: number;
}

export interface DailySummary {
  employeeId: string;
  date: string; // ISO date string YYYY-MM-DD
  clockIn: Date | null;
  clockOut: Date | null;
  pairs: ClockPair[];
  breaks: BreakPair[];
  breakDurationMinutes: number;
  workedMinutes: number;
  workedHours: number;
  overtimeMinutes: number;
  status: "COMPLETE" | "INCOMPLETE" | "ABSENT";
}

// ─── Pair Clock Events ─────────────────────────────────────

/**
 * Match CLOCK_IN events with subsequent CLOCK_OUT events.
 * Events must be sorted by timestamp ascending.
 */
export function pairClockEvents(clockings: ClockEvent[]): ClockPair[] {
  const pairs: ClockPair[] = [];
  const sorted = [...clockings]
    .filter((c) => c.type === "CLOCK_IN" || c.type === "CLOCK_OUT")
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  let pendingIn: Date | null = null;

  for (const c of sorted) {
    if (c.type === "CLOCK_IN") {
      // If there was already an unpaired clock-in, close it as incomplete
      if (pendingIn) {
        pairs.push({ clockIn: pendingIn, clockOut: null, durationMs: 0 });
      }
      pendingIn = c.timestamp;
    } else if (c.type === "CLOCK_OUT") {
      if (pendingIn) {
        const durationMs = c.timestamp.getTime() - pendingIn.getTime();
        pairs.push({ clockIn: pendingIn, clockOut: c.timestamp, durationMs });
        pendingIn = null;
      }
      // Orphan CLOCK_OUT without prior CLOCK_IN is ignored
    }
  }

  // If there's a trailing clock-in with no clock-out
  if (pendingIn) {
    pairs.push({ clockIn: pendingIn, clockOut: null, durationMs: 0 });
  }

  return pairs;
}

// ─── Pair Break Events ─────────────────────────────────────

export function pairBreakEvents(clockings: ClockEvent[]): BreakPair[] {
  const pairs: BreakPair[] = [];
  const sorted = [...clockings]
    .filter((c) => c.type === "BREAK_START" || c.type === "BREAK_END")
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  let pendingStart: Date | null = null;

  for (const c of sorted) {
    if (c.type === "BREAK_START") {
      if (pendingStart) {
        pairs.push({ breakStart: pendingStart, breakEnd: null, durationMs: 0 });
      }
      pendingStart = c.timestamp;
    } else if (c.type === "BREAK_END") {
      if (pendingStart) {
        const durationMs = c.timestamp.getTime() - pendingStart.getTime();
        pairs.push({ breakStart: pendingStart, breakEnd: c.timestamp, durationMs });
        pendingStart = null;
      }
    }
  }

  if (pendingStart) {
    pairs.push({ breakStart: pendingStart, breakEnd: null, durationMs: 0 });
  }

  return pairs;
}

// ─── Calculate Break Duration ──────────────────────────────

/**
 * Total break duration in minutes from BREAK_START/BREAK_END pairs.
 */
export function calculateBreakDuration(clockings: ClockEvent[]): number {
  const breaks = pairBreakEvents(clockings);
  const totalMs = breaks.reduce((sum, b) => sum + b.durationMs, 0);
  return Math.round(totalMs / (1000 * 60));
}

// ─── Calculate Worked Hours ────────────────────────────────

/**
 * Total worked hours from clock pairs minus break duration.
 */
export function calculateWorkedHours(
  pairs: ClockPair[],
  breakMinutes: number
): number {
  const totalMs = pairs.reduce((sum, p) => sum + p.durationMs, 0);
  const totalMinutes = totalMs / (1000 * 60);
  return Math.max(0, totalMinutes - breakMinutes);
}

// ─── Calculate Overtime ────────────────────────────────────

/**
 * Overtime in minutes. Positive if worked > expected.
 */
export function calculateOvertime(
  workedMinutes: number,
  expectedMinutes: number
): number {
  return Math.max(0, workedMinutes - expectedMinutes);
}

// ─── Handle Night Shift ────────────────────────────────────

/**
 * For night shifts that cross midnight, adjusts the clock-out
 * to the next day if it appears to be before clock-in.
 * Returns the adjusted clock-out Date.
 */
export function handleNightShift(clockIn: Date, clockOut: Date): Date {
  if (clockOut.getTime() < clockIn.getTime()) {
    // Clock-out is on the next day
    const adjusted = new Date(clockOut);
    adjusted.setDate(adjusted.getDate() + 1);
    return adjusted;
  }
  return clockOut;
}

// ─── Build Daily Summary ───────────────────────────────────

/**
 * Build a DailySummary for one employee on one date.
 * @param clockings - all clock events for this employee/date
 * @param expectedMinutes - expected working minutes (default 480 = 8h)
 */
export function buildDailySummary(
  employeeId: string,
  date: string,
  clockings: ClockEvent[],
  expectedMinutes: number = 480
): DailySummary {
  if (clockings.length === 0) {
    return {
      employeeId,
      date,
      clockIn: null,
      clockOut: null,
      pairs: [],
      breaks: [],
      breakDurationMinutes: 0,
      workedMinutes: 0,
      workedHours: 0,
      overtimeMinutes: 0,
      status: "ABSENT",
    };
  }

  const pairs = pairClockEvents(clockings);
  const breaks = pairBreakEvents(clockings);
  const breakDurationMinutes = calculateBreakDuration(clockings);
  const workedMinutes = calculateWorkedHours(pairs, breakDurationMinutes);
  const workedHours = Math.round((workedMinutes / 60) * 100) / 100;
  const overtimeMinutes = calculateOvertime(workedMinutes, expectedMinutes);

  // First clock-in and last clock-out
  const firstClockIn = pairs.length > 0 ? pairs[0].clockIn : null;
  const lastPairWithOut = [...pairs].reverse().find((p) => p.clockOut !== null);
  const lastClockOut = lastPairWithOut?.clockOut ?? null;

  // Status: COMPLETE if all pairs are closed, INCOMPLETE if any open
  const hasOpenPair = pairs.some((p) => p.clockOut === null);
  const hasOpenBreak = breaks.some((b) => b.breakEnd === null);
  const status = hasOpenPair || hasOpenBreak ? "INCOMPLETE" : "COMPLETE";

  return {
    employeeId,
    date,
    clockIn: firstClockIn,
    clockOut: lastClockOut,
    pairs,
    breaks,
    breakDurationMinutes,
    workedMinutes,
    workedHours,
    overtimeMinutes,
    status,
  };
}

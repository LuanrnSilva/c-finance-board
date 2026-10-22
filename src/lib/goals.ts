import { parseLocalDate } from "@/lib/utils";

/** Whole months left until the deadline (at least 1 while the deadline hasn't passed; 0 when overdue). */
export function monthsRemaining(deadline: string, today: Date = new Date()): number {
  const d = parseLocalDate(deadline);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (d < t) return 0;
  const diff = (d.getFullYear() - t.getFullYear()) * 12 + (d.getMonth() - t.getMonth());
  return Math.max(1, diff);
}

/** Monthly amount needed = (target - saved) / months remaining. Null when no deadline or overdue. */
export function monthlyNeeded(target: number, saved: number, deadline: string | null, today?: Date): number | null {
  if (!deadline) return null;
  const months = monthsRemaining(deadline, today);
  if (months === 0) return null;
  return Math.max(0, target - saved) / months;
}

export function progressPct(target: number, saved: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, (saved / target) * 100));
}

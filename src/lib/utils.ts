import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parses "YYYY-MM-DD" as a local date (avoids UTC shift). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Formats a Date as local "YYYY-MM-DD". */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Adds months to a "YYYY-MM-DD" string, clamping the day to the month end. */
export function addMonthsToDateStr(dateStr: string, months: number): string {
  const base = parseLocalDate(dateStr);
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(base.getDate(), lastDay));
  return formatLocalDate(target);
}

export function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = parseLocalDate(dateStr);
  return d.getFullYear() === year && d.getMonth() === month;
}

/** Deterministic HSL color from a string. */
export function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/** Builds installment dates/numbers: from `current` to `total`, monthly from startDate. */
export function buildInstallments(startDate: string, current: number, total: number) {
  const start = Math.max(1, current);
  const result: { date: string; installment_current: number }[] = [];
  for (let n = start; n <= total; n++) {
    result.push({ date: addMonthsToDateStr(startDate, n - start), installment_current: n });
  }
  return result;
}

/** Sum of card expenses in the given month. */
export function cardUsedAmount(
  transactions: { type: string; credit_card_id?: string | null; amount: number; date: string }[],
  cardId: string,
  year: number,
  month: number,
): number {
  return transactions
    .filter((t) => t.type === "expense" && t.credit_card_id === cardId && isSameMonth(t.date, year, month))
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

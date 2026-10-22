import { parseLocalDate } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

export const MIN_RECURRING_MONTHS = 3;
export const PRICE_ALERT_THRESHOLD = 0.15;

export interface RecurringGroup {
  key: string;
  normalized: string;
  label: string;
  category: string;
  months: string[]; // "YYYY-MM", ascending
  monthlyAverage: number;
  total12m: number;
  lastAmount: number;
  lastDate: string;
  variation: number; // (last - avg) / avg
  priceAlert: boolean;
}

/** lowercase, strip accents, digits and punctuation, collapse spaces */
export function normalizeDescription(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[0-9]/g, " ")
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const groupKey = (normalized: string, category: string) => `${normalized}|${category}`;

/**
 * Groups non-installment expenses from the last 12 months by (normalized description, category).
 * A group is recurring when it appears in at least 3 distinct months, or when `forced` contains its key.
 */
export function detectRecurring(
  transactions: Transaction[],
  today: Date = new Date(),
  forced: Set<string> = new Set()
): RecurringGroup[] {
  const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const groups = new Map<string, { normalized: string; label: string; category: string; items: Transaction[] }>();

  for (const t of transactions) {
    if (t.type !== "expense" || t.installment_total != null || t.status === "disputed") continue;
    const d = parseLocalDate(t.date);
    if (d < start || d > end) continue;
    const normalized = normalizeDescription(t.description);
    if (!normalized) continue;
    const key = groupKey(normalized, t.category);
    const g = groups.get(key) ?? { normalized, label: t.description, category: t.category, items: [] };
    g.items.push(t);
    groups.set(key, g);
  }

  const result: RecurringGroup[] = [];
  for (const [key, g] of groups) {
    const months = [...new Set(g.items.map((t) => t.date.slice(0, 7)))].sort();
    if (months.length < MIN_RECURRING_MONTHS && !forced.has(key)) continue;
    const sorted = [...g.items].sort((a, b) => a.date.localeCompare(b.date));
    const last = sorted[sorted.length - 1];
    const total12m = g.items.reduce((s, t) => s + t.amount, 0);
    const monthlyAverage = total12m / months.length;
    const variation = monthlyAverage > 0 ? (last.amount - monthlyAverage) / monthlyAverage : 0;
    result.push({
      key,
      normalized: g.normalized,
      label: last.description,
      category: g.category,
      months,
      monthlyAverage,
      total12m,
      lastAmount: last.amount,
      lastDate: last.date,
      variation,
      priceAlert: variation > PRICE_ALERT_THRESHOLD,
    });
  }
  return result.sort((a, b) => b.total12m - a.total12m);
}

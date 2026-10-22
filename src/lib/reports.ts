import { formatLocalDate, isSameMonth } from "@/lib/utils";
import { countsTowardTotals, type Transaction } from "@/types/transaction";

export type BudgetLevel = "ok" | "warning" | "over";

/** >100% = over (red), >80% = warning (yellow). */
export function budgetLevel(spent: number, limit: number): BudgetLevel {
  if (limit <= 0) return spent > 0 ? "over" : "ok";
  const pct = spent / limit;
  if (pct > 1) return "over";
  if (pct > 0.8) return "warning";
  return "ok";
}

export interface BudgetRow {
  category: string;
  limit: number;
  spent: number;
  pct: number;
  level: BudgetLevel;
}

export function budgetUsage(
  transactions: Transaction[],
  budgets: { category: string; monthly_limit: number }[],
  year: number,
  month: number
): BudgetRow[] {
  return budgets
    .map((b) => {
      const spent = transactions
        .filter((t) => countsTowardTotals(t) && t.type === "expense" && t.category === b.category && isSameMonth(t.date, year, month))
        .reduce((s, t) => s + t.amount, 0);
      return {
        category: b.category,
        limit: b.monthly_limit,
        spent,
        pct: b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0,
        level: budgetLevel(spent, b.monthly_limit),
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

/** First-of-month dates for the last `months` months, oldest first. */
export function periodMonths(months: number, today: Date = new Date()) {
  return Array.from({ length: months }, (_, i) => new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1));
}

const monthLabel = (d: Date) => d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

/** Rows like { month: "out", [memberName]: total } for expenses grouped by creator. */
export function spendingByMember(
  transactions: Transaction[],
  members: { user_id: string; name: string }[],
  months: number,
  today?: Date
) {
  return periodMonths(months, today).map((d) => {
    const row: Record<string, string | number> = { month: monthLabel(d) };
    for (const m of members) {
      row[m.name] = transactions
        .filter((t) => countsTowardTotals(t) && t.type === "expense" && t.created_by === m.user_id && isSameMonth(t.date, d.getFullYear(), d.getMonth()))
        .reduce((s, t) => s + t.amount, 0);
    }
    return row;
  });
}

/** Running balance at the end of each month, including everything before the period. */
export function cumulativeBalance(transactions: Transaction[], months: number, today?: Date) {
  const counted = transactions.filter(countsTowardTotals);
  const signed = (t: Transaction) => (t.type === "income" ? t.amount : -t.amount);
  return periodMonths(months, today).map((d) => {
    const end = formatLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    const balance = counted.filter((t) => t.date <= end).reduce((s, t) => s + signed(t), 0);
    return { month: monthLabel(d), balance };
  });
}

export function topExpenses(transactions: Transaction[], n = 10) {
  return transactions
    .filter((t) => countsTowardTotals(t) && t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

/** Current-month projection: spent up to today + installments already generated for later this month. */
export function monthProjection(transactions: Transaction[], today: Date = new Date()) {
  const todayStr = formatLocalDate(today);
  const month = transactions.filter(
    (t) => countsTowardTotals(t) && t.type === "expense" && isSameMonth(t.date, today.getFullYear(), today.getMonth())
  );
  const spentToDate = month.filter((t) => t.date <= todayStr).reduce((s, t) => s + t.amount, 0);
  const futureInstallments = month
    .filter((t) => t.date > todayStr && t.installment_total != null)
    .reduce((s, t) => s + t.amount, 0);
  return { spentToDate, futureInstallments, projected: spentToDate + futureInstallments };
}

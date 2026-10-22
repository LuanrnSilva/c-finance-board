import { Link } from "react-router-dom";
import { PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { budgetUsage } from "@/lib/reports";
import { useBudgets } from "@/hooks/useBudgets";
import type { Transaction } from "@/types/transaction";
import type { Category } from "@/hooks/useCategories";

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const barColor = { ok: "bg-primary", warning: "bg-warning", over: "bg-destructive" } as const;
const textColor = { ok: "text-muted-foreground", warning: "text-warning", over: "text-destructive" } as const;

export function BudgetProgress({
  transactions, categories, year, month,
}: { transactions: Transaction[]; categories: Category[]; year: number; month: number }) {
  const { budgets, loading } = useBudgets();
  const rows = budgetUsage(transactions, budgets, year, month);
  const name = (v: string) => categories.find((c) => c.value === v)?.name || v;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Orçamento do mês</CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild><Link to="/settings">Definir limites</Link></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? null : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum limite definido. Defina em Configurações.</p>
        ) : rows.map((r) => (
          <div key={r.category} className="space-y-1">
            <div className="flex justify-between text-sm gap-2">
              <span className="font-medium truncate">{name(r.category)}</span>
              <span className={cn("whitespace-nowrap", textColor[r.level])}>
                {brl(r.spent)} / {brl(r.limit)} • {r.pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", barColor[r.level])} style={{ width: `${Math.min(100, r.pct)}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

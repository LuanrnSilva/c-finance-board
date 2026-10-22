import { useEffect, useState } from "react";
import { PiggyBank, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";

export function BudgetsCard() {
  const { categories } = useCategories();
  const { budgets, setBudget, removeBudget } = useBudgets();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(Object.fromEntries(budgets.map((b) => [b.category, String(b.monthly_limit)])));
  }, [budgets]);

  const save = (category: string) => {
    const raw = (values[category] ?? "").replace(",", ".").trim();
    const current = budgets.find((b) => b.category === category);
    if (!raw) {
      if (current) removeBudget.mutate(category);
      return;
    }
    const v = parseFloat(raw);
    if (Number.isNaN(v) || v < 0 || v === current?.monthly_limit) return;
    setBudget.mutate({ category, monthly_limit: v });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Orçamento por categoria</CardTitle>
        </div>
        <CardDescription>Limite mensal de gastos. Deixe em branco para não controlar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((c) => (
          <div key={c.value} className="flex items-center gap-3">
            <span className="flex-1 text-sm font-medium">{c.name}</span>
            <Input
              className="w-36"
              inputMode="decimal"
              placeholder="Sem limite"
              value={values[c.value] ?? ""}
              onChange={(e) => setValues((p) => ({ ...p, [c.value]: e.target.value }))}
              onBlur={() => save(c.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              aria-label={`Limite mensal de ${c.name}`}
            />
            {budgets.some((b) => b.category === c.value) ? (
              <Button variant="ghost" size="icon" aria-label="Remover limite" onClick={() => removeBudget.mutate(c.value)}>
                <X className="w-4 h-4" />
              </Button>
            ) : <span className="w-10" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

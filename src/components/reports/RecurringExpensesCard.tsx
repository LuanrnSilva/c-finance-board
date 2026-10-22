import { AlertTriangle, Check, Repeat, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RecurringItem, useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import type { Category } from "@/hooks/useCategories";

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function RecurringExpensesCard({
  items, categories, setStatus,
}: {
  items: RecurringItem[];
  categories: Category[];
  setStatus: ReturnType<typeof useRecurringExpenses>["setStatus"];
}) {
  const catName = (v: string) => categories.find((c) => c.value === v)?.name || v;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Gastos recorrentes</CardTitle>
        </div>
        <CardDescription>Gastos não parcelados que se repetem em 3 meses ou mais nos últimos 12</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum gasto recorrente detectado.</p>
        ) : items.map((i) => (
          <div key={i.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">{i.label}</p>
                <span className="text-xs text-muted-foreground">{catName(i.category)}</span>
                {i.status === "confirmed" && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success">Confirmado</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Média {brl(i.monthlyAverage)}/mês • {brl(i.total12m)} em 12 meses • {i.months.length} meses
              </p>
              {i.priceAlert && (
                <p className="text-sm text-warning flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-4 h-4" />
                  Último valor {brl(i.lastAmount)} está {(i.variation * 100).toFixed(0)}% acima da média
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {i.status !== "confirmed" && (
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ item: i, status: "confirmed" })} disabled={setStatus.isPending}>
                  <Check className="w-4 h-4 mr-1" /> Confirmar
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ item: i, status: "ignored" })} disabled={setStatus.isPending}>
                <X className="w-4 h-4 mr-1" /> Não é recorrente
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

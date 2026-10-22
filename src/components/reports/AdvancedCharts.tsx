import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { colorFromName, parseLocalDate } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
};

export function MemberSpendingChart({ data, names }: { data: Record<string, string | number>[]; names: string[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Gastos por membro</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
            <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
            <Legend />
            {names.map((n) => <Bar key={n} dataKey={n} fill={colorFromName(n)} radius={[4, 4, 0, 0]} />)}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function BalanceEvolutionChart({ data }: { data: { month: string; balance: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Evolução do saldo acumulado</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
            <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="balance" name="Saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TopExpensesCard({ items, categoryName }: { items: Transaction[]; categoryName: (v: string) => string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Top 10 maiores gastos</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem gastos no período.</p>
        ) : items.map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-muted-foreground">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{t.description}</p>
              <p className="text-xs text-muted-foreground">
                {parseLocalDate(t.date).toLocaleDateString("pt-BR")} • {categoryName(t.category)}
              </p>
            </div>
            <span className="font-semibold text-destructive whitespace-nowrap">{brl(t.amount)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MonthProjectionCard({ spentToDate, futureInstallments, projected }: { spentToDate: number; futureInstallments: number; projected: number }) {
  const data = [{ name: "Mês atual", "Gasto até hoje": spentToDate, "Parcelas a vencer": futureInstallments }];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Projeção do mês</CardTitle>
        <CardDescription>Gasto até hoje + parcelas já lançadas para o resto do mês</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-bold">{brl(projected)}</p>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={data} layout="vertical" stackOffset="none">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="Gasto até hoje" stackId="a" fill="hsl(var(--destructive))" />
            <Bar dataKey="Parcelas a vencer" stackId="a" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

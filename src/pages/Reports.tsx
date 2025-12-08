import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Calendar, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { useCreditCards } from "@/hooks/useCreditCards";

const categoryLabels: Record<string, string> = {
  shopping: "Compras",
  food: "Alimentação",
  transport: "Transporte",
  home: "Casa",
  tech: "Tecnologia",
  other: "Outros",
};

const categoryColors: Record<string, string> = {
  shopping: "hsl(38, 92%, 50%)",
  food: "hsl(262, 83%, 58%)",
  transport: "hsl(142, 76%, 36%)",
  home: "hsl(0, 84%, 60%)",
  tech: "hsl(200, 95%, 45%)",
  other: "hsl(280, 65%, 60%)",
};

export default function Reports() {
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { cards, loading: cardsLoading } = useCreditCards();
  const [period, setPeriod] = useState("3");

  const loading = transactionsLoading || cardsLoading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const periodTransactions = useMemo(() => {
    const months = parseInt(period);
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, period]);

  const summary = useMemo(() => {
    const income = periodTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = periodTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    return { income, expenses, savings, savingsRate };
  }, [periodTransactions]);

  const expenseData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    
    periodTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });

    return Object.entries(byCategory).map(([category, value]) => ({
      name: categoryLabels[category] || category,
      value,
      color: categoryColors[category] || "hsl(200, 95%, 45%)",
    }));
  }, [periodTransactions]);

  const monthlyData = useMemo(() => {
    const months = parseInt(period);
    const now = new Date();
    const data: { month: string; income: number; expenses: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString("pt-BR", { month: "short" });
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      });

      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({ month: monthKey.replace(".", ""), income, expenses });
    }

    return data;
  }, [transactions, period]);

  const cardExpenses = useMemo(() => {
    const byCard: Record<string, { name: string; value: number }> = {};

    periodTransactions
      .filter(t => t.type === "expense" && t.card_brand)
      .forEach(t => {
        const brand = t.card_brand!;
        if (!byCard[brand]) {
          byCard[brand] = { name: brand.charAt(0).toUpperCase() + brand.slice(1), value: 0 };
        }
        byCard[brand].value += t.amount;
      });

    return Object.values(byCard).sort((a, b) => b.value - a.value);
  }, [periodTransactions]);

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Análise detalhada das suas finanças</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Último mês</SelectItem>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(summary.income)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Despesa Total</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(summary.expenses)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Economia</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(summary.savings)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Taxa de Economia</p>
                  <p className="text-2xl font-bold">{summary.savingsRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlyChart data={monthlyData} />
              <ExpenseChart data={expenseData} />
            </div>

            {/* Card Expenses Chart */}
            {cardExpenses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gastos por Cartão</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cardExpenses} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        tickFormatter={formatCurrency}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

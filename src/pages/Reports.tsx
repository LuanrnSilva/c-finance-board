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
import { Download, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const expenseData = [
  { name: "Alimentação", value: 1200, color: "hsl(262, 83%, 58%)" },
  { name: "Transporte", value: 450, color: "hsl(142, 76%, 36%)" },
  { name: "Compras", value: 890, color: "hsl(38, 92%, 50%)" },
  { name: "Casa", value: 2100, color: "hsl(0, 84%, 60%)" },
  { name: "Outros", value: 320, color: "hsl(200, 95%, 45%)" },
];

const monthlyData = [
  { month: "Jul", income: 8500, expenses: 5200 },
  { month: "Ago", income: 8500, expenses: 4800 },
  { month: "Set", income: 9200, expenses: 5100 },
  { month: "Out", income: 8500, expenses: 5600 },
  { month: "Nov", income: 8500, expenses: 4900 },
  { month: "Dez", income: 8500, expenses: 4960 },
];

const cardExpenses = [
  { name: "Nubank", value: 2340 },
  { name: "Santander", value: 1850 },
  { name: "Itaú", value: 890 },
  { name: "Inter", value: 3200 },
  { name: "C6", value: 1100 },
];

export default function Reports() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Análise detalhada das suas finanças</p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="december">
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="december">Dezembro 2024</SelectItem>
                <SelectItem value="november">Novembro 2024</SelectItem>
                <SelectItem value="october">Outubro 2024</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(8500)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Despesa Total</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(4960)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Economia</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(3540)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Taxa de Economia</p>
              <p className="text-2xl font-bold">41.6%</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyChart data={monthlyData} />
          <ExpenseChart data={expenseData} />
        </div>

        {/* Card Expenses Chart */}
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
      </div>
    </AppLayout>
  );
}

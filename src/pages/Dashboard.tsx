import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { CreditCardWidget } from "@/components/dashboard/CreditCardWidget";
import { TransactionItem } from "@/components/dashboard/TransactionItem";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Transaction } from "@/types/transaction";

// Mock data
const initialTransactions: Transaction[] = [
  { id: "1", description: "Supermercado Extra", category: "shopping", amount: 342.50, date: "2024-12-03", type: "expense", cardBrand: "Nubank" },
  { id: "2", description: "Uber", category: "transport", amount: 28.90, date: "2024-12-03", type: "expense", cardBrand: "Santander" },
  { id: "3", description: "Salário", category: "other", amount: 8500, date: "2024-12-01", type: "income" },
  { id: "4", description: "iFood", category: "food", amount: 67.80, date: "2024-12-02", type: "expense", cardBrand: "Nubank" },
  { id: "5", description: "Netflix", category: "tech", amount: 55.90, date: "2024-12-01", type: "expense", cardBrand: "C6" },
];

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

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpenses;

  const handleAddTransaction = (transaction: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    card?: string;
    date: string;
  }) => {
    const newTransaction = {
      id: Date.now().toString(),
      ...transaction,
      cardBrand: transaction.card,
    };
    setTransactions([newTransaction, ...transactions]);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Olá, João!</h1>
            <p className="text-muted-foreground">Aqui está o resumo das suas finanças</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
                2
              </span>
            </Button>
            <AddTransactionDialog onAdd={handleAddTransaction} />
          </div>
        </div>

        {/* Balance & Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BalanceCard
            balance={balance}
            income={totalIncome}
            expenses={totalExpenses}
          />
          <CreditCardWidget
            brand="nubank"
            name="João Silva"
            lastDigits="4832"
            limit={5000}
            used={2340}
          />
          <CreditCardWidget
            brand="santander"
            name="João Silva"
            lastDigits="7621"
            limit={8000}
            used={1850}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyChart data={monthlyData} />
          <ExpenseChart data={expenseData} />
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Transações Recentes</CardTitle>
            <Link to="/transactions">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                Ver todas
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {transactions.slice(0, 5).map((transaction) => (
              <TransactionItem key={transaction.id} {...transaction} />
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

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
import { useTransactions } from "@/hooks/useTransactions";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

const monthlyData = [
  { month: "Jul", income: 8500, expenses: 5200 },
  { month: "Ago", income: 8500, expenses: 4800 },
  { month: "Set", income: 9200, expenses: 5100 },
  { month: "Out", income: 8500, expenses: 5600 },
  { month: "Nov", income: 8500, expenses: 4900 },
  { month: "Dez", income: 8500, expenses: 4960 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, loading: transactionsLoading, addTransaction } = useTransactions();
  const { cards, loading: cardsLoading } = useCreditCards();
  
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpenses;

  // Calculate expense data by category
  const expenseData = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount, color: getCategoryColor(t.category) });
      }
      return acc;
    }, [] as { name: string; value: number; color: string }[]);

  const handleAddTransaction = async (transaction: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    card?: string;
    date: string;
  }) => {
    await addTransaction({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      card_brand: transaction.card,
      date: transaction.date,
    });
  };

  const isLoading = transactionsLoading || cardsLoading;

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Olá, {userName}!</h1>
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
          {isLoading ? (
            <>
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </>
          ) : (
            <>
              <BalanceCard
                balance={balance}
                income={totalIncome}
                expenses={totalExpenses}
              />
              {cards.slice(0, 2).map((card) => (
                <CreditCardWidget
                  key={card.id}
                  brand={card.brand as "nubank" | "santander" | "c6" | "itau" | "bb" | "inter"}
                  name={card.name}
                  lastDigits={card.last_digits}
                  limit={card.credit_limit}
                  used={card.used_amount}
                />
              ))}
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyChart data={monthlyData} />
          <ExpenseChart data={expenseData.length > 0 ? expenseData : [{ name: "Sem dados", value: 0, color: "hsl(var(--muted))" }]} />
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
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma transação encontrada</p>
            ) : (
              transactions.slice(0, 5).map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  id={transaction.id}
                  description={transaction.description}
                  category={transaction.category}
                  amount={transaction.amount}
                  date={transaction.date}
                  type={transaction.type as "income" | "expense"}
                  cardBrand={transaction.card_brand || undefined}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: "hsl(262, 83%, 58%)",
    transport: "hsl(142, 76%, 36%)",
    shopping: "hsl(38, 92%, 50%)",
    home: "hsl(0, 84%, 60%)",
    tech: "hsl(200, 95%, 45%)",
    other: "hsl(280, 60%, 50%)",
  };
  return colors[category] || colors.other;
}

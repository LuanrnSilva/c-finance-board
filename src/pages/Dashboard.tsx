import { countsTowardTotals } from "@/types/transaction";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GoalsSummary } from "@/components/dashboard/GoalsSummary";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cardUsedAmount, isSameMonth, colorFromName } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import type { NewTransaction } from "@/types/transaction";
import { useAuth } from "@/contexts/AuthContext";
import { subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, loading: transactionsLoading, addTransaction } = useTransactions();
  const { cards, loading: cardsLoading, updateCard } = useCreditCards();
  
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  
  const { categories } = useCategories();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(now, "yyyy-MM"));
  const [selYear, selMonthIdx] = selectedMonth.split("-").map(Number);
  const selMonth = selMonthIdx - 1;

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), i);
      const label = format(d, "MMMM 'de' yyyy", { locale: ptBR });
      return { value: format(d, "yyyy-MM"), label: label.charAt(0).toUpperCase() + label.slice(1) };
    });
  }, []);

  const { monthlyEstimate: recurringMonthly, items: recurringItems } = useRecurringExpenses(transactions);
  const allMonthTransactions = transactions.filter((t) => isSameMonth(t.date, selYear, selMonth));
  const monthTransactions = allMonthTransactions.filter(countsTowardTotals);
  const disputedTotal = allMonthTransactions
    .filter((t) => t.status === "disputed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpenses;

  // Calculate expense data by category (selected month)
  const expenseData = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const label = categories.find((c) => c.value === t.category)?.name || t.category;
      const existing = acc.find((item) => item.name === label);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: label, value: t.amount, color: colorFromName(label) });
      }
      return acc;
    }, [] as { name: string; value: number; color: string }[]);

  // Monthly data: 6 months ending at the selected month
  const monthlyData = useMemo(() => {
    const months = [];
    const ref = new Date(selYear, selMonth, 1);
    
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(ref, i);
      const monthStr = format(month, 'MMM', { locale: ptBR });
      
      const mt = transactions.filter(t => isSameMonth(t.date, month.getFullYear(), month.getMonth()));
      
      const income = mt
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expenses = mt
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.push({ 
        month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1), 
        income, 
        expenses 
      });
    }
    
    return months;
  }, [transactions, selYear, selMonth]);

  const handleAddTransaction = async (transaction: Omit<NewTransaction, "card_brand"> & { card?: string }) => {
    const { card, ...rest } = transaction;
    await addTransaction({ ...rest, card_brand: card });
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
            {recurringItems.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Recorrentes: cerca de <span className="font-semibold text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(recurringMonthly)}</span>/mês ({recurringItems.length} gastos)
              </p>
            )}
            {disputedTotal > 0 && (
              <p className="text-sm text-warning">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(disputedTotal)} em lançamentos contestados fora dos totais
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
                2
              </span>
            </Button>
            <AddTransactionDialog onAdd={handleAddTransaction} cards={cards} categories={categories} />
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
                  id={card.id}
                  brand={card.brand}
                  name={card.name}
                  lastDigits={card.last_digits}
                  limit={card.credit_limit}
                  used={cardUsedAmount(transactions, card.id, now.getFullYear(), now.getMonth())}
                  onUpdateLimit={updateCard}
                />
              ))}
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetProgress transactions={transactions} categories={categories} year={selYear} month={selMonth} />
          <GoalsSummary />
        </div>

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
                  transaction={{
                    ...transaction,
                    type: transaction.type as "income" | "expense",
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

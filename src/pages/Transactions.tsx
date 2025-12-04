import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionItem } from "@/components/dashboard/TransactionItem";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Loader2 } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCreditCards } from "@/hooks/useCreditCards";

export default function Transactions() {
  const { transactions, loading, addTransaction } = useTransactions();
  const { cards } = useCreditCards();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "income" && t.type === "income") ||
      (filter === "expense" && t.type === "expense");
    return matchesSearch && matchesFilter;
  });

  const handleAddTransaction = async (transaction: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    card?: string;
    credit_card_id?: string;
    date: string;
  }) => {
    await addTransaction({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      card_brand: transaction.card,
      credit_card_id: transaction.credit_card_id,
      date: transaction.date,
    });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transações</h1>
            <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
          </div>
          <AddTransactionDialog onAdd={handleAddTransaction} cards={cards} />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <TransactionItem 
                  key={transaction.id} 
                  id={transaction.id}
                  description={transaction.description}
                  category={transaction.category}
                  amount={transaction.amount}
                  date={transaction.date}
                  type={transaction.type}
                  cardBrand={transaction.card_brand}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

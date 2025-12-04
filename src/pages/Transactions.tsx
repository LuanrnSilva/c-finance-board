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
import { Search, Filter } from "lucide-react";
import type { Transaction } from "@/types/transaction";

const allTransactions: Transaction[] = [
  { id: "1", description: "Supermercado Extra", category: "shopping", amount: 342.50, date: "2024-12-03", type: "expense", cardBrand: "Nubank" },
  { id: "2", description: "Uber", category: "transport", amount: 28.90, date: "2024-12-03", type: "expense", cardBrand: "Santander" },
  { id: "3", description: "Salário", category: "other", amount: 8500, date: "2024-12-01", type: "income" },
  { id: "4", description: "iFood", category: "food", amount: 67.80, date: "2024-12-02", type: "expense", cardBrand: "Nubank" },
  { id: "5", description: "Netflix", category: "tech", amount: 55.90, date: "2024-12-01", type: "expense", cardBrand: "C6" },
  { id: "6", description: "Conta de Luz", category: "home", amount: 180.00, date: "2024-11-30", type: "expense" as const },
  { id: "7", description: "Freelance", category: "other", amount: 1500, date: "2024-11-28", type: "income" as const },
  { id: "8", description: "Farmácia", category: "shopping", amount: 89.90, date: "2024-11-27", type: "expense" as const, cardBrand: "Itaú" },
  { id: "9", description: "Gasolina", category: "transport", amount: 250.00, date: "2024-11-25", type: "expense" as const, cardBrand: "Santander" },
  { id: "10", description: "Academia", category: "other", amount: 120.00, date: "2024-11-24", type: "expense" as const, cardBrand: "Nubank" },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(allTransactions);
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transações</h1>
            <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
          </div>
          <AddTransactionDialog onAdd={handleAddTransaction} />
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
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} {...transaction} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

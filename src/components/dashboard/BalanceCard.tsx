import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
}

export function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          <span className="text-sm opacity-90">Saldo Total</span>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold mb-6">{formatCurrency(balance)}</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-xs opacity-70">Receitas</p>
            <p className="font-semibold text-sm">{formatCurrency(income)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <p className="text-xs opacity-70">Despesas</p>
            <p className="font-semibold text-sm">{formatCurrency(expenses)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

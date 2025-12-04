import { ShoppingBag, Coffee, Car, Home, Smartphone, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  cardBrand?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  shopping: ShoppingBag,
  food: Coffee,
  transport: Car,
  home: Home,
  tech: Smartphone,
  other: CreditCard,
};

export function TransactionItem({
  description,
  category,
  amount,
  date,
  type,
  cardBrand,
}: TransactionItemProps) {
  const Icon = categoryIcons[category] || CreditCard;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors">
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        type === "income" ? "bg-success/10" : "bg-destructive/10"
      )}>
        <Icon className={cn(
          "w-5 h-5",
          type === "income" ? "text-success" : "text-destructive"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{description}</p>
        <p className="text-sm text-muted-foreground">
          {formatDate(date)}
          {cardBrand && ` • ${cardBrand}`}
        </p>
      </div>
      
      <p className={cn(
        "font-semibold",
        type === "income" ? "text-success" : "text-destructive"
      )}>
        {type === "income" ? "+" : "-"}{formatCurrency(amount)}
      </p>
    </div>
  );
}

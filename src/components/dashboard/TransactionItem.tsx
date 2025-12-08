import { useState } from "react";
import { ShoppingBag, Coffee, Car, Home, Smartphone, CreditCard, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TransactionItemProps {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  cardBrand?: string;
  personName?: string;
  onDelete?: (id: string) => Promise<{ success: boolean }>;
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
  id,
  description,
  category,
  amount,
  date,
  type,
  cardBrand,
  personName,
  onDelete,
}: TransactionItemProps) {
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(id);
    setDeleting(false);
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors group">
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatDate(date)}</span>
          {cardBrand && <span>• {cardBrand}</span>}
          {personName && (
            <span className="flex items-center gap-1">
              • <User className="w-3 h-3" /> {personName}
            </span>
          )}
        </div>
      </div>
      
      <p className={cn(
        "font-semibold",
        type === "income" ? "text-success" : "text-destructive"
      )}>
        {type === "income" ? "+" : "-"}{formatCurrency(amount)}
      </p>

      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{description}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

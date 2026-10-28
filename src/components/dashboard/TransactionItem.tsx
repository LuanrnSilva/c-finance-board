import { useState } from "react";
import { ShoppingBag, Coffee, Car, Home, Smartphone, CreditCard, Trash2, User, Tag } from "lucide-react";
import { cn, parseLocalDate } from "@/lib/utils";
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
import { EditTransactionDialog } from "@/components/transactions/EditTransactionDialog";
import type { Transaction } from "@/types/transaction";
import type { CreditCard as CreditCardType } from "@/hooks/useCreditCards";
import type { Person } from "@/hooks/usePeople";
import type { Category } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/transactions/StatusBadge";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string, scope?: "single" | "group") => Promise<{ success: boolean }>;
  onUpdate?: (id: string, updates: Partial<Transaction>) => Promise<{ success: boolean }>;
  cards?: CreditCardType[];
  people?: Person[];
  categories?: Category[];
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
  transaction,
  onDelete,
  onUpdate,
  cards = [],
  people = [],
  categories = [],
}: TransactionItemProps) {
  const [deleting, setDeleting] = useState(false);
  const { user, members } = useAuth();
  const creator = members.length > 1 ? members.find((m) => m.user_id === transaction.created_by) : undefined;
  const creatorName = creator ? (creator.user_id === user?.id ? "Você" : creator.full_name || "Membro") : undefined;
  const { id, description, category, amount, date, type, card_brand: cardBrand, person_name: personName } = transaction;
  const Icon = categoryIcons[category] || Tag;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return parseLocalDate(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const isGrouped = !!transaction.installment_group_id;
  const handleDelete = async (scope: "single" | "group" = "single") => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(id, scope);
    setDeleting(false);
  };

  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] sm:flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-secondary/50 transition-colors group">
      <div className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center",
        type === "income" ? "bg-success/10" : "bg-destructive/10"
      )}>
        <Icon className={cn(
          "w-5 h-5",
          type === "income" ? "text-success" : "text-destructive"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{description}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <span>{formatDate(date)}</span>
          {cardBrand && <span>• {cardBrand}</span>}
          {personName && (
            <span className="flex items-center gap-1">
              • <User className="w-3 h-3" /> {personName}
            </span>
          )}
          {creatorName && (
            <span className="flex items-center gap-1" title={`Lançado por ${creatorName}`}>
              • <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center">{creatorName.slice(0, 1).toUpperCase()}</span>
              {creatorName}
            </span>
          )}
          {members.length > 1 && <StatusBadge status={transaction.status} />}
          {transaction.installment_total && (
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
              {transaction.installment_current}/{transaction.installment_total}x
            </span>
          )}
        </div>
        {transaction.status === "disputed" && transaction.dispute_note && (
          <p className="text-sm text-destructive mt-1 break-words">
            Contestado{transaction.created_by === user?.id ? " — edite para enviar de novo" : ""}: {transaction.dispute_note}
          </p>
        )}
      </div>
      
      <p className={cn(
        "col-start-2 font-semibold break-words sm:whitespace-nowrap",
        type === "income" ? "text-success" : "text-destructive"
      )}>
        {type === "income" ? "+" : "-"}{formatCurrency(amount)}
      </p>

      <div className="col-start-2 flex items-center gap-1 sm:shrink-0">
        {onUpdate && (
          <EditTransactionDialog
            transaction={transaction}
            onUpdate={onUpdate}
            cards={cards}
            people={people}
            categories={categories}
          />
        )}

        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Excluir ${description}`}
                className="sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isGrouped
                    ? `"${description}" faz parte de uma compra parcelada. Deseja excluir só esta parcela ou todas as parcelas do grupo?`
                    : `Tem certeza que deseja excluir "${description}"? Esta ação não pode ser desfeita.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                {isGrouped && (
                  <AlertDialogAction
                    onClick={() => handleDelete("group")}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir todas
                  </AlertDialogAction>
                )}
                <AlertDialogAction
                  onClick={() => handleDelete("single")}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Excluindo..." : isGrouped ? "Só esta parcela" : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

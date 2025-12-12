import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { CreditCard } from "@/hooks/useCreditCards";
import type { Person } from "@/hooks/usePeople";
import type { Category } from "@/hooks/useCategories";
import type { Transaction } from "@/hooks/useTransactions";

interface EditTransactionDialogProps {
  transaction: Transaction;
  onUpdate: (id: string, updates: Partial<Transaction>) => Promise<{ success: boolean }>;
  cards?: CreditCard[];
  people?: Person[];
  categories?: Category[];
}

export function EditTransactionDialog({
  transaction,
  onUpdate,
  cards = [],
  people = [],
  categories = [],
}: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type, setType] = useState<"income" | "expense">(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [selectedCard, setSelectedCard] = useState(transaction.credit_card_id || "");
  const [selectedPerson, setSelectedPerson] = useState(transaction.person_id || "");
  const [date, setDate] = useState(transaction.date);
  const [isInstallment, setIsInstallment] = useState(!!transaction.installment_total);
  const [installmentCurrent, setInstallmentCurrent] = useState(transaction.installment_current?.toString() || "1");
  const [installmentTotal, setInstallmentTotal] = useState(transaction.installment_total?.toString() || "2");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setCategory(transaction.category);
      setSelectedCard(transaction.credit_card_id || "");
      setSelectedPerson(transaction.person_id || "");
      setDate(transaction.date);
      setIsInstallment(!!transaction.installment_total);
      setInstallmentCurrent(transaction.installment_current?.toString() || "1");
      setInstallmentTotal(transaction.installment_total?.toString() || "2");
    }
  }, [open, transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !category) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const card = cards.find(c => c.id === selectedCard);

    setLoading(true);
    const result = await onUpdate(transaction.id, {
      description,
      amount: parseFloat(amount),
      type,
      category,
      card_brand: card?.brand,
      credit_card_id: selectedCard || undefined,
      person_id: selectedPerson || undefined,
      date,
      installment_current: isInstallment && type === "expense" ? parseInt(installmentCurrent) : undefined,
      installment_total: isInstallment && type === "expense" ? parseInt(installmentTotal) : undefined,
    });
    setLoading(false);

    if (result.success) {
      toast({
        title: "Transação atualizada",
        description: "Suas alterações foram salvas com sucesso!",
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              onClick={() => setType("expense")}
              className="w-full"
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              onClick={() => setType("income")}
              className="w-full"
            >
              Receita
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Valor</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.value}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "expense" && cards.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit-card">Cartão (opcional)</Label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.brand.charAt(0).toUpperCase() + c.brand.slice(1)} •••• {c.last_digits}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "expense" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  id="edit-installment"
                  checked={isInstallment}
                  onCheckedChange={setIsInstallment}
                />
                <Label htmlFor="edit-installment">Parcelado</Label>
              </div>
              {isInstallment && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-installment-current">Parcela atual</Label>
                    <Input
                      id="edit-installment-current"
                      type="number"
                      min="1"
                      value={installmentCurrent}
                      onChange={(e) => setInstallmentCurrent(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-installment-total">Total de parcelas</Label>
                    <Input
                      id="edit-installment-total"
                      type="number"
                      min="2"
                      value={installmentTotal}
                      onChange={(e) => setInstallmentTotal(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {people.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit-person">Pessoa (opcional)</Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pessoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-date">Data</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

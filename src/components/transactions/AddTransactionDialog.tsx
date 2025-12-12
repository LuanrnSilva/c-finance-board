import { useState } from "react";
import { Plus } from "lucide-react";
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

interface AddTransactionDialogProps {
  onAdd: (transaction: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    card?: string;
    credit_card_id?: string;
    person_id?: string;
    date: string;
    installment_current?: number;
    installment_total?: number;
  }) => void;
  cards?: CreditCard[];
  people?: Person[];
  categories?: Category[];
}

export function AddTransactionDialog({ onAdd, cards = [], people = [], categories = [] }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [selectedCard, setSelectedCard] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCurrent, setInstallmentCurrent] = useState("1");
  const [installmentTotal, setInstallmentTotal] = useState("2");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
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

    onAdd({
      description,
      amount: parseFloat(amount),
      type,
      category,
      card: card?.brand,
      credit_card_id: selectedCard || undefined,
      person_id: selectedPerson || undefined,
      date,
      installment_current: isInstallment && type === "expense" ? parseInt(installmentCurrent) : undefined,
      installment_total: isInstallment && type === "expense" ? parseInt(installmentTotal) : undefined,
    });

    toast({
      title: "Transação adicionada",
      description: "Sua transação foi registrada com sucesso!",
    });

    setOpen(false);
    setDescription("");
    setAmount("");
    setCategory("");
    setSelectedCard("");
    setSelectedPerson("");
    setIsInstallment(false);
    setInstallmentCurrent("1");
    setInstallmentTotal("2");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
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
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
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
              <Label htmlFor="card">Cartão (opcional)</Label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
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
                  id="installment"
                  checked={isInstallment}
                  onCheckedChange={setIsInstallment}
                />
                <Label htmlFor="installment">Parcelado</Label>
              </div>
              {isInstallment && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="installment-current">Parcela atual</Label>
                    <Input
                      id="installment-current"
                      type="number"
                      min="1"
                      value={installmentCurrent}
                      onChange={(e) => setInstallmentCurrent(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="installment-total">Total de parcelas</Label>
                    <Input
                      id="installment-total"
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
              <Label htmlFor="person">Pessoa (opcional)</Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pessoa" />
                </SelectTrigger>
                <SelectContent>
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
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">
            Adicionar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

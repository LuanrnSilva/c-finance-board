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
import { useToast } from "@/hooks/use-toast";

const categories = [
  { value: "shopping", label: "Compras" },
  { value: "food", label: "Alimentação" },
  { value: "transport", label: "Transporte" },
  { value: "home", label: "Casa" },
  { value: "tech", label: "Tecnologia" },
  { value: "other", label: "Outros" },
];

const cards = [
  { value: "nubank", label: "Nubank" },
  { value: "santander", label: "Santander" },
  { value: "itau", label: "Itaú" },
  { value: "inter", label: "Inter" },
  { value: "c6", label: "C6 Bank" },
];

interface AddTransactionDialogProps {
  onAdd?: (transaction: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    card?: string;
    date: string;
  }) => void;
}

export function AddTransactionDialog({ onAdd }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [card, setCard] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
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

    onAdd?.({
      description,
      amount: parseFloat(amount),
      type,
      category,
      card: card || undefined,
      date,
    });

    toast({
      title: "Transação adicionada",
      description: "Sua transação foi registrada com sucesso!",
    });

    setOpen(false);
    setDescription("");
    setAmount("");
    setCategory("");
    setCard("");
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
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "expense" && (
            <div className="space-y-2">
              <Label htmlFor="card">Cartão (opcional)</Label>
              <Select value={card} onValueChange={setCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
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

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

const brands = [
  { value: "nubank", label: "Nubank" },
  { value: "santander", label: "Santander" },
  { value: "itau", label: "Itaú" },
  { value: "inter", label: "Inter" },
  { value: "c6", label: "C6 Bank" },
  { value: "bb", label: "Banco do Brasil" },
];

interface AddCardDialogProps {
  onAdd: (card: {
    brand: string;
    name: string;
    last_digits: string;
    credit_limit: number;
  }) => Promise<{ success: boolean }>;
}

export function AddCardDialog({ onAdd }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [lastDigits, setLastDigits] = useState("");
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand || !name || !lastDigits || !limit) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (lastDigits.length !== 4 || !/^\d+$/.test(lastDigits)) {
      toast({
        title: "Erro",
        description: "Os últimos 4 dígitos devem conter apenas números",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await onAdd({
      brand,
      name,
      last_digits: lastDigits,
      credit_limit: parseFloat(limit),
    });

    setLoading(false);

    if (result.success) {
      toast({
        title: "Cartão adicionado",
        description: "Seu cartão foi cadastrado com sucesso!",
      });
      setOpen(false);
      setBrand("");
      setName("");
      setLastDigits("");
      setLimit("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Cartão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Cartão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Banco/Bandeira</Label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o banco" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome no Cartão</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastDigits">Últimos 4 dígitos</Label>
            <Input
              id="lastDigits"
              value={lastDigits}
              onChange={(e) => setLastDigits(e.target.value.slice(0, 4))}
              placeholder="0000"
              maxLength={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Limite</Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

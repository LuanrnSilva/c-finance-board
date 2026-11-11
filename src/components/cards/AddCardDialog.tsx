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
import { cardNetworks } from "@/lib/cardNetworks";

const brands = [
  { value: "nubank", label: "Nubank" },
  { value: "santander", label: "Santander" },
  { value: "itau", label: "Itaú" },
  { value: "inter", label: "Inter" },
  { value: "c6", label: "C6 Bank" },
  { value: "bb", label: "Banco do Brasil" },
  { value: "porto", label: "Porto" },
  { value: "bradesco", label: "Bradesco" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "pan", label: "Banco Pan" },
];

interface AddCardDialogProps {
  onAdd: (card: {
    brand: string;
    name: string;
    last_digits: string;
    credit_limit: number;
    color?: string | null;
    network?: string | null;
    alias?: string | null;
  }) => Promise<{ success: boolean }>;
}

export function AddCardDialog({ onAdd }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [lastDigits, setLastDigits] = useState("");
  const [limit, setLimit] = useState("");
  const [network, setNetwork] = useState("");
  const [color, setColor] = useState("#8a05be");
  const [useColor, setUseColor] = useState(false);
  const [alias, setAlias] = useState("");
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

    if (alias.trim().length > 20) {
      toast({ title: "Erro", description: "O apelido deve ter até 20 caracteres", variant: "destructive" });
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
      network: network || null,
      color: useColor ? color : null,
      alias: alias.trim() || null,
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
      setNetwork("");
      setUseColor(false);
      setAlias("");
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
            <Label htmlFor="brand">Banco</Label>
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
            <Label>Bandeira</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger><SelectValue placeholder="Visa, Mastercard, Elo..." /></SelectTrigger>
              <SelectContent>
                {cardNetworks.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="alias">Apelido para importar</Label>
              <Input id="alias" value={alias} maxLength={20} onChange={(e) => setAlias(e.target.value)} placeholder="Ex: NU, Belo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex items-center gap-2">
                <Input id="color" type="color" value={color} onChange={(e) => { setColor(e.target.value); setUseColor(true); }} className="h-11 w-16 p-1 cursor-pointer" />
                {useColor ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setUseColor(false)}>Padrão</Button>
                ) : <span className="text-xs text-muted-foreground">Padrão do banco</span>}
              </div>
            </div>
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

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

const contractTypes = [
  { value: "financing", label: "Financiamento" },
  { value: "consortium", label: "Consórcio/Carta de Crédito" },
  { value: "loan", label: "Empréstimo" },
];

interface AddContractDialogProps {
  onAdd: (contract: {
    name: string;
    type: string;
    total_value: number;
    installment_value: number;
    total_installments: number;
    paid_installments: number;
  }) => Promise<{ success: boolean }>;
}

export function AddContractDialog({ onAdd }: AddContractDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [installmentValue, setInstallmentValue] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [paidInstallments, setPaidInstallments] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type || !name || !totalValue || !installmentValue || !totalInstallments || !paidInstallments) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const totalInst = parseInt(totalInstallments);
    const paidInst = parseInt(paidInstallments);

    if (paidInst > totalInst) {
      toast({
        title: "Erro",
        description: "Parcelas pagas não pode ser maior que o total",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await onAdd({
      name,
      type,
      total_value: parseFloat(totalValue),
      installment_value: parseFloat(installmentValue),
      total_installments: totalInst,
      paid_installments: paidInst,
    });

    setLoading(false);

    if (result.success) {
      toast({
        title: "Contrato adicionado",
        description: "Seu contrato foi cadastrado com sucesso!",
      });
      setOpen(false);
      setType("");
      setName("");
      setTotalValue("");
      setInstallmentValue("");
      setTotalInstallments("");
      setPaidInstallments("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Contrato</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome/Descrição</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Financiamento Apartamento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalValue">Valor Total</Label>
            <Input
              id="totalValue"
              type="number"
              step="0.01"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installmentValue">Valor da Parcela</Label>
            <Input
              id="installmentValue"
              type="number"
              step="0.01"
              value={installmentValue}
              onChange={(e) => setInstallmentValue(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paidInstallments">Parcelas Pagas</Label>
              <Input
                id="paidInstallments"
                type="number"
                value={paidInstallments}
                onChange={(e) => setPaidInstallments(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalInstallments">Total de Parcelas</Label>
              <Input
                id="totalInstallments"
                type="number"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

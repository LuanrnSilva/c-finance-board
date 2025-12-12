import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";

interface EditContractDialogProps {
  contractId: string;
  contractName: string;
  currentPaidInstallments: number;
  totalInstallments: number;
  onUpdate: (id: string, updates: { paid_installments: number }) => Promise<{ success: boolean }>;
}

export function EditContractDialog({
  contractId,
  contractName,
  currentPaidInstallments,
  totalInstallments,
  onUpdate,
}: EditContractDialogProps) {
  const [open, setOpen] = useState(false);
  const [paidInstallments, setPaidInstallments] = useState(currentPaidInstallments.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const paid = parseInt(paidInstallments);
    
    if (isNaN(paid) || paid < 0) {
      toast({
        title: "Erro",
        description: "Valor inválido",
        variant: "destructive",
      });
      return;
    }

    if (paid > totalInstallments) {
      toast({
        title: "Erro",
        description: "Parcelas pagas não pode exceder o total",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await onUpdate(contractId, { paid_installments: paid });
    setLoading(false);

    if (result.success) {
      toast({
        title: "Contrato atualizado",
        description: "Parcelas atualizadas com sucesso!",
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
          className="absolute top-2 right-2 z-20 text-white/70 hover:text-white hover:bg-white/20"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Atualizar Parcelas</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">{contractName}</p>
          
          <div className="space-y-2">
            <Label htmlFor="paidInstallments">Parcelas Pagas (de {totalInstallments})</Label>
            <Input
              id="paidInstallments"
              type="number"
              min="0"
              max={totalInstallments}
              value={paidInstallments}
              onChange={(e) => setPaidInstallments(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

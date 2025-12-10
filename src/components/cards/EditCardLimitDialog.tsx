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

interface EditCardLimitDialogProps {
  cardId: string;
  cardName: string;
  currentLimit: number;
  onUpdate: (id: string, updates: { credit_limit: number }) => Promise<{ success: boolean }>;
}

export function EditCardLimitDialog({ cardId, cardName, currentLimit, onUpdate }: EditCardLimitDialogProps) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(currentLimit.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newLimit = parseFloat(limit);
    if (isNaN(newLimit) || newLimit <= 0) {
      toast({
        title: "Erro",
        description: "Digite um limite válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await onUpdate(cardId, { credit_limit: newLimit });
    setLoading(false);

    if (result.success) {
      toast({
        title: "Limite atualizado",
        description: `O limite do cartão ${cardName} foi atualizado!`,
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-20 text-white/80 hover:text-white hover:bg-white/20">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Editar Limite</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="limit">Novo Limite</Label>
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
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

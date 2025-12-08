import { useState } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Person } from "@/hooks/usePeople";

interface ManagePeopleDialogProps {
  people: Person[];
  onAdd: (name: string) => Promise<{ success: boolean }>;
  onDelete: (id: string) => Promise<{ success: boolean }>;
}

export function ManagePeopleDialog({ people, onAdd, onDelete }: ManagePeopleDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome da pessoa",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await onAdd(newName.trim());
    setLoading(false);

    if (result.success) {
      toast({
        title: "Pessoa adicionada",
        description: `${newName} foi adicionado(a) com sucesso!`,
      });
      setNewName("");
    }
  };

  const handleDelete = async (person: Person) => {
    const result = await onDelete(person.id);
    if (result.success) {
      toast({
        title: "Pessoa removida",
        description: `${person.name} foi removido(a)`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="w-4 h-4" />
          Gerenciar Pessoas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Pessoas</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleAdd} className="flex gap-2 mt-4">
          <div className="flex-1">
            <Label htmlFor="personName" className="sr-only">Nome</Label>
            <Input
              id="personName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da pessoa"
            />
          </div>
          <Button type="submit" disabled={loading} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        <ScrollArea className="h-[300px] mt-4">
          {people.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma pessoa cadastrada
            </div>
          ) : (
            <div className="space-y-2">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <span className="font-medium">{person.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(person)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

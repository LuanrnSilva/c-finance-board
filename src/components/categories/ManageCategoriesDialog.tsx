import { useState } from "react";
import { Settings, Plus, Trash2, Tag } from "lucide-react";
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
import type { Category } from "@/hooks/useCategories";

interface ManageCategoriesDialogProps {
  categories: Category[];
  customCategories: Category[];
  onAdd: (name: string, value: string, icon?: string) => Promise<{ success: boolean }>;
  onDelete: (id: string) => Promise<{ success: boolean }>;
}

export function ManageCategoriesDialog({
  categories,
  customCategories,
  onAdd,
  onDelete,
}: ManageCategoriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateValue = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a categoria",
        variant: "destructive",
      });
      return;
    }

    const value = generateValue(name);
    const exists = categories.some(c => c.value === value);

    if (exists) {
      toast({
        title: "Erro",
        description: "Já existe uma categoria com esse nome",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await onAdd(name.trim(), value);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Categoria adicionada",
        description: `"${name}" foi adicionada com sucesso`,
      });
      setName("");
    }
  };

  const handleDelete = async (id: string, categoryName: string) => {
    setLoading(true);
    const result = await onDelete(id);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Categoria removida",
        description: `"${categoryName}" foi removida`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="category-name" className="sr-only">
                Nome da categoria
              </Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nova categoria..."
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <Button onClick={handleAdd} disabled={loading}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Categorias padrão
              </p>
              {categories
                .filter(c => c.id.startsWith("default-"))
                .map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span>{category.name}</span>
                    </div>
                  </div>
                ))}

              {customCategories.length > 0 && (
                <>
                  <p className="text-sm font-medium text-muted-foreground mt-4 mb-2">
                    Suas categorias
                  </p>
                  {customCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-primary" />
                        <span>{category.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={loading}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

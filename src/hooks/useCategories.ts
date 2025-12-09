import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  name: string;
  value: string;
  icon: string;
}

const defaultCategories: Category[] = [
  { id: "default-shopping", name: "Compras", value: "shopping", icon: "shopping-bag" },
  { id: "default-food", name: "Alimentação", value: "food", icon: "coffee" },
  { id: "default-transport", name: "Transporte", value: "transport", icon: "car" },
  { id: "default-home", name: "Casa", value: "home", icon: "home" },
  { id: "default-tech", name: "Tecnologia", value: "tech", icon: "smartphone" },
  { id: "default-other", name: "Outros", value: "other", icon: "credit-card" },
];

export function useCategories() {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCustomCategories([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;

      setCustomCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string, value: string, icon: string = "tag") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name,
          value,
          icon,
        })
        .select()
        .single();

      if (error) throw error;

      setCustomCategories(prev => [...prev, data]);
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar categoria",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCustomCategories(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const allCategories = [...defaultCategories, ...customCategories];

  return {
    categories: allCategories,
    customCategories,
    defaultCategories,
    loading,
    addCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}

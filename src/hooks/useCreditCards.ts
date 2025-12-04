import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CreditCard {
  id: string;
  brand: string;
  name: string;
  last_digits: string;
  credit_limit: number;
  used_amount: number;
}

export function useCreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCards([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cartões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCard = async (card: {
    brand: string;
    name: string;
    last_digits: string;
    credit_limit: number;
    used_amount?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("credit_cards")
        .insert({
          user_id: user.id,
          ...card,
          used_amount: card.used_amount || 0,
        })
        .select()
        .single();

      if (error) throw error;

      setCards(prev => [data, ...prev]);
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar cartão",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateCard = async (id: string, updates: Partial<CreditCard>) => {
    try {
      const { data, error } = await supabase
        .from("credit_cards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setCards(prev => prev.map(c => c.id === id ? data : c));
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cartão",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from("credit_cards")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCards(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cartão",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return {
    cards,
    loading,
    addCard,
    updateCard,
    deleteCard,
    refetch: fetchCards,
  };
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  card_brand?: string;
  credit_card_id?: string;
  person_id?: string;
  person_name?: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          people:person_id (name)
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      
      setTransactions(data?.map(t => ({
        ...t,
        type: t.type as "income" | "expense",
        person_name: t.people?.name,
      })) || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    card_brand?: string;
    credit_card_id?: string;
    person_id?: string;
    date: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          ...transaction,
        })
        .select(`
          *,
          people:person_id (name)
        `)
        .single();

      if (error) throw error;

      setTransactions(prev => [{
        ...data,
        type: data.type as "income" | "expense",
        person_name: data.people?.name,
      }, ...prev]);
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar transação",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao excluir transação",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update({
          description: updates.description,
          amount: updates.amount,
          type: updates.type,
          category: updates.category,
          card_brand: updates.card_brand,
          credit_card_id: updates.credit_card_id || null,
          person_id: updates.person_id || null,
          date: updates.date,
        })
        .eq("id", id)
        .select(`
          *,
          people:person_id (name)
        `)
        .single();

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t =>
          t.id === id
            ? {
                ...data,
                type: data.type as "income" | "expense",
                person_name: data.people?.name,
              }
            : t
        )
      );
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar transação",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    refetch: fetchTransactions,
  };
}

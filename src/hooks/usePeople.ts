import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Person {
  id: string;
  name: string;
  created_at: string;
}

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPeople = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPeople([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("people")
        .select("id, name, created_at")
        .order("name", { ascending: true });

      if (error) throw error;
      setPeople(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar pessoas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPerson = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("people")
        .insert({
          user_id: user.id,
          name,
        })
        .select("id, name, created_at")
        .single();

      if (error) throw error;

      setPeople(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return { success: true, data };
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar pessoa",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updatePerson = async (id: string, name: string) => {
    try {
      const { data, error } = await supabase
        .from("people")
        .update({ name })
        .eq("id", id)
        .select("id, name, created_at")
        .single();

      if (error) throw error;

      setPeople(prev => prev.map(p => p.id === id ? data : p).sort((a, b) => a.name.localeCompare(b.name)));
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar pessoa",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deletePerson = async (id: string) => {
    try {
      const { error } = await supabase
        .from("people")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPeople(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao excluir pessoa",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  return {
    people,
    loading,
    addPerson,
    updatePerson,
    deletePerson,
    refetch: fetchPeople,
  };
}

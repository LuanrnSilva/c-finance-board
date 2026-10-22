import { useState, useEffect } from "react";
import { getHouseholdId } from "@/lib/household";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Contract {
  id: string;
  name: string;
  type: string;
  total_value: number;
  installment_value: number;
  total_installments: number;
  paid_installments: number;
}

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContracts = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar contratos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setContracts(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          total_value: Number(c.total_value),
          installment_value: Number(c.installment_value),
          total_installments: c.total_installments,
          paid_installments: c.paid_installments,
        }))
      );
    }
    setLoading(false);
  };

  const addContract = async (contract: Omit<Contract, "id">) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return { success: false };
    }

    const { data, error } = await supabase
      .from("contracts")
      .insert({
        user_id: userData.user.id,
        household_id: await getHouseholdId(),
        name: contract.name,
        type: contract.type,
        total_value: contract.total_value,
        installment_value: contract.installment_value,
        total_installments: contract.total_installments,
        paid_installments: contract.paid_installments,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao adicionar contrato",
        description: error.message,
        variant: "destructive",
      });
      return { success: false };
    }

    setContracts((prev) => [
      {
        id: data.id,
        name: data.name,
        type: data.type,
        total_value: Number(data.total_value),
        installment_value: Number(data.installment_value),
        total_installments: data.total_installments,
        paid_installments: data.paid_installments,
      },
      ...prev,
    ]);
    return { success: true };
  };

  const updateContract = async (id: string, updates: Partial<Omit<Contract, "id">>) => {
    const { error } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar contrato",
        description: error.message,
        variant: "destructive",
      });
      return { success: false };
    }

    setContracts((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...updates }
          : c
      )
    );
    return { success: true };
  };

  const deleteContract = async (id: string) => {
    const { error } = await supabase.from("contracts").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir contrato",
        description: error.message,
        variant: "destructive",
      });
      return { success: false };
    }

    setContracts((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return {
    contracts,
    loading,
    addContract,
    updateContract,
    deleteContract,
    refetch: fetchContracts,
  };
}

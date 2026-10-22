import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getHouseholdId } from "@/lib/household";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
}

export function useBudgets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["budgets", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase.from("budgets").select("id, category, monthly_limit");
      if (error) throw error;
      return (data ?? []).map((b) => ({ ...b, monthly_limit: Number(b.monthly_limit) }));
    },
  });

  const onError = (title: string) => (e: Error) => toast({ title, description: e.message, variant: "destructive" });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["budgets"] });

  const setBudget = useMutation({
    mutationFn: async ({ category, monthly_limit }: { category: string; monthly_limit: number }) => {
      const household_id = await getHouseholdId();
      const { error } = await supabase
        .from("budgets")
        .upsert({ household_id, category, monthly_limit }, { onConflict: "household_id,category" });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Orçamento salvo" }); },
    onError: onError("Erro ao salvar orçamento"),
  });

  const removeBudget = useMutation({
    mutationFn: async (category: string) => {
      const { error } = await supabase.from("budgets").delete().eq("category", category);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: onError("Erro ao remover orçamento"),
  });

  return { budgets: query.data ?? [], loading: query.isLoading, setBudget, removeBudget };
}

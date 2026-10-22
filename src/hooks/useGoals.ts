import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getHouseholdId } from "@/lib/household";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface GoalContribution {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
  note: string | null;
  created_by: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  deadline: string | null;
  archived: boolean;
  created_by: string;
  created_at: string;
  saved: number;
  contributions: GoalContribution[];
}

export interface GoalInput {
  name: string;
  target_amount: number;
  deadline: string | null;
}

export interface ContributionInput {
  goal_id: string;
  amount: number;
  date: string;
  note?: string;
}

export function useGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const key = ["goals", user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from("goals")
        .select("*, goal_contributions(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((g) => {
        const contributions = (g.goal_contributions ?? [])
          .map((c) => ({ ...c, amount: Number(c.amount) }))
          .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
        return {
          id: g.id,
          name: g.name,
          target_amount: Number(g.target_amount),
          deadline: g.deadline,
          archived: g.archived,
          created_by: g.created_by,
          created_at: g.created_at,
          contributions,
          saved: contributions.reduce((s, c) => s + c.amount, 0),
        };
      });
    },
  });

  const onError = (title: string) => (e: Error) => toast({ title, description: e.message, variant: "destructive" });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["goals"] });

  const createGoal = useMutation({
    mutationFn: async (input: GoalInput) => {
      const household_id = await getHouseholdId();
      const { error } = await supabase.from("goals").insert({ ...input, household_id, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: onError("Erro ao criar meta"),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GoalInput> & { id: string; archived?: boolean }) => {
      const { error } = await supabase.from("goals").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: onError("Erro ao atualizar meta"),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: onError("Erro ao excluir meta"),
  });

  const addContribution = useMutation({
    mutationFn: async (input: ContributionInput) => {
      const household_id = await getHouseholdId();
      const { error } = await supabase
        .from("goal_contributions")
        .insert({ ...input, note: input.note || null, household_id, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: onError("Erro ao registrar aporte"),
  });

  const deleteContribution = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goal_contributions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: onError("Erro ao excluir aporte"),
  });

  return {
    goals: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    deleteContribution,
  };
}

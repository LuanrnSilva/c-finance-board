import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type RecurringSchedule = Tables<"recurring_schedules">;
export interface ScheduleInput {
  description: string;
  amount: number;
  category: string;
  credit_card_id: string;
  person_id: string;
  start_date: string;
  end_date: string;
}

export function useRecurringSchedules() {
  const { householdId } = useAuth();
  const client = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({
    queryKey: ["recurring-schedules", householdId],
    enabled: !!householdId,
    queryFn: async () => {
      if (!householdId) return [];
      const { error: generationError } = await supabase.rpc("generate_recurring_expenses", { _household: householdId });
      if (generationError) throw generationError;
      const { data, error } = await supabase.from("recurring_schedules").select("*").eq("household_id", householdId).order("next_date");
      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: true,
  });
  const manage = async (action: "create" | "edit" | "pause" | "resume" | "end", id?: string, input?: ScheduleInput) => {
    try {
      const { error } = await supabase.rpc("manage_recurring_schedule", { _action: action, _id: id, _input: input ? { ...input } : {} });
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["recurring-schedules"] });
      window.dispatchEvent(new Event("transactions-reviewed"));
      toast({ title: action === "create" ? "Despesa mensal programada" : "Agendamento atualizado" });
      return true;
    } catch (error) {
      toast({ title: "Não foi possível salvar o agendamento", description: (error as Error).message, variant: "destructive" });
      return false;
    }
  };
  return { schedules: query.data ?? [], loading: query.isLoading, error: query.error, refetch: query.refetch, manage };
}
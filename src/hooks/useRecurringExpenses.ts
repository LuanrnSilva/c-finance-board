import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getHouseholdId } from "@/lib/household";
import { detectRecurring, groupKey, RecurringGroup } from "@/lib/recurring";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@/types/transaction";

export type RecurringStatus = "confirmed" | "ignored";
export type RecurringItem = RecurringGroup & { status: RecurringStatus | null };

export function useRecurringExpenses(transactions: Transaction[]) {
  const { user, householdId } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const overridesQuery = useQuery({
    queryKey: ["recurring_overrides", user?.id, householdId],
    enabled: !!user && !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_overrides")
        .select("normalized_description, category, status");
      if (error) throw error;
      return data ?? [];
    },
  });

  const items = useMemo<RecurringItem[]>(() => {
    const overrides = new Map(
      (overridesQuery.data ?? []).map((o) => [groupKey(o.normalized_description, o.category), o.status as RecurringStatus])
    );
    const forced = new Set([...overrides].filter(([, s]) => s === "confirmed").map(([k]) => k));
    return detectRecurring(transactions, new Date(), forced)
      .map((g) => ({ ...g, status: overrides.get(g.key) ?? null }))
      .filter((g) => g.status !== "ignored");
  }, [transactions, overridesQuery.data]);

  const setStatus = useMutation({
    mutationFn: async ({ item, status }: { item: RecurringGroup; status: RecurringStatus }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const household_id = await getHouseholdId();
      const { error } = await supabase.from("recurring_overrides").upsert(
        { household_id, normalized_description: item.normalized, category: item.category, status, created_by: user.id },
        { onConflict: "household_id,normalized_description,category" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring_overrides"] }),
    onError: (e: Error) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const monthlyEstimate = items.reduce((s, i) => s + i.monthlyAverage, 0);

  return { items, monthlyEstimate, loading: overridesQuery.isLoading, setStatus };
}

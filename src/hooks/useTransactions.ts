import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getHouseholdId } from "@/lib/household";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildInstallments } from "@/lib/utils";
import type { Transaction, NewTransaction } from "@/types/transaction";

export type { Transaction, NewTransaction } from "@/types/transaction";

const SELECT = `*, people:person_id (name)`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(t: any): Transaction {
  return {
    ...t,
    amount: Number(t.amount),
    type: t.type as "income" | "expense",
    person_name: t.people?.name,
    created_by: t.user_id,
    status: (t.status ?? "confirmed") as Transaction["status"],
    card_brand: t.card_brand ?? undefined,
    credit_card_id: t.credit_card_id ?? undefined,
    person_id: t.person_id ?? undefined,
    installment_current: t.installment_current ?? undefined,
    installment_total: t.installment_total ?? undefined,
    installment_group_id: t.installment_group_id ?? undefined,
  };
}

const byDateDesc = (a: Transaction, b: Transaction) => b.date.localeCompare(a.date);

export function useTransactions() {
  const { householdId } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const showError = (title: string, error: unknown) => {
    toast({
      title,
      description: error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error),
      variant: "destructive",
    });
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTransactions([]);
        return;
      }
      const { data, error } = await supabase
        .from("transactions")
        .select(SELECT)
        .order("date", { ascending: false });
      if (error) throw error;
      setTransactions((data || []).map(mapRow));
    } catch (error) {
      showError("Erro ao carregar transações", error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: NewTransaction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const householdId = await getHouseholdId();

      const total = transaction.installment_total ?? 0;
      let rows;
      if (total > 1) {
        const current = Math.min(Math.max(1, transaction.installment_current ?? 1), total);
        const groupId = crypto.randomUUID();
        rows = buildInstallments(transaction.date, current, total).map((p) => ({
          user_id: user.id,
          household_id: householdId,
          ...transaction,
          date: p.date,
          installment_current: p.installment_current,
          installment_total: total,
          installment_group_id: groupId,
        }));
      } else {
        rows = [{
          user_id: user.id,
          household_id: householdId,
          ...transaction,
          installment_current: null,
          installment_total: null,
        }];
      }

      const { data, error } = await supabase.from("transactions").insert(rows).select(SELECT);
      if (error) throw error;

      setTransactions((prev) => [...(data || []).map(mapRow), ...prev].sort(byDateDesc));
      return { success: true };
    } catch (error) {
      showError("Erro ao adicionar transação", error);
      return { success: false, error };
    }
  };

  const deleteTransaction = async (id: string, scope: "single" | "group" = "single") => {
    try {
      const target = transactions.find((t) => t.id === id);
      const groupId = target?.installment_group_id;
      const query = supabase.from("transactions").delete();
      const { error } = scope === "group" && groupId
        ? await query.eq("installment_group_id", groupId)
        : await query.eq("id", id);
      if (error) throw error;

      setTransactions((prev) =>
        prev.filter((t) => (scope === "group" && groupId ? t.installment_group_id !== groupId : t.id !== id)),
      );
      return { success: true };
    } catch (error) {
      showError("Erro ao excluir transação", error);
      return { success: false, error };
    }
  };

  const reviewTransaction = async (id: string, status: "confirmed" | "disputed", note?: string) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update({ status, dispute_note: status === "disputed" ? note ?? null : null })
        .eq("id", id)
        .select(SELECT)
        .single();
      if (error) throw error;
      setTransactions((prev) => prev.map((t) => (t.id === id ? mapRow(data) : t)));
      window.dispatchEvent(new Event("transactions-reviewed"));
      return { success: true };
    } catch (error) {
      showError("Erro ao validar transação", error);
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
          installment_current: updates.installment_current || null,
          installment_total: updates.installment_total || null,
        })
        .eq("id", id)
        .select(SELECT)
        .single();
      if (error) throw error;

      setTransactions((prev) => prev.map((t) => (t.id === id ? mapRow(data) : t)));
      return { success: true };
    } catch (error) {
      showError("Erro ao atualizar transação", error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchTransactions();
    const reload = () => { void fetchTransactions(); };
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId]);

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    reviewTransaction,
    refetch: fetchTransactions,
  };
}

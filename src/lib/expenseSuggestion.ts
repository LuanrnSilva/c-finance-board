export interface ExpenseSuggestion {
  amount: number | null;
  category: string | null;
  credit_card_id: string | null;
}

export function validateExpenseSuggestion(value: unknown, categories: string[], cardIds: string[]): ExpenseSuggestion {
  if (!value || typeof value !== "object") throw new Error("A IA não retornou uma sugestão válida.");
  const data = value as Record<string, unknown>;
  return {
    amount: typeof data.amount === "number" && Number.isFinite(data.amount) && data.amount > 0 ? data.amount : null,
    category: typeof data.category === "string" && categories.includes(data.category) ? data.category : null,
    credit_card_id: typeof data.credit_card_id === "string" && cardIds.includes(data.credit_card_id) ? data.credit_card_id : null,
  };
}

export function parseTransactionAmount(value: string): number {
  return Number(value.trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
}
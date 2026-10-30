import { describe, expect, it } from "vitest";
import { parseTransactionAmount, validateExpenseSuggestion } from "./expenseSuggestion";

describe("expense suggestions", () => {
  it("accepts a suggested amount, existing category and corresponding card", () => {
    expect(validateExpenseSuggestion({ amount: 125.5, category: "food", credit_card_id: "nubank-id" }, ["food"], ["nubank-id"]))
      .toEqual({ amount: 125.5, category: "food", credit_card_id: "nubank-id" });
  });
  it("does not select invented categories or cards", () => {
    expect(validateExpenseSuggestion({ amount: null, category: "invented", credit_card_id: "other-household" }, ["food"], ["nubank-id"]))
      .toEqual({ amount: null, category: null, credit_card_id: null });
  });
  it("does not invent an amount when the text has none", () => {
    expect(validateExpenseSuggestion({ amount: null, category: "food", credit_card_id: null }, ["food"], []).amount).toBeNull();
  });
  it("accepts decimal comma values from mobile keyboards", () => {
    expect(parseTransactionAmount("125,50")).toBe(125.5);
    expect(parseTransactionAmount("1.250,50")).toBe(1250.5);
    expect(parseTransactionAmount("125.50")).toBe(125.5);
  });
});
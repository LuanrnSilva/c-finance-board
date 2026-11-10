import { describe, it, expect } from "vitest";
import { rowErrors, occurrenceCount, type ImportRow } from "./expenseImport";

const base: ImportRow = { description: "Apto", amount: 100, due_day: 10, responsible: null, source: null, type: "avulsa", installment_current: null, installment_total: null, start_month: null, end_month: null, warnings: [] };

describe("expense import", () => {
  it("18/84 generates the 67 remaining installments", () => {
    expect(occurrenceCount({ ...base, type: "parcelada", installment_current: 18, installment_total: 84 })).toBe(67);
  });
  it("recurring from 2026-01 until 2026-12 generates 12 months", () => {
    expect(occurrenceCount({ ...base, type: "recorrente", start_month: "2026-01", end_month: "2026-12" })).toBe(12);
  });
  it("blocks rows without description or with current > total", () => {
    expect(rowErrors({ ...base, description: " " })).toContain("Descrição obrigatória");
    expect(rowErrors({ ...base, type: "parcelada", installment_current: 5, installment_total: 3 }).length).toBe(1);
  });
});

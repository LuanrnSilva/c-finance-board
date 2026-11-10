export type ExpenseKind = "avulsa" | "parcelada" | "recorrente";
export interface ImportRow {
  description: string | null;
  amount: number | null;
  due_day: number | null;
  responsible: string | null;
  source: string | null;
  type: ExpenseKind;
  installment_current: number | null;
  installment_total: number | null;
  start_month: string | null;
  end_month: string | null;
  warnings: string[];
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Blocking problems that prevent saving a row. */
export function rowErrors(r: ImportRow): string[] {
  const e: string[] = [];
  if (!r.description?.trim()) e.push("Descrição obrigatória");
  if (r.amount == null || !(r.amount > 0)) e.push("Valor deve ser maior que zero");
  if (r.due_day != null && (r.due_day < 1 || r.due_day > 31 || !Number.isInteger(r.due_day))) e.push("Dia entre 1 e 31");
  if (r.start_month && !MONTH.test(r.start_month)) e.push("Início no formato AAAA-MM");
  if (r.end_month && !MONTH.test(r.end_month)) e.push("Fim no formato AAAA-MM");
  if (r.start_month && r.end_month && MONTH.test(r.start_month) && MONTH.test(r.end_month) && r.end_month < r.start_month) e.push("Fim antes do início");
  if (r.type === "parcelada") {
    const c = r.installment_current, t = r.installment_total;
    if (!c || !t || c < 1 || t < 1 || c > t) e.push("Parcelas inválidas (atual/total)");
  }
  return e;
}

export function toInsert(r: ImportRow) {
  const parcel = r.type === "parcelada";
  return {
    description: r.description!.trim(), amount: r.amount!, due_day: r.due_day,
    responsible: r.responsible?.trim() || null, source: r.source?.trim() || null, type: r.type,
    installment_current: parcel ? r.installment_current : null,
    installment_total: parcel ? r.installment_total : null,
    start_month: r.start_month || null, end_month: r.type === "recorrente" ? r.end_month || null : null,
  };
}

/** Number of monthly occurrences the database will generate. */
export function occurrenceCount(r: ImportRow): number {
  if (r.type === "parcelada") return (r.installment_total ?? 0) - (r.installment_current ?? 0) + 1;
  if (r.type === "recorrente") {
    if (!r.end_month) return 12;
    const now = new Date();
    const s = r.start_month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [sy, sm] = s.split("-").map(Number), [ey, em] = r.end_month.split("-").map(Number);
    return (ey - sy) * 12 + (em - sm) + 1;
  }
  return 1;
}

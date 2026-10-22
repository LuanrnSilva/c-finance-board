export type TransactionStatus = "pending" | "confirmed" | "disputed";

/** Pending and confirmed entries count toward totals; disputed ones are reported separately. */
export const countsTowardTotals = (t: { status?: TransactionStatus }) => t.status !== "disputed";

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  card_brand?: string;
  credit_card_id?: string;
  person_id?: string;
  person_name?: string;
  created_by?: string;
  status?: TransactionStatus;
  validated_by?: string | null;
  validated_at?: string | null;
  dispute_note?: string | null;
  installment_current?: number;
  installment_total?: number;
  installment_group_id?: string;
}

export interface NewTransaction {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  card_brand?: string;
  credit_card_id?: string;
  person_id?: string;
  date: string;
  installment_current?: number;
  installment_total?: number;
}

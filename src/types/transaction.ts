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

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  cardBrand?: string;
}

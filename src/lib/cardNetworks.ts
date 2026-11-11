export const cardNetworks = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "elo", label: "Elo" },
  { value: "amex", label: "American Express" },
  { value: "hipercard", label: "Hipercard" },
  { value: "outra", label: "Outra" },
];
export const networkLabel = (v: string) => cardNetworks.find((n) => n.value === v)?.label ?? v;

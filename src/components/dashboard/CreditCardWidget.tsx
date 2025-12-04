import { cn } from "@/lib/utils";

interface CreditCardWidgetProps {
  brand: "nubank" | "santander" | "itau" | "inter" | "c6" | "bb";
  name: string;
  lastDigits: string;
  limit: number;
  used: number;
}

const brandConfig = {
  nubank: { gradient: "card-nubank", logo: "Nu" },
  santander: { gradient: "card-santander", logo: "S" },
  itau: { gradient: "card-itau", logo: "Itaú" },
  inter: { gradient: "card-inter", logo: "Inter" },
  c6: { gradient: "card-c6", logo: "C6" },
  bb: { gradient: "card-bb", logo: "BB" },
};

export function CreditCardWidget({
  brand,
  name,
  lastDigits,
  limit,
  used,
}: CreditCardWidgetProps) {
  const config = brandConfig[brand];
  const available = limit - used;
  const usedPercentage = (used / limit) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div
      className={cn(
        "relative p-5 rounded-2xl text-white min-h-[180px] flex flex-col justify-between overflow-hidden",
        config.gradient
      )}
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-16 -translate-x-16" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <span className="font-bold text-lg">{config.logo}</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded-full bg-white/30" />
            <div className="w-6 h-6 rounded-full bg-white/20 -ml-3" />
          </div>
        </div>

        <p className="text-sm opacity-80 mb-1">•••• •••• •••• {lastDigits}</p>
        <p className="text-sm font-medium">{name}</p>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between text-xs mb-2">
          <span className="opacity-70">Usado</span>
          <span className="opacity-70">Limite</span>
        </div>
        <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500"
            style={{ width: `${usedPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span>{formatCurrency(used)}</span>
          <span>{formatCurrency(limit)}</span>
        </div>
      </div>
    </div>
  );
}

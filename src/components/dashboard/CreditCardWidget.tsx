import { cn } from "@/lib/utils";
import { EditCardLimitDialog } from "@/components/cards/EditCardLimitDialog";

interface CreditCardWidgetProps {
  id: string;
  brand: string;
  name: string;
  lastDigits: string;
  limit: number;
  used: number;
  onUpdateLimit?: (id: string, updates: { credit_limit: number }) => Promise<{ success: boolean }>;
}

const brandConfig: Record<string, { gradient: string; logo: string }> = {
  nubank: { gradient: "card-nubank", logo: "Nu" },
  santander: { gradient: "card-santander", logo: "S" },
  itau: { gradient: "card-itau", logo: "Itaú" },
  inter: { gradient: "card-inter", logo: "Inter" },
  c6: { gradient: "card-c6", logo: "C6" },
  bb: { gradient: "card-bb", logo: "BB" },
  porto: { gradient: "card-porto", logo: "Porto" },
  bradesco: { gradient: "card-bradesco", logo: "Brad" },
  mercadopago: { gradient: "card-mercadopago", logo: "MP" },
  pan: { gradient: "card-pan", logo: "Pan" },
};

export function CreditCardWidget({
  id,
  brand,
  name,
  lastDigits,
  limit,
  used,
  onUpdateLimit,
}: CreditCardWidgetProps) {
  const config = brandConfig[brand] || { gradient: "card-nubank", logo: brand.charAt(0).toUpperCase() };
  const available = limit - used;
  const usedPercentage = limit > 0 ? (used / limit) * 100 : 0;

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
      {onUpdateLimit && (
        <EditCardLimitDialog
          cardId={id}
          cardName={name}
          currentLimit={limit}
          onUpdate={onUpdateLimit}
        />
      )}
      
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
            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
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

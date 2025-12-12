import { cn } from "@/lib/utils";
import { FileText, Home, Car, Wallet } from "lucide-react";
import { EditContractDialog } from "./EditContractDialog";

interface ContractWidgetProps {
  id: string;
  name: string;
  type: string;
  totalValue: number;
  installmentValue: number;
  totalInstallments: number;
  paidInstallments: number;
  onUpdate?: (id: string, updates: { paid_installments: number }) => Promise<{ success: boolean }>;
}

const typeConfig: Record<string, { gradient: string; icon: typeof FileText; label: string }> = {
  financing: { gradient: "bg-gradient-to-br from-emerald-600 to-emerald-800", icon: Home, label: "Financiamento" },
  consortium: { gradient: "bg-gradient-to-br from-violet-600 to-violet-800", icon: Wallet, label: "Consórcio" },
  loan: { gradient: "bg-gradient-to-br from-amber-600 to-amber-800", icon: Car, label: "Empréstimo" },
};

export function ContractWidget({
  id,
  name,
  type,
  totalValue,
  installmentValue,
  totalInstallments,
  paidInstallments,
  onUpdate,
}: ContractWidgetProps) {
  const config = typeConfig[type] || { gradient: "bg-gradient-to-br from-slate-600 to-slate-800", icon: FileText, label: "Contrato" };
  const Icon = config.icon;
  const remainingInstallments = totalInstallments - paidInstallments;
  const progressPercentage = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;
  const paidValue = paidInstallments * installmentValue;
  const remainingValue = remainingInstallments * installmentValue;

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
      {onUpdate && (
        <EditContractDialog
          contractId={id}
          contractName={name}
          currentPaidInstallments={paidInstallments}
          totalInstallments={totalInstallments}
          onUpdate={onUpdate}
        />
      )}
      
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-16 -translate-x-16" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium opacity-80">{config.label}</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {paidInstallments}/{totalInstallments}x
          </span>
        </div>

        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-lg font-bold">{formatCurrency(installmentValue)}/mês</p>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between text-xs mb-2">
          <span className="opacity-70">Pago: {formatCurrency(paidValue)}</span>
          <span className="opacity-70">Restante: {formatCurrency(remainingValue)}</span>
        </div>
        <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span>{remainingInstallments} parcelas restantes</span>
        </div>
      </div>
    </div>
  );
}

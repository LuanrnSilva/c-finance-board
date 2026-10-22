import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/types/transaction";

const styles: Record<TransactionStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-warning/15 text-warning" },
  confirmed: { label: "Confirmado", className: "bg-success/15 text-success" },
  disputed: { label: "Contestado", className: "bg-destructive/15 text-destructive" },
};

export function StatusBadge({ status }: { status?: TransactionStatus }) {
  const s = styles[status ?? "confirmed"];
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", s.className)}>{s.label}</span>;
}

export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={cn("min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold flex items-center justify-center", className)}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

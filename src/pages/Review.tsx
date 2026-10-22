import { useState } from "react";
import { Check, Loader2, MessageSquareWarning } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/transactions/StatusBadge";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { parseLocalDate } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function Review() {
  const { transactions, loading, reviewTransaction } = useTransactions();
  const { user, members } = useAuth();
  const [disputing, setDisputing] = useState<Transaction | null>(null);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = transactions.filter(
    (t) => t.created_by !== user?.id && (t.status === "pending" || t.status === "disputed")
  );
  const nameOf = (id?: string) => members.find((m) => m.user_id === id)?.full_name || "Membro";

  const confirm = async (t: Transaction) => {
    setBusyId(t.id);
    await reviewTransaction(t.id, "confirmed");
    setBusyId(null);
  };

  const submitDispute = async () => {
    if (!disputing || !note.trim()) return;
    setBusyId(disputing.id);
    const res = await reviewTransaction(disputing.id, "disputed", note.trim());
    setBusyId(null);
    if (res.success) {
      setDisputing(null);
      setNote("");
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Validar gastos</h1>
          <p className="text-muted-foreground">Confirme ou conteste os gastos lançados pelos outros membros</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aguardando você</CardTitle>
            <CardDescription>Gastos pendentes e contestados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : items.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nada para validar por aqui.</p>
            ) : (
              items.map((t) => (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{t.description}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {parseLocalDate(t.date).toLocaleDateString("pt-BR")} • lançado por {nameOf(t.created_by)}
                    </p>
                    {t.status === "disputed" && t.dispute_note && (
                      <p className="text-sm text-destructive mt-1">Motivo: {t.dispute_note}</p>
                    )}
                  </div>
                  <p className="font-semibold text-destructive whitespace-nowrap">-{brl(t.amount)}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => confirm(t)} disabled={busyId === t.id}>
                      <Check className="w-4 h-4 mr-1" /> Confirmar
                    </Button>
                    {t.status !== "disputed" && (
                      <Button size="sm" variant="outline" onClick={() => { setDisputing(t); setNote(""); }} disabled={busyId === t.id}>
                        <MessageSquareWarning className="w-4 h-4 mr-1" /> Contestar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!disputing} onOpenChange={(o) => !o && setDisputing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contestar gasto</DialogTitle>
            <DialogDescription>Explique o motivo para "{disputing?.description}".</DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: valor diferente do combinado" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputing(null)}>Cancelar</Button>
            <Button onClick={submitDispute} disabled={!note.trim() || busyId === disputing?.id}>Contestar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

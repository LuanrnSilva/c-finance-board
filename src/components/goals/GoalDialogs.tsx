import { useEffect, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { formatLocalDate } from "@/lib/utils";
import type { Goal, GoalInput } from "@/hooks/useGoals";

export function GoalFormDialog({
  trigger, goal, onSubmit,
}: { trigger: ReactNode; goal?: Goal; onSubmit: (input: GoalInput) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(goal?.name ?? "");
      setTarget(goal ? String(goal.target_amount) : "");
      setDeadline(goal?.deadline ?? "");
    }
  }, [open, goal]);

  const value = parseFloat(target.replace(",", "."));
  const valid = name.trim() && value > 0;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), target_amount: value, deadline: deadline || null });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nova meta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nome</Label>
            <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Viagem de férias" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-target">Valor alvo (R$)</Label>
            <Input id="goal-target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="5000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-deadline">Prazo (opcional)</Label>
            <Input id="goal-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!valid || busy}>{busy ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ContributionDialog({
  goal, onSubmit,
}: { goal: Goal; onSubmit: (input: { goal_id: string; amount: number; date: string; note?: string }) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatLocalDate(new Date()));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const value = parseFloat(amount.replace(",", "."));
  const valid = !Number.isNaN(value) && value !== 0 && !!date;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onSubmit({ goal_id: goal.id, amount: value, date, note: note.trim() || undefined });
      setOpen(false);
      setAmount("");
      setNote("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Adicionar aporte</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aporte em "{goal.name}"</DialogTitle>
          <DialogDescription>Use um valor negativo para registrar uma retirada.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-amount">Valor (R$)</Label>
            <Input id="c-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="200 ou -50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-date">Data</Label>
            <Input id="c-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-note">Nota (opcional)</Label>
            <Textarea id="c-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!valid || busy}>{busy ? "Salvando..." : "Registrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

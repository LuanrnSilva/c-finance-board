import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, Plus, Pencil, Pause, Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useRecurringSchedules, type RecurringSchedule, type ScheduleInput } from "@/hooks/useRecurringSchedules";
import type { Category } from "@/hooks/useCategories";
import type { CreditCard } from "@/hooks/useCreditCards";
import type { Person } from "@/hooks/usePeople";
import { upcomingDates, scheduleInputError } from "@/lib/recurringSchedule";
import { parseTransactionAmount } from "@/lib/expenseSuggestion";
import { parseLocalDate } from "@/lib/utils";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const todayDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dateLabel = (date: string) => format(parseLocalDate(date), "dd MMM yyyy", { locale: ptBR });

export function RecurringSchedulesPanel({ categories, cards, people }: { categories: Category[]; cards: CreditCard[]; people: Person[] }) {
  const { schedules, loading, error, refetch, manage } = useRecurringSchedules();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringSchedule | null>(null);
  const [ending, setEnding] = useState<RecurringSchedule | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [amount, setAmount] = useState("");
  const [form, setForm] = useState<ScheduleInput>({ description: "", amount: 0, category: "other", credit_card_id: "", person_id: "", start_date: todayDate(), end_date: "" });
  const active = schedules.filter((s) => s.state === "active");
  const upcoming = active.flatMap((s) => upcomingDates(s).map((date) => ({ schedule: s, date }))).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  const showForm = (schedule?: RecurringSchedule) => {
    setEditing(schedule ?? null);
    setFormError("");
    setAmount(schedule ? String(schedule.amount).replace(".", ",") : "");
    setForm(schedule ? { description: schedule.description, amount: schedule.amount, category: schedule.category, credit_card_id: schedule.credit_card_id ?? "", person_id: schedule.person_id ?? "", start_date: schedule.next_date < todayDate() ? todayDate() : schedule.next_date, end_date: schedule.end_date ?? "" } : { description: "", amount: 0, category: categories[0]?.value ?? "other", credit_card_id: "", person_id: "", start_date: todayDate(), end_date: "" });
    setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = parseTransactionAmount(amount);
    const message = scheduleInputError(value, form.start_date, form.end_date, todayDate());
    if (message) { setFormError(message); return; }
    setBusy(true);
    const ok = await manage(editing ? "edit" : "create", editing?.id, { ...form, description: form.description.trim(), amount: value });
    setBusy(false);
    if (ok) setOpen(false);
  };
  const changeState = async (action: "pause" | "resume" | "end", id: string) => {
    setBusy(true);
    const ok = await manage(action, id);
    setBusy(false);
    if (ok) setEnding(null);
  };

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Despesas mensais</h2></div>
      <Button onClick={() => showForm()}><Plus className="mr-2 h-4 w-4" />Programar despesa</Button>
    </div>
    {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : error ? <div role="alert" className="text-destructive">Não foi possível carregar os agendamentos. <Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></div> : <>
      <div className="flex flex-wrap gap-x-8 gap-y-2 border-b pb-4">
        <div><p className="text-sm text-muted-foreground">Total mensal programado</p><p className="text-2xl font-bold">{money(active.reduce((sum, s) => sum + Number(s.amount), 0))}</p></div>
        <div><p className="text-sm text-muted-foreground">Agendamentos ativos</p><p className="text-2xl font-bold">{active.length}</p></div>
      </div>
      {upcoming.length > 0 && <div><h3 className="font-semibold mb-2">Próximas cobranças</h3><div className="divide-y">{upcoming.map(({ schedule, date }) => <div key={`${schedule.id}-${date}`} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="break-words font-medium">{schedule.description}</p><p className="text-sm text-muted-foreground">{dateLabel(date)}{schedule.credit_card_id ? ` · ${cards.find((c) => c.id === schedule.credit_card_id)?.name ?? "Cartão"}` : ""}</p></div><span className="shrink-0 font-semibold">{money(Number(schedule.amount))}</span></div>)}</div></div>}
      <div className="space-y-3">{schedules.length === 0 ? <p className="py-8 text-center text-muted-foreground">Nenhuma despesa mensal programada.</p> : schedules.map((s) => <article key={s.id} className="rounded-lg border p-4 space-y-3">
        <div className="flex justify-between items-start gap-3"><div className="min-w-0"><h3 className="font-semibold break-words">{s.description}</h3><p className="text-sm text-muted-foreground">{categories.find((c) => c.value === s.category)?.name ?? s.category}{s.person_id ? ` · ${people.find((p) => p.id === s.person_id)?.name ?? ""}` : ""}</p></div><Badge variant={s.state === "active" ? "default" : "secondary"}>{s.state === "active" ? "Ativa" : s.state === "paused" ? "Pausada" : "Encerrada"}</Badge></div>
        <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{money(Number(s.amount))} / mês</span><span className="text-sm text-muted-foreground">Dia {s.billing_day}{s.state === "active" ? ` · Próxima: ${dateLabel(s.next_date)}` : ""}</span></div>
        {s.end_date && <p className="text-sm text-muted-foreground">Até {dateLabel(s.end_date)}</p>}
        {s.state !== "ended" && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => showForm(s)}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void changeState(s.state === "active" ? "pause" : "resume", s.id)}>{s.state === "active" ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{s.state === "active" ? "Pausar" : "Retomar"}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => setEnding(s)}><Square className="mr-2 h-4 w-4" />Encerrar</Button></div>}
      </article>)}</div>
    </>}
    <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}><DialogContent className="mobile-dialog"><DialogHeader><DialogTitle>{editing ? "Editar despesa mensal" : "Programar despesa mensal"}</DialogTitle><DialogDescription>{editing ? "As alterações valem para as próximas cobranças; lançamentos anteriores são mantidos." : "A despesa será lançada mensalmente na data da cobrança, sem realizar pagamentos bancários."}</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="schedule-description">Descrição</Label><Input id="schedule-description" required maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Internet" /></div>
        <div className="space-y-2"><Label htmlFor="schedule-amount">Valor mensal (R$)</Label><Input id="schedule-amount" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></div>
        <div className="space-y-2"><Label>Categoria</Label><Select value={form.category} onValueChange={(category) => setForm({ ...form, category })}><SelectTrigger aria-label="Categoria da despesa mensal"><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.value}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="schedule-start">{editing ? "Próxima cobrança" : "Primeira cobrança"}</Label><Input id="schedule-start" required type="date" inputMode="numeric" min={todayDate()} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="schedule-end">Data final (opcional)</Label><Input id="schedule-end" type="date" inputMode="numeric" min={form.start_date} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div></div>
        <div className="space-y-2"><Label>Cartão</Label><Select value={form.credit_card_id || "none"} onValueChange={(value) => setForm({ ...form, credit_card_id: value === "none" ? "" : value })}><SelectTrigger aria-label="Cartão da despesa mensal"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem cartão</SelectItem>{cards.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.last_digits}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Pessoa</Label><Select value={form.person_id || "none"} onValueChange={(value) => setForm({ ...form, person_id: value === "none" ? "" : value })}><SelectTrigger aria-label="Pessoa da despesa mensal"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem pessoa</SelectItem>{people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Salvar alterações" : "Salvar agendamento"}</Button>
      </form>
    </DialogContent></Dialog>
    <AlertDialog open={!!ending} onOpenChange={(value) => { if (!value && !busy) setEnding(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Encerrar {ending?.description}?</AlertDialogTitle><AlertDialogDescription>As próximas cobranças serão canceladas. Os lançamentos já registrados permanecem nas transações.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Voltar</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); if (ending) void changeState("end", ending.id); }}>Encerrar agendamento</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
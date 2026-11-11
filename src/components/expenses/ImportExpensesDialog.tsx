import { Fragment, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rowErrors, toInsert, type ImportRow, type ExpenseKind } from "@/lib/expenseImport";

const num = (v: string) => { const n = Number(v.replace(/\./g, "").replace(",", ".")); return v.trim() === "" || isNaN(n) ? null : n; };
const int = (v: string) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };

export function ImportExpensesDialog({ onImported }: { onImported?: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fail = (m: string) => toast({ title: "Importação", description: m, variant: "destructive" });

  const parse = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Entre na sua conta.");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-expenses`, {
        method: "POST", body: JSON.stringify({ text }),
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Falha ao interpretar.");
      const lines = (await res.text()).split("\n").filter(Boolean).map((l) => JSON.parse(l));
      const err = lines.find((e) => e.type === "error" || e.type === "denied");
      if (err) throw new Error(err.message);
      const result = lines.find((e) => e.type === "result");
      if (!result) throw new Error("A IA não retornou itens.");
      setRows(result.data.map(({ group: _g, ...r }: ImportRow & { group?: string }) => r));
    } catch (e) { fail(e instanceof Error ? e.message : "Erro inesperado."); }
    finally { setLoading(false); }
  };

  const set = (i: number, patch: Partial<ImportRow>) => setRows((rs) => rs!.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const confirm = async () => {
    if (!rows?.length) return;
    if (rows.some((r) => rowErrors(r).length)) return fail("Corrija as linhas em vermelho antes de confirmar.");
    setLoading(true);
    const { error } = await supabase.from("expenses").insert(rows.map(toInsert));
    setLoading(false);
    if (error) return fail(error.message);
    toast({ title: `${rows.length} gastos importados` });
    setOpen(false); setRows(null); setText(""); onImported?.();
  };

  const cell = "h-9 min-w-[5rem] text-sm";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Upload className="w-4 h-4 mr-2" />Importar</Button></DialogTrigger>
      <DialogContent className="mobile-dialog max-w-[95vw] lg:max-w-6xl overflow-y-auto">
        <DialogHeader><DialogTitle>Importar lista de gastos</DialogTitle></DialogHeader>
        {!rows ? (
          <>
            <Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Dia 10\nNubank\nApartamento 1.250,00 18/84\nNetflix 55,90 até 12/2026\nTotal 1.305,90"} />
            <DialogFooter><Button onClick={parse} disabled={loading || !text.trim()}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Interpretar</Button></DialogFooter>
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground">
                  {["Descrição", "Valor", "Dia", "Responsável", "Origem", "Tipo", "Parc.", "Total", "Início", "Fim", ""].map((h) => <th key={h} className="p-1 font-medium">{h}</th>)}
                </tr></thead>
                <tbody>{rows.map((r, i) => {
                  const errs = rowErrors(r), notes = [...errs, ...r.warnings];
                  return (<Fragment key={i}>
                    <tr key={i} className={errs.length ? "bg-destructive/10" : r.warnings.length ? "bg-warning/10" : ""}>
                      <td className="p-1"><Input className={`${cell} min-w-[10rem]`} value={r.description ?? ""} onChange={(e) => set(i, { description: e.target.value })} /></td>
                      <td className="p-1"><Input className={cell} inputMode="decimal" defaultValue={r.amount?.toString().replace(".", ",") ?? ""} onChange={(e) => set(i, { amount: num(e.target.value) })} /></td>
                      <td className="p-1"><Input className={`${cell} min-w-[3.5rem]`} inputMode="numeric" value={r.due_day ?? ""} onChange={(e) => set(i, { due_day: int(e.target.value) })} /></td>
                      <td className="p-1"><Input className={cell} value={r.responsible ?? ""} onChange={(e) => set(i, { responsible: e.target.value })} /></td>
                      <td className="p-1"><Input className={cell} value={r.source ?? ""} onChange={(e) => set(i, { source: e.target.value })} /></td>
                      <td className="p-1"><select className={`${cell} rounded-md border border-input bg-background px-2`} value={r.type} onChange={(e) => set(i, { type: e.target.value as ExpenseKind })}>
                        <option value="avulsa">Avulsa</option><option value="parcelada">Parcelada</option><option value="recorrente">Recorrente</option></select></td>
                      <td className="p-1"><Input className={`${cell} min-w-[3.5rem]`} inputMode="numeric" value={r.installment_current ?? ""} onChange={(e) => set(i, { installment_current: int(e.target.value) })} /></td>
                      <td className="p-1"><Input className={`${cell} min-w-[3.5rem]`} inputMode="numeric" value={r.installment_total ?? ""} onChange={(e) => set(i, { installment_total: int(e.target.value) })} /></td>
                      <td className="p-1"><Input className={`${cell} min-w-[8rem]`} type="month" value={r.start_month ?? ""} onChange={(e) => set(i, { start_month: e.target.value || null })} /></td>
                      <td className="p-1"><Input className={`${cell} min-w-[8rem]`} type="month" value={r.end_month ?? ""} onChange={(e) => set(i, { end_month: e.target.value || null })} /></td>
                      <td className="p-1"><Button variant="ghost" size="sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remover</Button></td>
                    </tr>
                    {notes.length > 0 && <tr key={`n${i}`}><td colSpan={11} className={`px-2 pb-2 text-xs ${errs.length ? "text-destructive" : "text-muted-foreground"}`}>{notes.join(" · ")}</td></tr>}
                  </Fragment>);
                })}</tbody>
              </table>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRows(null)}>Voltar ao texto</Button>
              <Button onClick={confirm} disabled={loading || !rows.length}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Confirmar ({rows.length})</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

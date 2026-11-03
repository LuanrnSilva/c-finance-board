import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateExpenseSuggestion, type ExpenseSuggestion } from "@/lib/expenseSuggestion";
import type { Category } from "@/hooks/useCategories";
import type { CreditCard } from "@/hooks/useCreditCards";

interface Props {
  categories: Category[];
  cards: CreditCard[];
  onSuggestion: (suggestion: ExpenseSuggestion, text: string) => void;
}

export function ExpenseSuggestionInput({ categories, cards, onSuggestion }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const controller = useRef<AbortController | null>(null);
  const { toast } = useToast();
  useEffect(() => () => controller.current?.abort(), []);

  const suggest = async () => {
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setNotice("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Entre na sua conta para usar a IA.");
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-expense`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ text }), signal: abort.signal,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? error.error ?? "Não foi possível obter a sugestão.");
      }
      if (!response.body) throw new Error("A IA não retornou uma sugestão.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let received = false;
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === "error" || event.type === "denied") throw new Error(event.message);
        if (event.type === "suggestion") {
          const suggestion = validateExpenseSuggestion(event.data, categories.map(c => c.value), cards.map(c => c.id));
          if (abort.signal.aborted) return;
          onSuggestion(suggestion, text.trim());
          received = true;
          const missing = [suggestion.amount === null && "valor", suggestion.category === null && "categoria", suggestion.credit_card_id === null && "cartão"].filter(Boolean);
          setNotice(missing.length ? `Confira a sugestão. Não identificado: ${missing.join(", ")}.` : "Sugestão preenchida. Confira antes de adicionar.");
        }
      };
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(consume);
        }
        consume(buffer + decoder.decode());
      } finally { reader.releaseLock(); }
      if (!received && !abort.signal.aborted) throw new Error("A IA não retornou uma sugestão. Preencha os campos manualmente.");
    } catch (error) {
      if (!abort.signal.aborted) toast({ title: "Não foi possível sugerir a despesa", description: error instanceof Error ? error.message : "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      if (controller.current === abort) { controller.current = null; setLoading(false); }
    }
  };

  return (
    <div className="space-y-2 border-b border-border pb-4">
      <Label htmlFor="expense-free-text">Despesa em texto livre</Label>
      <Textarea id="expense-free-text" value={text} onChange={e => { setText(e.target.value); setNotice(""); }} maxLength={2000} disabled={loading}
        placeholder="Ex.: Gastei R$ 125,50 no supermercado com o Nubank" className="min-h-20 resize-y" />
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={suggest} disabled={loading || !text.trim()} className="min-h-12 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Analisando…" : "Sugerir com IA"}
        </Button>
        {loading && <Button type="button" variant="ghost" size="icon" title="Parar análise" aria-label="Parar análise" onClick={() => { controller.current?.abort(); setLoading(false); }} className="min-h-12 min-w-12"><Square className="h-4 w-4" /></Button>}
      </div>
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    </div>
  );
}
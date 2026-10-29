import { useEffect, useState } from "react";
import { Users, Copy, Trash2, UserMinus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Invite {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
}

export function SharedAccountCard() {
  const { user, householdId, members, isOwner, refreshHousehold } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const showError = (title: string, e: { message: string }) =>
    toast({ title, description: e.message, variant: "destructive" });

  const linkFor = (token: string) => `${window.location.origin}/join/${token}`;

  const loadInvites = async () => {
    if (!householdId || !isOwner) return setInvites([]);
    const { data, error } = await supabase
      .from("household_invites")
      .select("id, email, token, expires_at, accepted_at")
      .eq("household_id", householdId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });
    if (error) return showError("Erro ao carregar convites", error);
    setInvites(data ?? []);
  };

  useEffect(() => {
    void loadInvites();
    const refresh = () => { void loadInvites(); };
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 15000);
    return () => { clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [householdId, isOwner]);

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(token));
      toast({ title: "Link copiado", description: "Envie para a pessoa convidada." });
    } catch {
      toast({ title: "Não foi possível copiar", description: linkFor(token), variant: "destructive" });
    }
  };

  const invite = async () => {
    if (!householdId || !user || !email.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("household_invites")
      .insert({ household_id: householdId, email: email.trim().toLowerCase(), invited_by: user.id })
      .select("id, email, token, expires_at, accepted_at")
      .single();
    setBusy(false);
    if (error) return showError("Erro ao criar convite", error);
    setInvites((p) => [data, ...p]);
    setEmail("");
    await copy(data.token);
  };

  const cancelInvite = async (id: string) => {
    const { error } = await supabase.from("household_invites").delete().eq("id", id);
    if (error) return showError("Erro ao cancelar convite", error);
    setInvites((p) => p.filter((i) => i.id !== id));
  };

  const removeMember = async (userId: string) => {
    if (!householdId) return;
    const { error } = await supabase
      .from("household_members")
      .delete()
      .eq("household_id", householdId)
      .eq("user_id", userId);
    if (error) return showError("Erro ao remover membro", error);
    await refreshHousehold();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Conta compartilhada</CardTitle>
          <Button variant="ghost" size="icon" className="ml-auto" aria-label="Atualizar grupo" onClick={async () => { await refreshHousehold(); await loadInvites(); }}><RefreshCw className="w-4 h-4" /></Button>
        </div>
        <CardDescription>Quem tem acesso aos mesmos lançamentos, cartões e contratos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {(m.full_name || "?").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {m.full_name || "Sem nome"} {m.user_id === user?.id && <span className="text-muted-foreground">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.role === "owner" ? "Dono" : "Membro"}</p>
                </div>
              </div>
              {isOwner && m.user_id !== user?.id && (
                <Button variant="ghost" size="icon" onClick={() => removeMember(m.user_id)} aria-label="Remover membro">
                  <UserMinus className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {isOwner && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-mail da pessoa convidada</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input id="invite-email" type="email" placeholder="pessoa@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button onClick={invite} disabled={busy || !email.trim()}>Gerar link</Button>
              </div>
              <p className="text-xs text-muted-foreground">Envio automático por e-mail não configurado. Compartilhe o link; ele vale por 7 dias para esse e-mail.</p>
            </div>
            {invites.length > 0 && (
              <div className="space-y-2">
                {invites.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0"><p className="truncate">{i.email}</p><p className="text-xs text-muted-foreground">{new Date(i.expires_at) <= new Date() ? "Expirado" : "Aguardando aceite"}</p></div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copy(i.token)} aria-label="Copiar link"><Copy className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => cancelInvite(i.id)} aria-label="Cancelar convite"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileSettings() {
  const { user, refreshHousehold } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    const fallback = user.user_metadata?.full_name ?? "";
    setName(fallback); setSavedName(fallback);
    let active = true;
    void supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error) toast({ title: "Erro ao carregar perfil", description: error.message, variant: "destructive" });
      else { const value = data?.full_name ?? fallback; setName(value); setSavedName(value); }
    });
    return () => { active = false; };
  }, [user?.id, user?.email]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const full_name = name.trim();
      if (full_name !== savedName) {
        const { error } = await supabase.from("profiles").upsert({ user_id: user.id, full_name }, { onConflict: "user_id" });
        if (error) throw error;
        const { error: authError } = await supabase.auth.updateUser({ data: { full_name } });
        if (authError) throw authError;
        setSavedName(full_name);
        await refreshHousehold();
      }
      const nextEmail = email.trim().toLowerCase();
      if (nextEmail !== user.email?.toLowerCase()) {
        const { data, error } = await supabase.auth.updateUser({ email: nextEmail }, { emailRedirectTo: `${window.location.origin}/settings` });
        if (error) throw error;
        if (data.user.email?.toLowerCase() !== nextEmail) setPendingEmail(nextEmail);
        toast({ title: "Alteração de e-mail solicitada", description: "Confira os e-mails de confirmação antes de usar o novo endereço." });
      } else toast({ title: "Perfil salvo" });
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };
  return <Card><CardHeader><div className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /><CardTitle className="text-lg">Perfil</CardTitle></div></CardHeader><CardContent className="space-y-4">
    <div className="flex items-center gap-4"><div className="w-16 h-16 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{savedName.trim().slice(0, 1).toUpperCase() || <User />}</div><div className="min-w-0"><h3 className="font-medium break-words">{savedName || "Sem nome"}</h3><p className="text-sm text-muted-foreground break-all">{user?.email}</p></div></div>
    <form onSubmit={save} className="space-y-4"><div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="profile-name">Nome</Label><Input id="profile-name" value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></div><div className="space-y-2"><Label htmlFor="profile-email">E-mail</Label><Input id="profile-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div></div>
      {pendingEmail && <p className="text-sm text-muted-foreground break-all">Aguardando confirmação de {pendingEmail}.</p>}
      <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar alterações"}</Button>
    </form>
  </CardContent></Card>;
}
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SecuritySettings() {
  const { toast } = useToast();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [factor, setFactor] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const fail = (error: { message: string }) => toast({ title: "Não foi possível concluir", description: error.message, variant: "destructive" });
  const load = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) { fail(error); return; }
    setFactor(data.totp.find((f) => f.status === "verified")?.id ?? null);
  };
  useEffect(() => { void load(); }, []);
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { fail({ message: "As senhas não coincidem." }); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password, current_password: currentPassword });
    setBusy(false);
    if (error) { fail(error); return; }
    setPasswordOpen(false); setPassword(""); setConfirm(""); setCurrentPassword("");
    toast({ title: "Senha alterada" });
  };
  const beginEnrollment = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `FinanceFlow ${Date.now()}` });
    setBusy(false);
    if (error) { fail(error); return false; }
    setEnrollment({ id: data.id, qr: data.totp.qr_code }); setCode("");
    return true;
  };
  const verify = async () => {
    const id = enrollment?.id ?? factor;
    if (!id) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code });
    if (error) { setBusy(false); fail(error); return; }
    if (!enrollment) {
      const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (removeError) { setBusy(false); fail(removeError); return; }
    }
    setBusy(false); setEnrollment(null); setCode(""); setMfaOpen(false); await load();
    toast({ title: enrollment ? "Verificação em duas etapas ativada" : "Verificação em duas etapas desativada" });
  };
  const [mfaOpen, setMfaOpen] = useState(false);
  return <Card>
    <CardHeader><div className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /><CardTitle className="text-lg">Segurança</CardTitle></div></CardHeader>
    <CardContent className="space-y-4">
      <Button variant="outline" onClick={() => setPasswordOpen(true)}>Alterar senha</Button>
      <div className="flex flex-wrap justify-between items-center gap-3"><div><p className="font-medium">Verificação em duas etapas</p><p className="text-sm text-muted-foreground">{factor ? "Ativada" : "Desativada"}</p></div>
        <Button variant="outline" disabled={busy} onClick={async () => { if (!factor && !await beginEnrollment()) return; setMfaOpen(true); }}>{factor ? "Desativar" : "Ativar"}</Button>
      </div>
    </CardContent>
    <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}><DialogContent><DialogHeader><DialogTitle>Alterar senha</DialogTitle></DialogHeader><form onSubmit={changePassword} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="current-password">Senha atual</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
      <div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required /></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={6} required /></div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Salvando..." : "Salvar senha"}</Button>
    </form></DialogContent></Dialog>
    <Dialog open={mfaOpen} onOpenChange={async (open) => { if (busy) return; setMfaOpen(open); if (!open && enrollment) { const { error } = await supabase.auth.mfa.unenroll({ factorId: enrollment.id }); if (error) fail(error); else setEnrollment(null); } }}><DialogContent><DialogHeader><DialogTitle>{enrollment ? "Ativar verificação em duas etapas" : "Desativar verificação em duas etapas"}</DialogTitle></DialogHeader>
      {enrollment && <img src={enrollment.qr} alt="Código QR para aplicativo autenticador" className="w-48 h-48 mx-auto" />}
      <Label htmlFor="mfa-code">Código do aplicativo autenticador</Label><Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} />
      <Button disabled={busy || code.length !== 6} onClick={verify}>{busy ? "Verificando..." : "Confirmar"}</Button>
    </DialogContent></Dialog>
  </Card>;
}
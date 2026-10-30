import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function MfaChallenge({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [factor, setFactor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;
      if (error) { setError(error.message); setChecking(false); return; }
      if (data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (!active) return;
        if (factorsError) setError(factorsError.message);
        else setFactor(factors.totp.find(f => f.status === "verified")?.id ?? null);
      }
      setChecking(false);
    };
    void check();
    return () => { active = false; };
  }, [user?.id]);
  if (checking) return <div className="min-h-[100dvh] flex items-center justify-center text-muted-foreground">Verificando acesso…</div>;
  if (!factor && !error) return <>{children}</>;
  return <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4"><form className="w-full max-w-sm space-y-4" onSubmit={async e => {
    e.preventDefault(); if (!factor) return; setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor, code });
    setBusy(false);
    if (error) toast({ title: "Código inválido", description: error.message, variant: "destructive" });
    else setFactor(null);
  }}><h1 className="text-2xl font-bold">Verificação em duas etapas</h1>{error ? <p role="alert" className="text-destructive">{error}</p> : <><Label htmlFor="login-mfa-code">Código do aplicativo autenticador</Label><Input id="login-mfa-code" inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={6} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} /><Button type="submit" className="w-full" disabled={busy || code.length !== 6}>Confirmar</Button></>}<Button type="button" variant="outline" className="w-full" onClick={() => { void signOut(); }}>Sair</Button></form></div>;
}
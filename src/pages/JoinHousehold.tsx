import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function JoinHousehold() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { refreshHousehold } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);

  const accept = async (migrate: boolean) => {
    if (!token) return;
    setBusy(true);
    const { error } = await supabase.rpc("accept_household_invite", { _token: token, _migrate_data: migrate });
    setBusy(false);
    if (error) {
      if (error.message.includes("HAS_DATA")) {
        setNeedsMigration(true);
        return;
      }
      toast({ title: "Não foi possível aceitar o convite", description: error.message, variant: "destructive" });
      return;
    }
    await refreshHousehold();
    toast({ title: "Pronto!", description: "Agora vocês compartilham a mesma conta." });
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle>Convite para conta compartilhada</CardTitle>
          </div>
          <CardDescription>
            {needsMigration
              ? "Você já tem lançamentos na sua conta. Deseja levá-los para a conta compartilhada? Eles ficarão visíveis para todos os membros."
              : "Ao aceitar, você e quem te convidou terão acesso aos mesmos dados."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          {needsMigration ? (
            <>
              <Button onClick={() => accept(true)} disabled={busy}>Levar meus dados e entrar</Button>
              <Button variant="outline" onClick={() => navigate("/")} disabled={busy}>Cancelar</Button>
            </>
          ) : (
            <>
              <Button onClick={() => accept(false)} disabled={busy}>{busy ? "Entrando..." : "Aceitar convite"}</Button>
              <Button variant="outline" onClick={() => navigate("/")} disabled={busy}>Agora não</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function useUserSettings(defaults: Record<string, boolean>) {
  const [settings, setSettings] = useState<Record<string, boolean>>(defaults);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (!user) { setSettings(defaults); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase.from("user_settings").select("key, value").eq("user_id", user.id);
      if (error) {
        toast({ title: "Erro ao carregar configurações", description: error.message, variant: "destructive" });
      } else {
        const loaded: Record<string, boolean> = {};
        (data || []).forEach((r) => { loaded[r.key] = r.value === "true"; });
        setSettings((prev) => ({ ...prev, ...loaded }));
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setSetting = async (key: string, value: boolean) => {
    const previous = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSettings((prev) => ({ ...prev, [key]: previous }));
      toast({ title: "Erro ao salvar configuração", description: "Usuário não autenticado", variant: "destructive" });
      return false;
    }
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, key, value: String(value) }, { onConflict: "user_id,key" });
    if (error) {
      setSettings((prev) => ({ ...prev, [key]: previous }));
      toast({ title: "Erro ao salvar configuração", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  return { settings, loading, setSetting };
}

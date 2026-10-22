import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useUserSettings(defaults: Record<string, boolean>) {
  const [settings, setSettings] = useState<Record<string, boolean>>(defaults);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("user_settings").select("key, value");
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
  }, []);

  const setSetting = async (key: string, value: boolean) => {
    const previous = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSettings((prev) => ({ ...prev, [key]: previous }));
      toast({ title: "Erro ao salvar configuração", description: "Usuário não autenticado", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, key, value: String(value) }, { onConflict: "user_id,key" });
    if (error) {
      setSettings((prev) => ({ ...prev, [key]: previous }));
      toast({ title: "Erro ao salvar configuração", description: error.message, variant: "destructive" });
    }
  };

  return { settings, loading, setSetting };
}

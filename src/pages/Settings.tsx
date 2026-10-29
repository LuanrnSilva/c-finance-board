import { useEffect } from "react";
import { useTheme } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Palette } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { SharedAccountCard } from "@/components/settings/SharedAccountCard";
import { BudgetsCard } from "@/components/settings/BudgetsCard";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";

export default function Settings() {
  const { settings, loading, setSetting } = useUserSettings({
    notify_due_alerts: true,
    notify_weekly_summary: true,
    notify_limit_alerts: true,
  });
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    if (!loading && typeof settings.dark_mode === "boolean") setTheme(settings.dark_mode ? "dark" : "light");
  }, [loading, settings.dark_mode, setTheme]);
  return <AppLayout>
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold">Configurações</h1><p className="text-muted-foreground">Preferências da sua conta</p></div>
      <ProfileSettings />
      <SharedAccountCard />
      <BudgetsCard />
      <Card><CardHeader><div className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /><CardTitle className="text-lg">Preferências de avisos</CardTitle></div></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Preferências salvas na sua conta. O envio automático de avisos ainda não está ativado.</p>
          {[
            ["notify_due_alerts", "Alertas de vencimento"],
            ["notify_weekly_summary", "Resumo semanal"],
            ["notify_limit_alerts", "Alertas de limite"],
          ].map(([key, label]) => <div key={key} className="flex items-center justify-between gap-4"><Label htmlFor={key}>{label}</Label><Switch id={key} checked={settings[key] ?? false} disabled={loading} onCheckedChange={v => { void setSetting(key, v); }} /></div>)}
        </CardContent>
      </Card>
      <Card><CardHeader><div className="flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /><CardTitle className="text-lg">Aparência</CardTitle></div></CardHeader><CardContent><div className="flex items-center justify-between gap-4"><Label htmlFor="dark-mode">Modo escuro</Label><Switch id="dark-mode" checked={resolvedTheme === "dark"} disabled={loading} onCheckedChange={async v => { const previous = resolvedTheme; setTheme(v ? "dark" : "light"); if (!await setSetting("dark_mode", v)) setTheme(previous ?? "system"); }} /></div></CardContent></Card>
      <SecuritySettings />
    </div>
  </AppLayout>;
}

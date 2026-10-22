import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette, CreditCard } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { SharedAccountCard } from "@/components/settings/SharedAccountCard";
import { BudgetsCard } from "@/components/settings/BudgetsCard";

export default function Settings() {
  const { settings, loading, setSetting } = useUserSettings({
    notify_due_alerts: true,
    notify_weekly_summary: true,
    notify_limit_alerts: true,
  });

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências do aplicativo</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Perfil</CardTitle>
            </div>
            <CardDescription>Informações da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">JS</span>
              </div>
              <div>
                <h3 className="font-medium">João Silva</h3>
                <p className="text-sm text-muted-foreground">joao.silva@email.com</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" defaultValue="João Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="joao.silva@email.com" />
              </div>
            </div>
            <Button>Salvar Alterações</Button>
          </CardContent>
        </Card>

        <SharedAccountCard />

        <BudgetsCard />

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Notificações</CardTitle>
            </div>
            <CardDescription>Configure seus alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de vencimento</Label>
                <p className="text-sm text-muted-foreground">Receba lembretes antes do vencimento</p>
              </div>
              <Switch checked={settings.notify_due_alerts} disabled={loading} onCheckedChange={(v) => setSetting("notify_due_alerts", v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Resumo semanal</Label>
                <p className="text-sm text-muted-foreground">Receba um resumo das suas finanças</p>
              </div>
              <Switch checked={settings.notify_weekly_summary} disabled={loading} onCheckedChange={(v) => setSetting("notify_weekly_summary", v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de limite</Label>
                <p className="text-sm text-muted-foreground">Aviso quando atingir 80% do limite</p>
              </div>
              <Switch checked={settings.notify_limit_alerts} disabled={loading} onCheckedChange={(v) => setSetting("notify_limit_alerts", v)} />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Aparência</CardTitle>
            </div>
            <CardDescription>Personalize a interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Modo escuro</Label>
                <p className="text-sm text-muted-foreground">Alternar tema escuro/claro</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Segurança</CardTitle>
            </div>
            <CardDescription>Proteja sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Alterar Senha</Button>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Autenticação em dois fatores</Label>
                <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>Ações irreversíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Excluir Conta</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

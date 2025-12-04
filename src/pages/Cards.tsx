import { AppLayout } from "@/components/layout/AppLayout";
import { CreditCardWidget } from "@/components/dashboard/CreditCardWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";

const cards = [
  { brand: "nubank" as const, name: "João Silva", lastDigits: "4832", limit: 5000, used: 2340 },
  { brand: "santander" as const, name: "João Silva", lastDigits: "7621", limit: 8000, used: 1850 },
  { brand: "itau" as const, name: "João Silva", lastDigits: "9045", limit: 3000, used: 890 },
  { brand: "inter" as const, name: "João Silva", lastDigits: "2187", limit: 4500, used: 3200 },
  { brand: "c6" as const, name: "João Silva", lastDigits: "5563", limit: 6000, used: 1100 },
];

export default function Cards() {
  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const totalUsed = cards.reduce((sum, c) => sum + c.used, 0);
  const totalAvailable = totalLimit - totalUsed;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Cartões</h1>
            <p className="text-muted-foreground">Gerencie seus cartões de crédito</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Cartão
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Limite Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalLimit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Usado</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalUsed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disponível</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAvailable)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cartões Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {cards.map((card, index) => (
                <CreditCardWidget key={index} {...card} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

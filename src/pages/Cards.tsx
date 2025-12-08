import { AppLayout } from "@/components/layout/AppLayout";
import { CreditCardWidget } from "@/components/dashboard/CreditCardWidget";
import { AddCardDialog } from "@/components/cards/AddCardDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";
import { useCreditCards } from "@/hooks/useCreditCards";

export default function Cards() {
  const { cards, loading, addCard, updateCard } = useCreditCards();

  const totalLimit = cards.reduce((sum, c) => sum + Number(c.credit_limit), 0);
  const totalUsed = cards.reduce((sum, c) => sum + Number(c.used_amount), 0);
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
          <AddCardDialog onAdd={addCard} />
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cartão cadastrado
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <CreditCardWidget 
                    key={card.id} 
                    id={card.id}
                    brand={card.brand}
                    name={card.name}
                    lastDigits={card.last_digits}
                    limit={Number(card.credit_limit)}
                    used={Number(card.used_amount)}
                    onUpdateLimit={updateCard}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from "@/components/layout/AppLayout";
import { CreditCardWidget } from "@/components/dashboard/CreditCardWidget";
import { AddCardDialog } from "@/components/cards/AddCardDialog";
import { AddContractDialog } from "@/components/contracts/AddContractDialog";
import { ContractWidget } from "@/components/contracts/ContractWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, FileText, Loader2 } from "lucide-react";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useContracts } from "@/hooks/useContracts";
import { useTransactions } from "@/hooks/useTransactions";
import { cardUsedAmount } from "@/lib/utils";

export default function Cards() {
  const { cards, loading: cardsLoading, addCard, updateCard } = useCreditCards();
  const { contracts, loading: contractsLoading, addContract, updateContract } = useContracts();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const now = new Date();
  const usedFor = (cardId: string) => cardUsedAmount(transactions, cardId, now.getFullYear(), now.getMonth());

  const totalLimit = cards.reduce((sum, c) => sum + Number(c.credit_limit), 0);
  const totalUsed = cards.reduce((sum, c) => sum + usedFor(c.id), 0);
  const totalAvailable = totalLimit - totalUsed;

  const totalContractValue = contracts.reduce((sum, c) => sum + c.total_value, 0);
  const totalContractPaid = contracts.reduce((sum, c) => sum + (c.paid_installments * c.installment_value), 0);
  const totalContractRemaining = totalContractValue - totalContractPaid;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const loading = cardsLoading || contractsLoading;

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Cartões e Contratos</h1>
            <p className="text-muted-foreground">Gerencie seus cartões de crédito e contratos</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <AddCardDialog onAdd={addCard} />
            <AddContractDialog onAdd={addContract} />
          </div>
        </div>

        {/* Cards Summary */}
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

        {/* Contracts Summary */}
        {contracts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total Contratos</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalContractValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pago</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalContractPaid)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Restante</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalContractRemaining)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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

        {/* Contracts Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contratos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum contrato cadastrado
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {contracts.map((contract) => (
                  <ContractWidget 
                    key={contract.id} 
                    id={contract.id}
                    name={contract.name}
                    type={contract.type}
                    totalValue={contract.total_value}
                    installmentValue={contract.installment_value}
                    totalInstallments={contract.total_installments}
                    paidInstallments={contract.paid_installments}
                    onUpdate={updateContract}
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

import { Landmark,ArrowRight,Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { FinancingWizard } from '@/components/financing/FinancingWizard';
import { FinancingDetail } from '@/components/financing/FinancingDetail';
import { useFinancings } from '@/hooks/useFinancings';
import { currency,financingSummary } from '@/lib/financing';
import { parseLocalDate } from '@/lib/utils';
export default function Debts() {
 const actions=useFinancings(),[params,setParams]=useSearchParams(),selected=actions.financings.find(f=>f.id===params.get('id'));
 return <AppLayout><div className="p-4 lg:p-8 space-y-6 min-w-0">
  {selected?<FinancingDetail key={selected.id} financing={selected} actions={actions} onBack={()=>setParams({})}/>:<>
   <header className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold">Financiamentos</h1><FinancingWizard actions={actions} onCreated={id=>setParams({id})}/></header>
   {actions.loading?<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/></div>:actions.error?<div className="py-12 text-center space-y-4"><p className="text-destructive">Não foi possível carregar os financiamentos.</p><Button variant="outline" onClick={()=>actions.refetch()}>Tentar novamente</Button></div>:!actions.financings.length?<div className="flex flex-col items-center gap-4 py-16 text-muted-foreground"><Landmark className="w-12 h-12"/><p>Nenhum financiamento cadastrado.</p></div>:<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{actions.financings.map(f=>{const s=financingSummary(f.installments,f.prepayments);return <article className="bg-card border border-border rounded-lg p-5 space-y-4" key={f.id}><div className="flex items-center gap-2 text-primary"><Landmark className="w-5 h-5 shrink-0"/><span className="text-sm font-medium break-words">{f.bank}</span><span className="text-xs text-muted-foreground ml-auto">{f.system.toUpperCase()}</span></div><h2 className="text-lg font-semibold break-words">{f.name}</h2><div><p className="text-xs text-muted-foreground">Saldo devedor</p><p className="text-2xl font-bold">{currency(s.balance)}</p></div><div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground"><span>{s.paid} pagas · {s.remaining} restantes</span><span>{(f.monthly_rate*100).toFixed(2)}% a.m.</span></div><p className="text-sm text-muted-foreground">Quitação: {s.payoff?parseLocalDate(s.payoff).toLocaleDateString('pt-BR'):'Quitado'}</p><Button variant="outline" className="w-full justify-between" onClick={()=>setParams({id:f.id})}>Ver financiamento<ArrowRight className="w-4 h-4"/></Button></article>;})}</div>}
  </>}
 </div></AppLayout>;
}

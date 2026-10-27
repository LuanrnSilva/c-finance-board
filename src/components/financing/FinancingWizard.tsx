import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger } from '@/components/ui/dialog';
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BANKS,annualRate,currency,financingSchema,generateSchedule,inferRate, type FinancingInput,type Inference,type Observation } from '@/lib/financing';
import { formatLocalDate } from '@/lib/utils';
import type { useFinancings } from '@/hooks/useFinancings';
const initial:FinancingInput={name:'',bank:'',principal:0,n_installments:12,monthly_rate:.02,fixed_fee:0,first_due_date:formatLocalDate(new Date()),system:'price',rate_source:'informed',rate_confidence:null,indexed:false};
export function FinancingWizard({actions,onCreated}:{actions:ReturnType<typeof useFinancings>;onCreated:(id:string)=>void}) {
 const [open,setOpen]=useState(false),[step,setStep]=useState(1),[input,setInput]=useState(initial),[otherBank,setOtherBank]=useState('');
 const [first,setFirst]=useState(['','','']),[last,setLast]=useState(['','','']),[needLast,setNeedLast]=useState(false),[estimate,setEstimate]=useState<Inference|null>(null),[actual,setActual]=useState<Observation[]>([]);
 const {toast}=useToast();
 const change=(key:keyof FinancingInput,value:string|number|boolean|null)=>{setInput(p=>({...p,[key]:value}));setEstimate(null);};
 const fail=(e:unknown)=>toast({title:'Confira os dados',description:e instanceof Error?e.message:'Valores inválidos',variant:'destructive'});
 const next=()=>{try{const parsed=financingSchema.parse({...input,bank:input.bank==='Outro'?otherBank:input.bank});if(parsed.n_installments<3 && input.rate_source==='estimated')throw new Error('Para estimar a taxa, são necessárias pelo menos 3 parcelas.');setStep(2);}catch(e){fail(e);}};
 const infer=()=>{try{
   const observations=first.map(Number);const inferred=inferRate({n:input.n_installments,principal:input.principal||undefined,first:observations,fee:input.fixed_fee,last:needLast?last.map((v,k)=>({number:input.n_installments-2+k,payment:Number(v)})):undefined});
   setEstimate(inferred);setInput(p=>({...p,principal:inferred.principal,monthly_rate:inferred.monthlyRate,system:inferred.system,rate_confidence:inferred.confidence,indexed:inferred.detected==='irregular'}));
   setActual([...observations.map((payment,k)=>({number:k+1,payment})),...(needLast?last.map((v,k)=>({number:input.n_installments-2+k,payment:Number(v)})):[])]);
 }catch(e){if(e instanceof Error && e.message.includes('três últimas'))setNeedLast(true);fail(e);}};
 const preview=()=>{try{if(input.rate_source==='estimated'&&!estimate)throw new Error('Estime a taxa antes de continuar.');financingSchema.parse({...input,bank:input.bank==='Outro'?otherBank:input.bank});generateSchedule(input,input.rate_source==='estimated'?actual:[]);setStep(3);}catch(e){fail(e);}};
 const rows=step===3?generateSchedule(input,input.rate_source==='estimated'?actual:[]):[];
 const create=async()=>{try{const id=await actions.create.mutateAsync({input:{...input,bank:input.bank==='Outro'?otherBank:input.bank},actual:input.rate_source==='estimated'?actual:[]});setOpen(false);onCreated(id);}catch{/* Mutation shows the error. */}};
 const field=(label:string,key:'name'|'principal'|'n_installments'|'first_due_date'|'fixed_fee',type='text')=><div className="space-y-2"><Label htmlFor={`fin-${key}`}>{label}</Label><Input id={`fin-${key}`} type={type} min={type==='number'?0:undefined} step={key==='n_installments'?1:'0.01'} value={input[key]===0&&key==='principal'?'':input[key]} onChange={e=>change(key,type==='number'?Number(e.target.value):e.target.value)}/></div>;
 return <Dialog open={open} onOpenChange={v=>{setOpen(v);if(v){setStep(1);setInput(initial);setFirst(['','','']);setLast(['','','']);setOtherBank('');setEstimate(null);setNeedLast(false);setActual([]);}}}>
  <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/>Novo financiamento</Button></DialogTrigger>
  <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Financiamento · {step} de 3</DialogTitle></DialogHeader>
  {step===1&&<div className="space-y-4">{field('Nome do financiamento','name')}
    <div className="space-y-2"><Label htmlFor="fin-bank">Banco do financiamento</Label><Select value={input.bank} onValueChange={v=>change('bank',v)}><SelectTrigger id="fin-bank"><Landmark className="h-4 w-4 mr-2"/><SelectValue placeholder="Selecione o banco"/></SelectTrigger><SelectContent>{BANKS.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
    {input.bank==='Outro'&&<div className="space-y-2"><Label htmlFor="fin-other-bank">Nome do banco</Label><Input id="fin-other-bank" value={otherBank} onChange={e=>setOtherBank(e.target.value)}/></div>}
    <div className="grid sm:grid-cols-2 gap-4">{field('Valor financiado (R$)','principal','number')}{field('Número de parcelas','n_installments','number')}{field('Primeiro vencimento','first_due_date','date')}{field('Tarifa / seguro mensal (R$)','fixed_fee','number')}</div>
    <Button className="w-full" onClick={next}>Continuar<ArrowRight className="ml-2 h-4 w-4"/></Button></div>}
  {step===2&&<div className="space-y-4"><div className="grid grid-cols-2 gap-2"><Button variant={input.rate_source==='informed'?'default':'outline'} onClick={()=>{change('rate_source','informed');setActual([]);}}>Sei a taxa mensal</Button><Button variant={input.rate_source==='estimated'?'default':'outline'} onClick={()=>change('rate_source','estimated')}>Não sei a taxa</Button></div>
   {input.rate_source==='estimated'&&<><div className="grid grid-cols-3 gap-3">{first.map((v,k)=><div key={k} className="space-y-2"><Label htmlFor={`first-${k}`}>Parcela {k+1} (R$)</Label><Input id={`first-${k}`} type="number" min="0.01" step="0.01" value={v} onChange={e=>{setFirst(p=>p.map((x,j)=>j===k?e.target.value:x));setEstimate(null);}}/></div>)}</div>
    {needLast&&<><p className="text-sm text-warning">Valores irregulares: informe as três últimas parcelas para estimar a taxa; o extrato pode ter indexadores ou tarifas variáveis.</p><div className="grid grid-cols-3 gap-3">{last.map((v,k)=><div key={k} className="space-y-2"><Label htmlFor={`last-${k}`}>Parcela {input.n_installments-2+k} (R$)</Label><Input id={`last-${k}`} type="number" step="0.01" value={v} onChange={e=>{setLast(p=>p.map((x,j)=>j===k?e.target.value:x));setEstimate(null);}}/></div>)}</div></>}
    <Button variant="outline" className="w-full" onClick={infer}>Estimar taxa</Button></>}
   {(input.rate_source==='informed'||estimate)&&<><div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="fin-rate">Taxa mensal (%)</Label><Input id="fin-rate" type="number" min="0" max="20" step="0.000001" value={Number((input.monthly_rate*100).toFixed(6))} onChange={e=>setInput(p=>({...p,monthly_rate:Number(e.target.value)/100,rate_confidence:null}))}/></div><div className="space-y-2"><Label htmlFor="fin-system">Sistema</Label><Select value={input.system} onValueChange={v=>setInput(p=>({...p,system:v as FinancingInput['system'],rate_confidence:null}))}><SelectTrigger id="fin-system"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="price">Price · parcelas fixas</SelectItem><SelectItem value="sac">SAC · parcelas decrescentes</SelectItem></SelectContent></Select></div></div>
    <p className="text-sm text-muted-foreground">Taxa efetiva anual: {(annualRate(input.monthly_rate)*100).toFixed(2)}%</p></>}
   {estimate&&<div className="bg-muted rounded-lg p-3 space-y-2 text-sm"><p>Sistema detectado: {estimate.detected.toUpperCase()} · Confiança do ajuste: {(estimate.confidence*100).toFixed(1)}%</p><p>Erro residual: {currency(estimate.residual)}</p>{estimate.warnings.map(w=><p key={w} className="text-warning">{w}</p>)}</div>}
   <div className="flex justify-between gap-3"><Button variant="outline" onClick={()=>setStep(1)}><ArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button><Button onClick={preview}>Revisar<ArrowRight className="h-4 w-4 ml-2"/></Button></div></div>}
  {step===3&&<div className="space-y-4"><h3 className="font-semibold">{input.name} · {input.bank==='Outro'?otherBank:input.bank}</h3><dl className="grid grid-cols-2 gap-3 text-sm">{[['Financiado',currency(input.principal)],['Sistema',input.system.toUpperCase()],['Primeira parcela',currency(rows[0]?.payment??0)],['Custo total',currency(rows.reduce((s,r)=>s+r.payment,0))],['Total de juros',currency(rows.reduce((s,r)=>s+r.interest,0))],['Taxa mensal',`${(input.monthly_rate*100).toFixed(4)}%`]].map(([k,v])=><div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
   <p className="text-sm text-warning">Cronograma simulado, sujeito a diferenças do extrato bancário: IOF, pro rata por dias corridos, indexadores e tarifas variáveis.</p>
   <div className="flex justify-between gap-3"><Button variant="outline" disabled={actions.create.isPending} onClick={()=>setStep(2)}>Voltar</Button><Button disabled={actions.create.isPending} onClick={create}>{actions.create.isPending?'Salvando...':'Confirmar financiamento'}</Button></div></div>}
  </DialogContent></Dialog>;
}

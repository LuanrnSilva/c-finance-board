import { z } from 'zod';
import { addMonthsToDateStr, parseLocalDate } from './utils';

export const BANKS = ['Santander', 'Itaú', 'Bradesco', 'Caixa Econômica Federal', 'Banco do Brasil', 'Nubank', 'Porto', 'C6 Bank', 'Mercado Pago', 'Banco Pan', 'Inter', 'Outro'] as const;
export const money = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
export const currency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida').refine(v => { const d = parseLocalDate(v); return !isNaN(d.getTime()) && d.getFullYear() === Number(v.slice(0,4)) && d.getMonth()+1 === Number(v.slice(5,7)) && d.getDate() === Number(v.slice(8,10)); }, 'Data inválida');
export const financingSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120), bank: z.string().trim().min(1, 'Selecione o banco').max(100),
  principal: z.coerce.number().positive('Informe o valor financiado').max(1e10), n_installments: z.coerce.number().int().min(1).max(1200),
  monthly_rate: z.coerce.number().min(0).max(.2, 'Taxa mensal máxima: 20%'), system: z.enum(['price','sac']),
  fixed_fee: z.coerce.number().min(0).max(1e8), first_due_date: dateSchema, rate_source: z.enum(['informed','estimated']),
  rate_confidence: z.number().min(0).max(1).nullable(), indexed: z.boolean(),
});
export type FinancingInput = z.infer<typeof financingSchema>;
export interface ScheduleRow { number: number; due_date: string; payment: number; interest: number; amortization: number; fee: number; balance_after: number; is_actual: boolean; status: 'open'|'paid'|'prepaid'; paid_amount?: number|null; paid_at?: string|null; id?: string }
export interface Observation { number: number; payment: number }
export const observationSchema = z.array(z.object({number:z.number().int().positive(),payment:z.number().positive()}));
export const annualRate = (i: number) => Math.pow(1+i,12)-1;
export function pmt(pv: number, n: number, i: number) { return i === 0 ? pv/n : pv*i / -Math.expm1(-n*Math.log1p(i)); }

export function generateSchedule(input: FinancingInput, actual: Observation[] = [], options?: { payment?: number; amortization?: number; startNumber?: number }): ScheduleRow[] {
  const f = financingSchema.parse(input);
  observationSchema.parse(actual);
  let balance = money(f.principal);
  const payment = options?.payment ?? money(pmt(f.principal, f.n_installments, f.monthly_rate));
  const amort = options?.amortization ?? f.principal/f.n_installments;
  const rows: ScheduleRow[] = [];
  for(let k=0;k<f.n_installments && balance>0;k++) {
    const number = (options?.startNumber ?? 1)+k;
    const observation = actual.find(r=>r.number===number);
    const interest = money(balance*f.monthly_rate);
    const theoreticalAmort = f.system==='price' ? payment-interest : money(amort);
    let a = observation ? money(observation.payment-f.fixed_fee-interest) : theoreticalAmort;
    if(a<=0 && k<f.n_installments-1) throw new Error('A parcela não cobre juros e tarifa. Confira os valores.');
    if(!observation && k===f.n_installments-1) a=balance;
    a=Math.min(balance,Math.max(0,money(a)));
    const displayedPayment = observation?.payment ?? money(a+interest+f.fixed_fee);
    balance=money(balance-a);
    rows.push({number,due_date:addMonthsToDateStr(f.first_due_date,k),payment:money(displayedPayment),interest,amortization:a,fee:f.fixed_fee,balance_after:balance,is_actual:!!observation,status:'open'});
  }
  return rows;
}
export interface Inference { system: 'price'|'sac'; detected: 'price'|'sac'|'irregular'; monthlyRate: number; annualRate: number; confidence: number; residual: number; warnings: string[]; principal: number }
export function inferRate(input: {n:number; principal?:number; first:number[]; last?:Observation[]; fee?:number}): Inference {
  const {n,principal,first,last=[],fee=0}=z.object({n:z.number().int().min(3).max(1200),principal:z.number().positive().optional(),first:z.array(z.number().positive()).min(2).max(3),last:observationSchema.optional(),fee:z.number().nonnegative().optional()}).parse(input);
  const obs=[...first.map((payment,k)=>({number:k+1,payment})),...last];
  if(obs.some(o=>o.number>n) || new Set(obs.map(o=>o.number)).size!==obs.length) throw new Error('Números de parcelas inválidos ou repetidos.');
  const equal=first.every(v=>Math.abs(v-first[0])<=.05);
  const d=first[0]-first[1];
  const sac=d>0 && first.slice(1).every((v,k)=>Math.abs(first[k]-v-d)<=.05);
  let detected:Inference['detected']=equal?'price':sac?'sac':'irregular';
  let system:Inference['system']=equal?'price':'sac';
  let i=0; let pv=principal; const warnings:string[]=[];
  const estimate=(model:'price'|'sac',rate:number,P:number) => obs.map(o=>model==='price'?pmt(P,n,rate)+fee:P/n+(P-(o.number-1)*P/n)*rate+fee);
  const residual=(model:'price'|'sac',rate:number,P:number)=>Math.sqrt(estimate(model,rate,P).reduce((s,v,k)=>s+(v-obs[k].payment)**2,0)/obs.length);
  if(equal) {
    if(!pv) throw new Error('Taxa indeterminada: parcelas iguais exigem o valor financiado.');
    const target=first.reduce((s,v)=>s+v,0)/first.length-fee;
    if(target<pv/n-.05 || target>pmt(pv,n,.2)+.05) throw new Error('Parcela incompatível com o valor financiado ou taxa acima de 20% ao mês.');
    let lo=0,hi=.2; for(let k=0;k<100;k++){const mid=(lo+hi)/2;if(pmt(pv,n,mid)<target)lo=mid;else hi=mid;} i=(lo+hi)/2;
  } else if(sac) {
    const A=first[0]-n*d-fee;
    if(A<=0) throw new Error('Não foi possível estimar SAC; confira parcelas e tarifa.');
    const fromPayments=d/A;
    if(pv) { i=d*n/pv; if(Math.abs(i-fromPayments)>.0001) warnings.push(`Divergência: parcelas sugerem ${(fromPayments*100).toFixed(4)}% a.m.; valor financiado sugere ${(i*100).toFixed(4)}% a.m.`); }
    else { pv=A*n; i=fromPayments; warnings.push(`Valor financiado inferido: ${currency(pv)}. Confirme com o banco.`); }
    for(const o of last) if(Math.abs(o.payment-(first[0]-(o.number-1)*d))>.05) warnings.push('As últimas parcelas divergem do SAC regular.');
  } else {
    if(!pv || last.length<3) throw new Error('Parcelas irregulares: informe o valor financiado e as três últimas parcelas para estimar a taxa.');
    let best=Infinity;
    for(const model of ['price','sac'] as const) {
      let lo=0,hi=.2; for(let k=0;k<100;k++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(residual(model,a,pv)<residual(model,b,pv))hi=b;else lo=a;}
      const r=(lo+hi)/2,err=residual(model,r,pv);if(err<best){best=err;i=r;system=model;}
    }
    warnings.push('Parcelas irregulares: ajuste aproximado; indexadores ou tarifas variáveis podem alterar o cronograma.');
  }
  if(!pv || !Number.isFinite(i) || i<0 || i>.2) throw new Error('Taxa estimada fora do intervalo de 0% a 20% ao mês.');
  const error=residual(system,i,pv),mean=obs.reduce((s,o)=>s+o.payment,0)/obs.length;
  if(error>.05) warnings.push(`Erro médio do ajuste: ${currency(error)} por parcela.`);
  return {system,detected,monthlyRate:i,annualRate:annualRate(i),confidence:Math.max(0,1-error/mean),residual:error,warnings,principal:pv};
}
export const prepaymentSchema=z.object({amount:z.coerce.number().positive(),date:dateSchema,mode:z.enum(['reduce_term','reduce_installment'])});
export type PrepaymentInput=z.infer<typeof prepaymentSchema>;
export function simulatePrepayment(f:FinancingInput,rows:ScheduleRow[],input:PrepaymentInput) {
  const p=prepaymentSchema.parse(input),open=rows.filter(r=>r.status==='open').sort((a,b)=>a.number-b.number);
  if(!open.length) throw new Error('Não há parcelas em aberto.');
  const balance=money(open.reduce((s,r)=>s+r.amortization,0));
  if(p.amount>balance) throw new Error('O valor excede o saldo devedor.');
  const paidDates=rows.filter(r=>r.paid_at).map(r=>r.paid_at as string);
  if(paidDates.some(d=>d>p.date)) throw new Error('A amortização não pode ocorrer antes de um pagamento já registrado.');
  const nextBalance=money(balance-p.amount),before=money(open.reduce((s,r)=>s+r.interest,0));
  let n=open.length; let payment:number|undefined;let amortization:number|undefined;
  if(p.mode==='reduce_term' && nextBalance>0){
    if(f.system==='price') {payment=money(open[0].payment-open[0].fee);const x=f.monthly_rate===0?nextBalance/payment:-Math.log1p(-nextBalance*f.monthly_rate/payment)/Math.log1p(f.monthly_rate);if(!Number.isFinite(x))throw new Error('A parcela não cobre os juros do saldo.');n=Math.min(n,Math.max(1,Math.ceil(x-1e-8)));}
    else {amortization=open[0].amortization;n=Math.min(n,Math.max(1,Math.ceil(nextBalance/amortization-1e-8)));}
  }
  const generated=nextBalance===0?[]:generateSchedule({...f,principal:nextBalance,n_installments:n,first_due_date:open[0].due_date},[],{payment,amortization});
  const replacements=generated.map((r,k)=>({...r,id:open[k].id,number:open[k].number,due_date:open[k].due_date}));
  const after=money(replacements.reduce((s,r)=>s+r.interest,0));
  const removed=open.length-replacements.length;
  const schedule=rows.map(r=>{if(r.status!=='open')return {...r};const index=open.findIndex(o=>o.number===r.number);return replacements[index]??{...r,status:'prepaid' as const,paid_amount:0,paid_at:p.date};});
  return {schedule,openSchedule:replacements,balance:nextBalance,interestBefore:before,interestAfter:after,interestSaved:money(before-after),installmentsRemoved:removed,remaining:replacements.length,newPayment:replacements[0]?.payment??0,payoffDate:replacements.at(-1)?.due_date??p.date,savingPercent:p.amount>0?(before-after)/p.amount*100:0};
}
export function lastInstallmentPrepayment(f:FinancingInput,rows:ScheduleRow[]) {
  const open=rows.filter(r=>r.status==='open'),B=money(open.reduce((s,r)=>s+r.amortization,0));
  if(!open.length) throw new Error('Não há parcelas em aberto.');
  if(open.length===1) return B;
  if(f.system==='sac')return Math.max(.01,money(B-open[0].amortization*(open.length-1)));
  const payment=open[0].payment-open[0].fee, n=open.length-1;
  const pv=f.monthly_rate===0?payment*n:payment*-Math.expm1(-n*Math.log1p(f.monthly_rate))/f.monthly_rate;
  return Math.min(B,Math.max(.01,Math.ceil((B-pv)*100)/100));
}
export const paymentSchema=z.object({amount:z.coerce.number().positive(),date:dateSchema,category:z.string().min(1).nullable()});
export function financingSummary(rows:ScheduleRow[],prepayments:{amount:number}[]=[]) {
  const open=rows.filter(r=>r.status==='open'),settled=rows.filter(r=>r.status!=='open');
  return {balance:money(open.reduce((s,r)=>s+r.amortization,0)),paid:rows.filter(r=>r.status==='paid').length,prepaid:rows.filter(r=>r.status==='prepaid').length,remaining:open.length,totalPaid:money(settled.reduce((s,r)=>s+(r.paid_amount??0),0)+prepayments.reduce((s,p)=>s+Number(p.amount),0)),interestPaid:money(rows.filter(r=>r.status==='paid').reduce((s,r)=>s+r.interest,0)),interestRemaining:money(open.reduce((s,r)=>s+r.interest,0)),payoff:open.at(-1)?.due_date??null};
}

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { financingSchema, generateSchedule, paymentSchema, simulatePrepayment, type FinancingInput, type Observation, type ScheduleRow, type PrepaymentInput } from '@/lib/financing';
import type { Json } from '@/integrations/supabase/types';
export interface Financing extends FinancingInput {id:string;created_by:string;created_at:string;installments:ScheduleRow[];prepayments:{id:string;date:string;amount:number;mode:string;interest_saved:number;installments_removed:number;created_by:string}[]}
const json = (value:unknown):Json => JSON.parse(JSON.stringify(value));
export function useFinancings() {
 const {user,householdId}=useAuth();const {toast}=useToast();const qc=useQueryClient();
 const query=useQuery({queryKey:['financings',user?.id,householdId],enabled:!!user && !!householdId,queryFn:async():Promise<Financing[]>=>{
  const {data,error}=await supabase.from('financings').select('*, financing_installments(*), financing_prepayments(*)').eq('household_id',householdId??'').order('created_at',{ascending:false});
  if(error)throw error;
  return (data??[]).map(f=>({...f,system:f.system as FinancingInput['system'],rate_source:f.rate_source as FinancingInput['rate_source'],principal:Number(f.principal),monthly_rate:Number(f.monthly_rate),fixed_fee:Number(f.fixed_fee),rate_confidence:f.rate_confidence===null?null:Number(f.rate_confidence),installments:f.financing_installments.map(r=>({...r,status:r.status as ScheduleRow['status'],payment:Number(r.payment),interest:Number(r.interest),amortization:Number(r.amortization),fee:Number(r.fee),balance_after:Number(r.balance_after),paid_amount:r.paid_amount===null?null:Number(r.paid_amount)})).sort((a,b)=>a.number-b.number),prepayments:f.financing_prepayments.map(p=>({...p,amount:Number(p.amount),interest_saved:Number(p.interest_saved)}))}));
 }});
 useEffect(()=>{if(query.error)toast({title:'Erro ao carregar financiamentos',description:query.error.message,variant:'destructive'});},[query.error,toast]);
 const error=(e:Error)=>toast({title:'Não foi possível salvar',description:e.message,variant:'destructive'});
 const success=()=>{qc.invalidateQueries({queryKey:['financings']});qc.invalidateQueries({queryKey:['transactions']});toast({title:'Financiamento atualizado'});};
 const create=useMutation({mutationFn:async({input,actual}:{input:FinancingInput;actual:Observation[]})=>{
   if(!user)throw new Error('Entre na sua conta.');
   const parsed=financingSchema.parse(input),schedule=generateSchedule(parsed,actual);
   if(schedule.length!==parsed.n_installments)throw new Error('Parcelas informadas quitam o financiamento antes do prazo. Ajuste os valores.');
   if((schedule.at(-1)?.balance_after??0)>0)throw new Error('As parcelas reais deixam saldo residual. Ajuste a taxa ou as parcelas.');
   const {data,error}=await supabase.rpc('create_financing',{_input:json(parsed),_schedule:json(schedule)});if(error)throw error;return data;
 },onError:error,onSuccess:success});
 const pay=useMutation({mutationFn:async({id,amount,date,category,prepaid=false}:{id:string;amount:number;date:string;category:string|null;prepaid?:boolean})=>{
   const p=paymentSchema.parse({amount,date,category});const {error}=await supabase.rpc('pay_financing_installment',{_id:id,_amount:p.amount,_date:p.date,_category:p.category??undefined,_prepaid:prepaid});if(error)throw error;
 },onError:error,onSuccess:success});
 const prepay=useMutation({mutationFn:async({financing,input}:{financing:Financing;input:PrepaymentInput})=>{
   const result=simulatePrepayment(financing,financing.installments,input);
   const expected=financing.installments.map(r=>({id:r.id,status:r.status,payment:r.payment,amortization:r.amortization,balance_after:r.balance_after}));
   const {error}=await supabase.rpc('apply_financing_prepayment',{_id:financing.id,_amount:input.amount,_date:input.date,_mode:input.mode,_interest_saved:result.interestSaved,_schedule:json(result.openSchedule),_expected:json(expected)});if(error)throw error;
 },onError:error,onSuccess:success});
 const remove=useMutation({mutationFn:async(id:string)=>{const {error}=await supabase.from('financings').delete().eq('id',id);if(error)throw error;},onError:error,onSuccess:success});
 return {financings:query.data??[],loading:query.isLoading,error:query.error,create,pay,prepay,remove,refetch:query.refetch};
}

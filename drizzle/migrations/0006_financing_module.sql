CREATE TABLE public.financings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), household_id uuid NOT NULL REFERENCES public.households(id), name text NOT NULL, bank text NOT NULL, system text NOT NULL CHECK(system IN ('price','sac')), principal numeric(14,2) NOT NULL CHECK(principal > 0), n_installments int NOT NULL CHECK(n_installments BETWEEN 1 AND 1200), monthly_rate numeric(10,8) NOT NULL CHECK(monthly_rate BETWEEN 0 AND 0.2), fixed_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK(fixed_fee >= 0), first_due_date date NOT NULL, rate_source text NOT NULL CHECK(rate_source IN ('informed','estimated')), rate_confidence numeric CHECK(rate_confidence BETWEEN 0 AND 1), indexed boolean NOT NULL DEFAULT false, created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.financings TO authenticated;
GRANT ALL ON public.financings TO service_role;
ALTER TABLE public.financings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household reads financings" ON public.financings FOR SELECT TO authenticated USING(public.is_household_member(household_id));
CREATE POLICY "Household creates financings" ON public.financings FOR INSERT TO authenticated WITH CHECK(public.is_household_member(household_id) AND created_by=auth.uid());
CREATE POLICY "Household updates financings" ON public.financings FOR UPDATE TO authenticated USING(public.is_household_member(household_id)) WITH CHECK(public.is_household_member(household_id));
CREATE POLICY "Household deletes financings" ON public.financings FOR DELETE TO authenticated USING(public.is_household_member(household_id));
CREATE TABLE public.financing_installments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), financing_id uuid NOT NULL REFERENCES public.financings(id) ON DELETE CASCADE, household_id uuid NOT NULL REFERENCES public.households(id), number int NOT NULL CHECK(number > 0), due_date date NOT NULL, payment numeric(14,2) NOT NULL CHECK(payment >= 0), interest numeric(14,2) NOT NULL CHECK(interest >= 0), amortization numeric(14,2) NOT NULL CHECK(amortization >= 0), fee numeric(12,2) NOT NULL DEFAULT 0 CHECK(fee >= 0), balance_after numeric(14,2) NOT NULL CHECK(balance_after >= 0), is_actual boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','paid','prepaid')), paid_amount numeric(14,2) CHECK(paid_amount >= 0), paid_at date, UNIQUE(financing_id,number)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.financing_installments TO authenticated;
GRANT ALL ON public.financing_installments TO service_role;
ALTER TABLE public.financing_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household installment access" ON public.financing_installments FOR ALL TO authenticated USING(public.is_household_member(household_id)) WITH CHECK(public.is_household_member(household_id) AND EXISTS(SELECT 1 FROM public.financings f WHERE f.id=financing_id AND f.household_id=financing_installments.household_id));
CREATE TABLE public.financing_prepayments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), financing_id uuid NOT NULL REFERENCES public.financings(id) ON DELETE CASCADE, household_id uuid NOT NULL REFERENCES public.households(id), date date NOT NULL, amount numeric(14,2) NOT NULL CHECK(amount > 0), mode text NOT NULL CHECK(mode IN ('reduce_term','reduce_installment')), interest_saved numeric(14,2) NOT NULL, installments_removed int NOT NULL CHECK(installments_removed >= 0), created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.financing_prepayments TO authenticated;
GRANT ALL ON public.financing_prepayments TO service_role;
ALTER TABLE public.financing_prepayments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household prepayment access" ON public.financing_prepayments FOR ALL TO authenticated USING(public.is_household_member(household_id)) WITH CHECK(public.is_household_member(household_id) AND created_by=auth.uid() AND EXISTS(SELECT 1 FROM public.financings f WHERE f.id=financing_id AND f.household_id=financing_prepayments.household_id));
ALTER TABLE public.transactions ADD COLUMN financing_installment_id uuid REFERENCES public.financing_installments(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX transactions_financing_installment_unique ON public.transactions(financing_installment_id) WHERE financing_installment_id IS NOT NULL;
CREATE INDEX financings_household_idx ON public.financings(household_id);
CREATE INDEX financing_installments_parent_idx ON public.financing_installments(financing_id);
CREATE FUNCTION public.create_financing(_input jsonb, _schedule jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE fid uuid; hid uuid; r jsonb;
BEGIN
 hid:=public.ensure_household();
 INSERT INTO public.financings(household_id,name,bank,system,principal,n_installments,monthly_rate,fixed_fee,first_due_date,rate_source,rate_confidence,indexed) VALUES(hid,_input->>'name',_input->>'bank',_input->>'system',(_input->>'principal')::numeric,(_input->>'n_installments')::int,(_input->>'monthly_rate')::numeric,(_input->>'fixed_fee')::numeric,(_input->>'first_due_date')::date,_input->>'rate_source',(_input->>'rate_confidence')::numeric,COALESCE((_input->>'indexed')::boolean,false)) RETURNING id INTO fid;
 IF jsonb_array_length(_schedule) <> (_input->>'n_installments')::int THEN RAISE EXCEPTION 'Cronograma incompleto'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(_schedule) LOOP
 INSERT INTO public.financing_installments(financing_id,household_id,number,due_date,payment,interest,amortization,fee,balance_after,is_actual) VALUES(fid,hid,(r->>'number')::int,(r->>'due_date')::date,(r->>'payment')::numeric,(r->>'interest')::numeric,(r->>'amortization')::numeric,(r->>'fee')::numeric,(r->>'balance_after')::numeric,COALESCE((r->>'is_actual')::boolean,false));
 END LOOP;
 RETURN fid;
END $$;
CREATE FUNCTION public.pay_financing_installment(_id uuid,_amount numeric,_date date,_category text DEFAULT NULL,_prepaid boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE r public.financing_installments; f public.financings;
BEGIN
 SELECT * INTO r FROM public.financing_installments WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR NOT public.is_household_member(r.household_id) THEN RAISE EXCEPTION 'Parcela indisponível'; END IF;
 PERFORM 1 FROM public.financings WHERE id=r.financing_id FOR UPDATE;
 IF r.status <> 'open' THEN RAISE EXCEPTION 'Esta parcela já foi paga'; END IF;
 IF _amount <= 0 OR _date IS NULL THEN RAISE EXCEPTION 'Informe valor e data válidos'; END IF;
 UPDATE public.financing_installments SET status=CASE WHEN _prepaid THEN 'prepaid' ELSE 'paid' END,paid_amount=_amount,paid_at=_date WHERE id=_id;
 IF _category IS NOT NULL THEN
 SELECT * INTO f FROM public.financings WHERE id=r.financing_id;
 INSERT INTO public.transactions(user_id,household_id,description,category,amount,date,type,financing_installment_id) VALUES(auth.uid(),r.household_id,f.name||' — parcela '||r.number,_category,_amount,_date,'expense',r.id);
 END IF;
END $$;
CREATE FUNCTION public.apply_financing_prepayment(_id uuid,_amount numeric,_date date,_mode text,_interest_saved numeric,_schedule jsonb,_expected jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE f public.financings; r public.financing_installments; item jsonb; idx int:=0; cnt int; snapshot jsonb;
BEGIN
 SELECT * INTO f FROM public.financings WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR NOT public.is_household_member(f.household_id) THEN RAISE EXCEPTION 'Financiamento indisponível'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',id,'status',status,'payment',payment,'amortization',amortization,'balance_after',balance_after) ORDER BY number) INTO snapshot FROM public.financing_installments WHERE financing_id=_id;
 IF snapshot IS DISTINCT FROM _expected THEN RAISE EXCEPTION 'O cronograma mudou. Atualize antes de confirmar.'; END IF;
 SELECT count(*) INTO cnt FROM public.financing_installments WHERE financing_id=_id AND status='open';
 IF jsonb_array_length(_schedule)>cnt OR _amount<=0 OR _amount>(SELECT sum(amortization) FROM public.financing_installments WHERE financing_id=_id AND status='open') THEN RAISE EXCEPTION 'Amortização inválida'; END IF;
 FOR r IN SELECT * FROM public.financing_installments WHERE financing_id=_id AND status='open' ORDER BY number FOR UPDATE LOOP
 item:=_schedule->idx;
 IF item IS NULL THEN UPDATE public.financing_installments SET status='prepaid',paid_amount=0,paid_at=_date WHERE id=r.id;
 ELSE UPDATE public.financing_installments SET payment=(item->>'payment')::numeric,interest=(item->>'interest')::numeric,amortization=(item->>'amortization')::numeric,fee=(item->>'fee')::numeric,balance_after=(item->>'balance_after')::numeric,is_actual=false WHERE id=r.id; END IF;
 idx:=idx+1;
 END LOOP;
 INSERT INTO public.financing_prepayments(financing_id,household_id,date,amount,mode,interest_saved,installments_removed) VALUES(_id,f.household_id,_date,_amount,_mode,_interest_saved,cnt-jsonb_array_length(_schedule));
END $$;
REVOKE ALL ON FUNCTION public.create_financing(jsonb,jsonb),public.pay_financing_installment(uuid,numeric,date,text,boolean),public.apply_financing_prepayment(uuid,numeric,date,text,numeric,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_financing(jsonb,jsonb),public.pay_financing_installment(uuid,numeric,date,text,boolean),public.apply_financing_prepayment(uuid,numeric,date,text,numeric,jsonb,jsonb) TO authenticated,service_role;
CREATE TABLE public.recurring_schedules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 household_id uuid NOT NULL REFERENCES public.households(id),
 created_by uuid NOT NULL,
 description text NOT NULL,
 amount numeric(12,2) NOT NULL CHECK (amount > 0),
 category text NOT NULL,
 credit_card_id uuid REFERENCES public.credit_cards(id) ON DELETE SET NULL,
 person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
 start_date date NOT NULL,
 end_date date,
 billing_day integer NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
 next_date date NOT NULL,
 state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','paused','ended')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recurring_schedules TO authenticated;
GRANT ALL ON public.recurring_schedules TO service_role;
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read recurring schedules" ON public.recurring_schedules FOR SELECT TO authenticated USING (public.is_household_member(household_id));
ALTER TABLE public.transactions ADD COLUMN recurring_schedule_id uuid REFERENCES public.recurring_schedules(id);
CREATE UNIQUE INDEX transactions_recurring_date_unique ON public.transactions(recurring_schedule_id,date) WHERE recurring_schedule_id IS NOT NULL;
CREATE INDEX recurring_schedules_due_idx ON public.recurring_schedules(next_date) WHERE state='active';

CREATE FUNCTION public.recurring_month_date(_month date, _day integer) RETURNS date LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT (date_trunc('month',_month)::date + (least(_day,extract(day FROM (date_trunc('month',_month) + interval '1 month - 1 day'))::integer)-1))::date
$$;
REVOKE ALL ON FUNCTION public.recurring_month_date(date,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.recurring_month_date(date,integer) TO authenticated,service_role;

CREATE FUNCTION public.generate_recurring_expenses(_household uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.recurring_schedules%ROWTYPE; today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; inserted integer := 0; affected integer; steps integer;
BEGIN
 IF _household IS NULL THEN
  IF auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'Grupo obrigatório'; END IF;
 ELSE
  IF NOT public.is_household_member(_household) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
 END IF;
 FOR s IN SELECT * FROM public.recurring_schedules WHERE state='active' AND next_date<=today AND (_household IS NULL OR household_id=_household) ORDER BY next_date FOR UPDATE SKIP LOCKED LIMIT 1000 LOOP
  steps := 0;
  WHILE s.next_date<=today AND (s.end_date IS NULL OR s.next_date<=s.end_date) AND steps<120 LOOP
   INSERT INTO public.transactions(user_id,household_id,description,amount,category,date,type,credit_card_id,card_brand,person_id,recurring_schedule_id)
   VALUES(s.created_by,s.household_id,s.description,s.amount,s.category,s.next_date,'expense',s.credit_card_id,(SELECT brand FROM public.credit_cards WHERE id=s.credit_card_id AND household_id=s.household_id),s.person_id,s.id)
   ON CONFLICT (recurring_schedule_id,date) WHERE recurring_schedule_id IS NOT NULL DO NOTHING;
   GET DIAGNOSTICS affected = ROW_COUNT; inserted := inserted+affected;
   s.next_date := public.recurring_month_date((date_trunc('month',s.next_date)+interval '1 month')::date,s.billing_day);
   steps := steps+1;
  END LOOP;
  UPDATE public.recurring_schedules SET next_date=s.next_date, state=CASE WHEN s.end_date IS NOT NULL AND s.next_date>s.end_date THEN 'ended' ELSE 'active' END,updated_at=now() WHERE id=s.id;
 END LOOP;
 RETURN inserted;
END $$;
REVOKE ALL ON FUNCTION public.generate_recurring_expenses(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.generate_recurring_expenses(uuid) TO authenticated,service_role;

CREATE FUNCTION public.manage_recurring_schedule(_action text,_id uuid DEFAULT NULL,_input jsonb DEFAULT '{}'::jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.recurring_schedules%ROWTYPE; hid uuid; today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; card_id uuid; pid uuid; start_on date; end_on date; v_amount numeric; v_description text; v_category text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 hid := public.ensure_household();
 IF _action='create' OR _action='edit' THEN
  v_description := trim(_input->>'description'); v_category := trim(_input->>'category'); v_amount := (_input->>'amount')::numeric;
  start_on := (_input->>'start_date')::date; end_on := nullif(_input->>'end_date','')::date;
  card_id := nullif(_input->>'credit_card_id','')::uuid; pid := nullif(_input->>'person_id','')::uuid;
  IF coalesce(v_description,'')='' OR length(v_description)>200 OR coalesce(v_category,'')='' OR v_amount IS NULL OR v_amount<=0 OR start_on IS NULL THEN RAISE EXCEPTION 'Preencha descrição, valor positivo, categoria e data'; END IF;
  IF end_on IS NOT NULL AND end_on<start_on THEN RAISE EXCEPTION 'A data final deve ser posterior à primeira cobrança'; END IF;
  IF card_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.credit_cards WHERE id=card_id AND household_id=hid) THEN RAISE EXCEPTION 'Cartão não pertence ao grupo'; END IF;
  IF pid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.people WHERE id=pid AND household_id=hid) THEN RAISE EXCEPTION 'Pessoa não pertence ao grupo'; END IF;
 END IF;
 IF _action='create' THEN
  IF start_on<today THEN RAISE EXCEPTION 'A primeira cobrança deve ser hoje ou uma data futura'; END IF;
  INSERT INTO public.recurring_schedules(household_id,created_by,description,amount,category,credit_card_id,person_id,start_date,end_date,billing_day,next_date)
  VALUES(hid,auth.uid(),v_description,v_amount,v_category,card_id,pid,start_on,end_on,extract(day FROM start_on)::integer,start_on) RETURNING id INTO _id;
 ELSE
  SELECT * INTO s FROM public.recurring_schedules WHERE id=_id AND household_id=hid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Agendamento não encontrado'; END IF;
  IF s.state='ended' THEN RAISE EXCEPTION 'Agendamento encerrado'; END IF;
  IF _action='edit' THEN
   IF start_on<today THEN RAISE EXCEPTION 'Escolha hoje ou uma data futura para a próxima cobrança'; END IF;
   IF EXISTS(SELECT 1 FROM public.transactions WHERE recurring_schedule_id=_id AND date>=start_on) THEN RAISE EXCEPTION 'Já existe uma cobrança nessa data ou depois dela. Escolha uma data posterior.'; END IF;
   UPDATE public.recurring_schedules SET description=v_description,amount=v_amount,category=v_category,credit_card_id=card_id,person_id=pid,end_date=end_on,billing_day=extract(day FROM start_on)::integer,next_date=start_on,updated_at=now() WHERE id=_id;
  ELSIF _action='pause' THEN
   UPDATE public.recurring_schedules SET state='paused',updated_at=now() WHERE id=_id;
  ELSIF _action='resume' THEN
   s.next_date := greatest(s.next_date,s.start_date,public.recurring_month_date(today,s.billing_day));
   IF s.next_date<today THEN s.next_date := public.recurring_month_date((date_trunc('month',today)+interval '1 month')::date,s.billing_day); END IF;
   UPDATE public.recurring_schedules SET state=CASE WHEN s.end_date IS NOT NULL AND s.next_date>s.end_date THEN 'ended' ELSE 'active' END,next_date=s.next_date,updated_at=now() WHERE id=_id;
  ELSIF _action='end' THEN
   UPDATE public.recurring_schedules SET state='ended',updated_at=now() WHERE id=_id;
  ELSE RAISE EXCEPTION 'Ação inválida'; END IF;
 END IF;
 PERFORM public.generate_recurring_expenses(hid);
 RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.manage_recurring_schedule(text,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_recurring_schedule(text,uuid,jsonb) TO authenticated;

DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.accept_household_invite(uuid,boolean)'::regprocedure) INTO definition;
 definition := replace(definition,'OR EXISTS(SELECT 1 FROM public.financings WHERE household_id=old_hid)','OR EXISTS(SELECT 1 FROM public.financings WHERE household_id=old_hid) OR EXISTS(SELECT 1 FROM public.recurring_schedules WHERE household_id=old_hid)');
 definition := replace(definition,'UPDATE public.transactions SET household_id=inv.household_id WHERE household_id=old_hid;','UPDATE public.recurring_schedules SET household_id=inv.household_id WHERE household_id=old_hid; UPDATE public.transactions SET household_id=inv.household_id WHERE household_id=old_hid;');
 EXECUTE definition;
END $$;
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('generate-monthly-expenses','5 3 * * *','SELECT public.generate_recurring_expenses();');
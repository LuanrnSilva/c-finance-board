CREATE OR REPLACE FUNCTION public.accept_household_invite(_token uuid, _migrate_data boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.household_invites%ROWTYPE; old_hid uuid; has_data boolean; my_email text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
 SELECT * INTO inv FROM public.household_invites WHERE token = _token FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido ou cancelado'; END IF;
 SELECT email INTO my_email FROM auth.users WHERE id = auth.uid();
 IF my_email IS NULL OR lower(trim(my_email)) <> lower(trim(inv.email)) THEN RAISE EXCEPTION 'Entre com o e-mail que recebeu este convite'; END IF;
 SELECT household_id INTO old_hid FROM public.household_members WHERE user_id = auth.uid() LIMIT 1;
 IF old_hid = inv.household_id THEN
   UPDATE public.household_invites SET accepted_at = coalesce(accepted_at, now()) WHERE id = inv.id;
   RETURN inv.household_id;
 END IF;
 IF inv.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'Convite já utilizado'; END IF;
 IF inv.expires_at <= now() THEN RAISE EXCEPTION 'Convite expirado. Peça um novo link.'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = inv.household_id AND user_id = inv.invited_by AND role = 'owner') THEN RAISE EXCEPTION 'O responsável por este convite não faz mais parte do grupo'; END IF;
 IF old_hid IS NOT NULL THEN
   IF EXISTS (SELECT 1 FROM public.household_members WHERE household_id = old_hid AND user_id <> auth.uid()) THEN RAISE EXCEPTION 'Você já compartilha outra conta. Saia dela antes de aceitar.'; END IF;
   SELECT EXISTS(SELECT 1 FROM public.transactions WHERE household_id=old_hid)
     OR EXISTS(SELECT 1 FROM public.credit_cards WHERE household_id=old_hid)
     OR EXISTS(SELECT 1 FROM public.categories WHERE household_id=old_hid)
     OR EXISTS(SELECT 1 FROM public.contracts WHERE household_id=old_hid)
     OR EXISTS(SELECT 1 FROM public.people WHERE household_id=old_hid)
     OR EXISTS(SELECT 1 FROM public.goals WHERE household_id=old_hid)
     OR EXISTS(SELECT 1 FROM public.goal_contributions WHERE household_id=old_hid)
     OR EXISTS(SELECT 1 FROM public.budgets WHERE household_id=old_hid)
     OR EXISTS(SELECT 1 FROM public.recurring_overrides WHERE household_id=old_hid)
     OR EXISTS(SELECT 1 FROM public.financings WHERE household_id=old_hid)
     INTO has_data;
   IF has_data AND NOT _migrate_data THEN RAISE EXCEPTION 'HAS_DATA'; END IF;
   IF EXISTS(SELECT 1 FROM public.budgets a JOIN public.budgets b ON a.category=b.category WHERE a.household_id=old_hid AND b.household_id=inv.household_id AND a.monthly_limit<>b.monthly_limit) THEN RAISE EXCEPTION 'Os grupos têm limites diferentes para a mesma categoria. Ajuste ou remova o limite da sua conta antes de entrar.'; END IF;
   IF EXISTS(SELECT 1 FROM public.recurring_overrides a JOIN public.recurring_overrides b ON a.normalized_description=b.normalized_description AND a.category=b.category WHERE a.household_id=old_hid AND b.household_id=inv.household_id AND a.status<>b.status) THEN RAISE EXCEPTION 'Os grupos têm decisões diferentes para um gasto recorrente. Ajuste a decisão da sua conta antes de entrar.'; END IF;
 END IF;
 INSERT INTO public.household_members(household_id,user_id,role) VALUES(inv.household_id,auth.uid(),'member');
 IF old_hid IS NOT NULL THEN
   UPDATE public.credit_cards SET household_id=inv.household_id WHERE household_id=old_hid;
   UPDATE public.categories SET household_id=inv.household_id WHERE household_id=old_hid;
   UPDATE public.contracts SET household_id=inv.household_id WHERE household_id=old_hid;
   UPDATE public.people SET household_id=inv.household_id WHERE household_id=old_hid;
   UPDATE public.goals SET household_id=inv.household_id WHERE household_id=old_hid;
   UPDATE public.goal_contributions SET household_id=inv.household_id WHERE household_id=old_hid;
   UPDATE public.financings SET household_id=inv.household_id WHERE household_id=old_hid;
   UPDATE public.financing_installments SET household_id=inv.household_id WHERE household_id=old_hid;
   UPDATE public.financing_prepayments SET household_id=inv.household_id WHERE household_id=old_hid;
   UPDATE public.transactions SET household_id=inv.household_id WHERE household_id=old_hid;
   DELETE FROM public.budgets a USING public.budgets b WHERE a.household_id=old_hid AND b.household_id=inv.household_id AND a.category=b.category AND a.monthly_limit=b.monthly_limit;
   UPDATE public.budgets SET household_id=inv.household_id WHERE household_id=old_hid;
   DELETE FROM public.recurring_overrides a USING public.recurring_overrides b WHERE a.household_id=old_hid AND b.household_id=inv.household_id AND a.normalized_description=b.normalized_description AND a.category=b.category AND a.status=b.status;
   UPDATE public.recurring_overrides SET household_id=inv.household_id WHERE household_id=old_hid;
   DELETE FROM public.household_members WHERE household_id=old_hid AND user_id=auth.uid();
   DELETE FROM public.households WHERE id=old_hid;
 END IF;
 UPDATE public.household_invites SET accepted_at=now() WHERE id=inv.id;
 RETURN inv.household_id;
END $$;
REVOKE ALL ON FUNCTION public.accept_household_invite(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_household_invite(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.ensure_household() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE hid uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 SELECT household_id INTO hid FROM public.household_members WHERE user_id=auth.uid() LIMIT 1;
 IF hid IS NULL THEN
  INSERT INTO public.households DEFAULT VALUES RETURNING id INTO hid;
  INSERT INTO public.household_members(household_id,user_id,role) VALUES(hid,auth.uid(),'owner');
 END IF;
 RETURN hid;
END $$;
REVOKE ALL ON FUNCTION public.ensure_household() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ensure_household() TO authenticated;
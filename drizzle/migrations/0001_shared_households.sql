CREATE TABLE public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Minha casa',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.household_members (
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);
CREATE UNIQUE INDEX household_members_one_per_user ON public.household_members(user_id);
CREATE TABLE public.household_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  email text NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.households TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.household_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.household_invites TO authenticated;
GRANT ALL ON public.households, public.household_members, public.household_invites TO service_role;

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_household_member(_household_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = _household_id AND user_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.is_household_owner(_household_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = _household_id AND user_id = auth.uid() AND role = 'owner')
$$;
CREATE OR REPLACE FUNCTION public.shares_household(_other uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.household_members a JOIN public.household_members b ON a.household_id = b.household_id
    WHERE a.user_id = auth.uid() AND b.user_id = _other)
$$;
CREATE OR REPLACE FUNCTION public.current_household_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT household_id FROM public.household_members WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "Members view household" ON public.households FOR SELECT TO authenticated USING (public.is_household_member(id));
CREATE POLICY "Members view members" ON public.household_members FOR SELECT TO authenticated USING (public.is_household_member(household_id));
CREATE POLICY "Owner adds members" ON public.household_members FOR INSERT TO authenticated WITH CHECK (public.is_household_owner(household_id));
CREATE POLICY "Owner removes members" ON public.household_members FOR DELETE TO authenticated USING (public.is_household_owner(household_id) AND user_id <> auth.uid());
CREATE POLICY "Owner views invites" ON public.household_invites FOR SELECT TO authenticated USING (public.is_household_owner(household_id));
CREATE POLICY "Owner creates invites" ON public.household_invites FOR INSERT TO authenticated WITH CHECK (public.is_household_owner(household_id) AND invited_by = auth.uid());
CREATE POLICY "Owner deletes invites" ON public.household_invites FOR DELETE TO authenticated USING (public.is_household_owner(household_id));

CREATE POLICY "Household members view profiles" ON public.profiles FOR SELECT TO authenticated USING (public.shares_household(user_id));

-- household_id columns
ALTER TABLE public.transactions ADD COLUMN household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.credit_cards ADD COLUMN household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.contracts ADD COLUMN household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.people ADD COLUMN household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;

-- backfill: one household per existing user
DO $$
DECLARE r record; hid uuid;
BEGIN
  FOR r IN
    SELECT id AS uid FROM auth.users
    UNION SELECT user_id FROM public.transactions
    UNION SELECT user_id FROM public.credit_cards
    UNION SELECT user_id FROM public.categories
    UNION SELECT user_id FROM public.contracts
    UNION SELECT user_id FROM public.people
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = r.uid) THEN CONTINUE; END IF;
    INSERT INTO public.households DEFAULT VALUES RETURNING id INTO hid;
    INSERT INTO public.household_members(household_id, user_id, role) VALUES (hid, r.uid, 'owner');
    UPDATE public.transactions SET household_id = hid WHERE user_id = r.uid;
    UPDATE public.credit_cards SET household_id = hid WHERE user_id = r.uid;
    UPDATE public.categories SET household_id = hid WHERE user_id = r.uid;
    UPDATE public.contracts SET household_id = hid WHERE user_id = r.uid;
    UPDATE public.people SET household_id = hid WHERE user_id = r.uid;
  END LOOP;
END $$;

-- fill household_id automatically when omitted
CREATE OR REPLACE FUNCTION public.set_household_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.household_id IS NULL THEN
    SELECT household_id INTO NEW.household_id FROM public.household_members WHERE user_id = NEW.user_id LIMIT 1;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER set_household_transactions BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_household_id();
CREATE TRIGGER set_household_credit_cards BEFORE INSERT ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION public.set_household_id();
CREATE TRIGGER set_household_categories BEFORE INSERT ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_household_id();
CREATE TRIGGER set_household_contracts BEFORE INSERT ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.set_household_id();
CREATE TRIGGER set_household_people BEFORE INSERT ON public.people FOR EACH ROW EXECUTE FUNCTION public.set_household_id();

ALTER TABLE public.transactions ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE public.credit_cards ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE public.contracts ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE public.people ALTER COLUMN household_id SET NOT NULL;

-- replace policies
DROP POLICY "Users can delete their own transactions" ON public.transactions;
DROP POLICY "Users can insert their own transactions" ON public.transactions;
DROP POLICY "Users can update their own transactions" ON public.transactions;
DROP POLICY "Users can view their own transactions" ON public.transactions;
DROP POLICY "Users can delete their own cards" ON public.credit_cards;
DROP POLICY "Users can insert their own cards" ON public.credit_cards;
DROP POLICY "Users can update their own cards" ON public.credit_cards;
DROP POLICY "Users can view their own cards" ON public.credit_cards;
DROP POLICY "Users can delete their own categories" ON public.categories;
DROP POLICY "Users can insert their own categories" ON public.categories;
DROP POLICY "Users can update their own categories" ON public.categories;
DROP POLICY "Users can view their own categories" ON public.categories;
DROP POLICY "Users can delete their own contracts" ON public.contracts;
DROP POLICY "Users can insert their own contracts" ON public.contracts;
DROP POLICY "Users can update their own contracts" ON public.contracts;
DROP POLICY "Users can view their own contracts" ON public.contracts;
DROP POLICY "Users can delete their own people" ON public.people;
DROP POLICY "Users can insert their own people" ON public.people;
DROP POLICY "Users can update their own people" ON public.people;
DROP POLICY "Users can view their own people" ON public.people;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['transactions','credit_cards','categories','contracts','people'] LOOP
    EXECUTE format('CREATE POLICY "Household select" ON public.%I FOR SELECT TO authenticated USING (public.is_household_member(household_id))', t);
    EXECUTE format('CREATE POLICY "Household insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_household_member(household_id) AND user_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Household update" ON public.%I FOR UPDATE TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id))', t);
    EXECUTE format('CREATE POLICY "Household delete" ON public.%I FOR DELETE TO authenticated USING (public.is_household_member(household_id))', t);
  END LOOP;
END $$;

-- signup creates household
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE hid uuid;
BEGIN
  INSERT INTO public.profiles (user_id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.households DEFAULT VALUES RETURNING id INTO hid;
  INSERT INTO public.household_members(household_id, user_id, role) VALUES (hid, NEW.id, 'owner');
  RETURN NEW;
END $$;

-- users removed from a household get a fresh one
CREATE OR REPLACE FUNCTION public.ensure_household()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE hid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT household_id INTO hid FROM public.household_members WHERE user_id = auth.uid() LIMIT 1;
  IF hid IS NULL THEN
    INSERT INTO public.households DEFAULT VALUES RETURNING id INTO hid;
    INSERT INTO public.household_members(household_id, user_id, role) VALUES (hid, auth.uid(), 'owner');
  END IF;
  RETURN hid;
END $$;

CREATE OR REPLACE FUNCTION public.accept_household_invite(_token uuid, _migrate_data boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv record; old_hid uuid; has_data boolean; other_members int; my_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO inv FROM public.household_invites WHERE token = _token FOR UPDATE;
  IF inv IS NULL THEN RAISE EXCEPTION 'Convite inválido'; END IF;
  IF inv.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'Convite já utilizado'; END IF;
  IF inv.expires_at < now() THEN RAISE EXCEPTION 'Convite expirado'; END IF;
  SELECT email INTO my_email FROM auth.users WHERE id = auth.uid();
  IF lower(my_email) <> lower(inv.email) THEN RAISE EXCEPTION 'Este convite foi enviado para outro e-mail'; END IF;

  SELECT household_id INTO old_hid FROM public.household_members WHERE user_id = auth.uid() LIMIT 1;
  IF old_hid = inv.household_id THEN RAISE EXCEPTION 'Você já faz parte desta conta'; END IF;

  IF old_hid IS NOT NULL THEN
    SELECT count(*) INTO other_members FROM public.household_members WHERE household_id = old_hid AND user_id <> auth.uid();
    IF other_members > 0 THEN RAISE EXCEPTION 'Você já compartilha outra conta. Saia dela antes de aceitar.'; END IF;
    SELECT EXISTS (SELECT 1 FROM public.transactions WHERE household_id = old_hid)
        OR EXISTS (SELECT 1 FROM public.credit_cards WHERE household_id = old_hid)
        OR EXISTS (SELECT 1 FROM public.categories WHERE household_id = old_hid)
        OR EXISTS (SELECT 1 FROM public.contracts WHERE household_id = old_hid)
        OR EXISTS (SELECT 1 FROM public.people WHERE household_id = old_hid) INTO has_data;
    IF has_data AND NOT _migrate_data THEN RAISE EXCEPTION 'HAS_DATA'; END IF;
    IF has_data THEN
      UPDATE public.transactions SET household_id = inv.household_id WHERE household_id = old_hid;
      UPDATE public.credit_cards SET household_id = inv.household_id WHERE household_id = old_hid;
      UPDATE public.categories SET household_id = inv.household_id WHERE household_id = old_hid;
      UPDATE public.contracts SET household_id = inv.household_id WHERE household_id = old_hid;
      UPDATE public.people SET household_id = inv.household_id WHERE household_id = old_hid;
    END IF;
    DELETE FROM public.household_members WHERE household_id = old_hid AND user_id = auth.uid();
    DELETE FROM public.households WHERE id = old_hid;
  END IF;

  INSERT INTO public.household_members(household_id, user_id, role) VALUES (inv.household_id, auth.uid(), 'member');
  UPDATE public.household_invites SET accepted_at = now() WHERE id = inv.id;
  RETURN inv.household_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_household_invite(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ensure_household() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.accept_household_invite(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_household() TO authenticated;
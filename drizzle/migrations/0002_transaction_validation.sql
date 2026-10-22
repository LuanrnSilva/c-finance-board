ALTER TABLE public.transactions
  ADD COLUMN status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','disputed')),
  ADD COLUMN validated_by uuid,
  ADD COLUMN validated_at timestamptz,
  ADD COLUMN dispute_note text;

CREATE OR REPLACE FUNCTION public.household_member_count(_household_id uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.household_members WHERE household_id = _household_id
$$;

CREATE OR REPLACE FUNCTION public.transactions_status_on_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.type = 'expense' AND public.household_member_count(NEW.household_id) > 1 THEN
    NEW.status := 'pending';
  ELSE
    NEW.status := 'confirmed';
  END IF;
  NEW.validated_by := NULL; NEW.validated_at := NULL; NEW.dispute_note := NULL;
  RETURN NEW;
END $$;
-- runs after set_household_* (alphabetical order: "t" > "s")
CREATE TRIGGER transactions_status_insert BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.transactions_status_on_insert();

CREATE OR REPLACE FUNCTION public.transactions_status_on_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE validation_changed boolean; data_changed boolean;
BEGIN
  validation_changed := NEW.status IS DISTINCT FROM OLD.status
    OR NEW.validated_by IS DISTINCT FROM OLD.validated_by
    OR NEW.validated_at IS DISTINCT FROM OLD.validated_at
    OR NEW.dispute_note IS DISTINCT FROM OLD.dispute_note;
  data_changed := NEW.description IS DISTINCT FROM OLD.description
    OR NEW.amount IS DISTINCT FROM OLD.amount
    OR NEW.category IS DISTINCT FROM OLD.category
    OR NEW.date IS DISTINCT FROM OLD.date
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.credit_card_id IS DISTINCT FROM OLD.credit_card_id
    OR NEW.person_id IS DISTINCT FROM OLD.person_id;

  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  IF auth.uid() = OLD.user_id THEN
    -- creator cannot validate own entry; editing sends it back for review
    NEW.validated_by := OLD.validated_by; NEW.validated_at := OLD.validated_at;
    NEW.dispute_note := OLD.dispute_note; NEW.status := OLD.status;
    IF validation_changed AND NOT data_changed THEN
      RAISE EXCEPTION 'Você não pode validar o próprio lançamento';
    END IF;
    IF data_changed AND NEW.type = 'expense' AND public.household_member_count(NEW.household_id) > 1 THEN
      NEW.status := 'pending'; NEW.validated_by := NULL; NEW.validated_at := NULL;
    END IF;
  ELSIF validation_changed THEN
    IF NEW.status = 'disputed' AND coalesce(trim(NEW.dispute_note), '') = '' THEN
      RAISE EXCEPTION 'Informe o motivo da contestação';
    END IF;
    IF NEW.status = 'confirmed' THEN NEW.dispute_note := NULL; END IF;
    NEW.validated_by := auth.uid(); NEW.validated_at := now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER transactions_status_update BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.transactions_status_on_update();
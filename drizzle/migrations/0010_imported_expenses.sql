CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL DEFAULT public.current_household_id() REFERENCES public.households(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  due_day integer CHECK (due_day BETWEEN 1 AND 31),
  responsible text,
  source text,
  type text NOT NULL CHECK (type IN ('avulsa','parcelada','recorrente')),
  installment_current integer,
  installment_total integer,
  start_month text CHECK (start_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  end_month text CHECK (end_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (type <> 'parcelada' OR (installment_total >= 1 AND installment_current BETWEEN 1 AND installment_total))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members select expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_household_member(household_id));
CREATE POLICY "members insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.is_household_member(household_id) AND created_by = auth.uid());
CREATE POLICY "members update expenses" ON public.expenses FOR UPDATE TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
CREATE POLICY "members delete expenses" ON public.expenses FOR DELETE TO authenticated USING (public.is_household_member(household_id));

CREATE TABLE public.expense_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  month date NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  UNIQUE (expense_id, month)
);
GRANT SELECT, UPDATE ON public.expense_occurrences TO authenticated;
GRANT ALL ON public.expense_occurrences TO service_role;
ALTER TABLE public.expense_occurrences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members select occurrences" ON public.expense_occurrences FOR SELECT TO authenticated USING (public.is_household_member(household_id));
CREATE POLICY "members update occurrences" ON public.expense_occurrences FOR UPDATE TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));

CREATE OR REPLACE FUNCTION public.generate_expense_occurrences()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _start date := COALESCE(to_date(NEW.start_month, 'YYYY-MM'), date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo'))::date);
  _end date;
BEGIN
  IF NEW.type = 'parcelada' THEN
    _end := (_start + make_interval(months => NEW.installment_total - NEW.installment_current))::date;
  ELSIF NEW.type = 'recorrente' THEN
    _end := COALESCE(to_date(NEW.end_month, 'YYYY-MM'), (_start + interval '11 months')::date);
  ELSE
    _end := _start;
  END IF;
  IF _end < _start THEN RAISE EXCEPTION 'Mês final anterior ao inicial em "%"', NEW.description; END IF;
  INSERT INTO public.expense_occurrences (expense_id, household_id, month)
  SELECT NEW.id, NEW.household_id, m::date FROM generate_series(_start, _end, interval '1 month') m
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER expenses_generate_occurrences AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.generate_expense_occurrences();
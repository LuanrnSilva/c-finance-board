CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category text NOT NULL,
  monthly_limit numeric(12,2) NOT NULL CHECK (monthly_limit >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household select" ON public.budgets FOR SELECT TO authenticated USING (public.is_household_member(household_id));
CREATE POLICY "Household insert" ON public.budgets FOR INSERT TO authenticated WITH CHECK (public.is_household_member(household_id));
CREATE POLICY "Household update" ON public.budgets FOR UPDATE TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
CREATE POLICY "Household delete" ON public.budgets FOR DELETE TO authenticated USING (public.is_household_member(household_id));
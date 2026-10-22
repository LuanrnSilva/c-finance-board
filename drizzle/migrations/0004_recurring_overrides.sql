CREATE TABLE public.recurring_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  normalized_description text NOT NULL,
  category text NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed','ignored')),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, normalized_description, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_overrides TO authenticated;
GRANT ALL ON public.recurring_overrides TO service_role;
ALTER TABLE public.recurring_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household select" ON public.recurring_overrides FOR SELECT TO authenticated USING (public.is_household_member(household_id));
CREATE POLICY "Household insert" ON public.recurring_overrides FOR INSERT TO authenticated WITH CHECK (public.is_household_member(household_id) AND created_by = auth.uid());
CREATE POLICY "Household update" ON public.recurring_overrides FOR UPDATE TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
CREATE POLICY "Household delete" ON public.recurring_overrides FOR DELETE TO authenticated USING (public.is_household_member(household_id));
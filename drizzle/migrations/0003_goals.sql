CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0),
  deadline date,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false
);
CREATE TABLE public.goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount <> 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX goal_contributions_goal_idx ON public.goal_contributions(goal_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals, public.goal_contributions TO authenticated;
GRANT ALL ON public.goals, public.goal_contributions TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household select" ON public.goals FOR SELECT TO authenticated USING (public.is_household_member(household_id));
CREATE POLICY "Household insert" ON public.goals FOR INSERT TO authenticated WITH CHECK (public.is_household_member(household_id) AND created_by = auth.uid());
CREATE POLICY "Household update" ON public.goals FOR UPDATE TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
CREATE POLICY "Household delete" ON public.goals FOR DELETE TO authenticated USING (public.is_household_member(household_id));

CREATE POLICY "Household select" ON public.goal_contributions FOR SELECT TO authenticated USING (public.is_household_member(household_id));
CREATE POLICY "Household insert" ON public.goal_contributions FOR INSERT TO authenticated WITH CHECK (
  public.is_household_member(household_id) AND created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.household_id = goal_contributions.household_id));
CREATE POLICY "Household update" ON public.goal_contributions FOR UPDATE TO authenticated USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
CREATE POLICY "Household delete" ON public.goal_contributions FOR DELETE TO authenticated USING (public.is_household_member(household_id));
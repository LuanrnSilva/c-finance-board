-- Create people table
CREATE TABLE public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own people" ON public.people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own people" ON public.people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own people" ON public.people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own people" ON public.people FOR DELETE USING (auth.uid() = user_id);

-- Add person_id to transactions
ALTER TABLE public.transactions ADD COLUMN person_id UUID REFERENCES public.people(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
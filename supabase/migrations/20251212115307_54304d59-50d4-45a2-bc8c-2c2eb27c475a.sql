-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'financing', 'consortium', 'loan'
  total_value NUMERIC NOT NULL DEFAULT 0,
  installment_value NUMERIC NOT NULL DEFAULT 0,
  total_installments INTEGER NOT NULL DEFAULT 0,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own contracts" 
ON public.contracts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts" 
ON public.contracts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts" 
ON public.contracts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts" 
ON public.contracts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
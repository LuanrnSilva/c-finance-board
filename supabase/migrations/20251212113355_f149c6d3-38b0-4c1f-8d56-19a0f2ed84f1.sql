-- Add installment columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN installment_current INTEGER DEFAULT NULL,
ADD COLUMN installment_total INTEGER DEFAULT NULL;
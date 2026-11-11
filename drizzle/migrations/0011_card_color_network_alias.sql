ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS color text, ADD COLUMN IF NOT EXISTS network text, ADD COLUMN IF NOT EXISTS alias text;
ALTER TABLE public.credit_cards ADD CONSTRAINT credit_cards_color_hex CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$');
ALTER TABLE public.credit_cards ADD CONSTRAINT credit_cards_alias_len CHECK (alias IS NULL OR char_length(alias) BETWEEN 1 AND 20);
CREATE UNIQUE INDEX IF NOT EXISTS credit_cards_household_alias_uq ON public.credit_cards (household_id, lower(alias)) WHERE alias IS NOT NULL;
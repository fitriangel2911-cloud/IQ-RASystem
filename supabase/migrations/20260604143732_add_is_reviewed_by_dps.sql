-- Supabase Migration: Add is_reviewed_by_dps
ALTER TABLE public.financing_contracts
ADD COLUMN IF NOT EXISTS is_reviewed_by_dps BOOLEAN DEFAULT false;

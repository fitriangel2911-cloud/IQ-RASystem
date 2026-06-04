-- ==========================================================
-- SQL MIGRATION: SPECIAL SAVINGS & COA
-- Adds 'haji' and 'umrah' to savings_accounts types and 
-- adds specific COA codes for these savings.
-- ==========================================================

-- 1. Add COA for Simpanan Haji and Umrah
INSERT INTO public.coa_accounts (code, name, category) VALUES
('302020', 'Simpanan Haji Khusus', 'Dana Syirkah Temporer'),
('302030', 'Simpanan Umrah', 'Dana Syirkah Temporer')
ON CONFLICT (code) DO NOTHING;

-- 2. Modify constraint on savings_accounts.account_type
-- Supabase/PostgreSQL way to update a CHECK constraint
ALTER TABLE public.savings_accounts DROP CONSTRAINT IF EXISTS savings_accounts_account_type_check;

ALTER TABLE public.savings_accounts 
  ADD CONSTRAINT savings_accounts_account_type_check 
  CHECK (account_type IN ('pokok', 'wajib', 'wadiah', 'mudharabah', 'haji', 'umrah'));

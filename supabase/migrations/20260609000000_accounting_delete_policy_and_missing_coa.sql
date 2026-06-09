-- ==========================================================
-- SQL MIGRATION: ACCOUNTING DELETE POLICY & MISSING COA SEED
-- ==========================================================

-- 1. Seed missing ZISWAF and Non-Halal COA accounts
INSERT INTO public.coa_accounts (code, name, category, normal_balance) VALUES
('220002', 'Titipan ZISWAF', 'Liabilitas', 'Kredit'),
('220003', 'Titipan Dana Sosial / Non-Halal', 'Liabilitas', 'Kredit')
ON CONFLICT (code) DO NOTHING;

-- 2. Drop existing delete policy if exists and create one for journal_entries
DROP POLICY IF EXISTS "Accounting delete journals" ON public.journal_entries;
CREATE POLICY "Accounting delete journals" ON public.journal_entries
    FOR DELETE TO authenticated
    USING (public.check_user_role_in(ARRAY['accounting', 'super_admin']));

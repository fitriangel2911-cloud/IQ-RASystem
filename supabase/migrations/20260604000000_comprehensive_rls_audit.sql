-- ==========================================================
-- SQL MIGRATION: COMPREHENSIVE RLS AUDIT & SECURITY FIX
-- This migration hardens Row Level Security (RLS) across all 
-- operational tables for the 7 system roles.
-- ==========================================================

-- Enable RLS on all operational tables just in case they aren't
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teller_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharia_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;

-- Helper function to check role safely
CREATE OR REPLACE FUNCTION public.check_user_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_user_role_in(required_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 1. MEMBERS (CIF)
-- CS: CRUD, AO: Read, Manager: Read, Member: Read own
-- ==========================================
DROP POLICY IF EXISTS "Members can view own profile" ON public.members;
CREATE POLICY "Members can view own profile" ON public.members
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can view all members" ON public.members;
CREATE POLICY "Staff can view all members" ON public.members
    FOR SELECT TO authenticated 
    USING (public.check_user_role_in(ARRAY['customer_service', 'account_officer', 'manager', 'teller', 'super_admin']));

DROP POLICY IF EXISTS "CS can manage members" ON public.members;
CREATE POLICY "CS can manage members" ON public.members
    FOR ALL TO authenticated 
    USING (public.check_user_role_in(ARRAY['customer_service', 'super_admin']));

-- ==========================================
-- 2. SAVINGS ACCOUNTS
-- Member: Read own, Teller: CRUD, CS: Insert/Read
-- ==========================================
DROP POLICY IF EXISTS "Members view own savings" ON public.savings_accounts;
CREATE POLICY "Members view own savings" ON public.savings_accounts
    FOR SELECT TO authenticated 
    USING (member_id = auth.uid());

DROP POLICY IF EXISTS "Staff manage savings" ON public.savings_accounts;
CREATE POLICY "Staff manage savings" ON public.savings_accounts
    FOR ALL TO authenticated 
    USING (public.check_user_role_in(ARRAY['teller', 'customer_service', 'manager', 'super_admin']));

-- ==========================================
-- 3. SAVINGS TRANSACTIONS
-- Member: Read own, Teller: CRUD
-- ==========================================
DROP POLICY IF EXISTS "Members view own transactions" ON public.savings_transactions;
CREATE POLICY "Members view own transactions" ON public.savings_transactions
    FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.savings_accounts WHERE id = account_id AND member_id = auth.uid()));

DROP POLICY IF EXISTS "Teller manage transactions" ON public.savings_transactions;
CREATE POLICY "Teller manage transactions" ON public.savings_transactions
    FOR ALL TO authenticated 
    USING (public.check_user_role_in(ARRAY['teller', 'manager', 'super_admin']));

-- ==========================================
-- 4. JOURNAL ENTRIES
-- Accounting: CRUD, Teller/CS: Insert
-- ==========================================
DROP POLICY IF EXISTS "Staff view journals" ON public.journal_entries;
CREATE POLICY "Staff view journals" ON public.journal_entries
    FOR SELECT TO authenticated 
    USING (public.check_user_role_in(ARRAY['accounting', 'manager', 'super_admin', 'teller', 'customer_service']));

DROP POLICY IF EXISTS "System insert journals" ON public.journal_entries;
CREATE POLICY "System insert journals" ON public.journal_entries
    FOR INSERT TO authenticated 
    WITH CHECK (public.check_user_role_in(ARRAY['accounting', 'teller', 'customer_service', 'super_admin']));

DROP POLICY IF EXISTS "Accounting update journals" ON public.journal_entries;
CREATE POLICY "Accounting update journals" ON public.journal_entries
    FOR UPDATE TO authenticated 
    USING (public.check_user_role_in(ARRAY['accounting', 'super_admin']));

-- ==========================================
-- 5. FINANCING CONTRACTS
-- Member: Read own, AO/Manager: CRUD, Teller: Read/Update
-- ==========================================
DROP POLICY IF EXISTS "Members view own contracts" ON public.financing_contracts;
CREATE POLICY "Members view own contracts" ON public.financing_contracts
    FOR SELECT TO authenticated 
    USING (member_id = auth.uid());

DROP POLICY IF EXISTS "Staff manage contracts" ON public.financing_contracts;
CREATE POLICY "Staff manage contracts" ON public.financing_contracts
    FOR ALL TO authenticated 
    USING (public.check_user_role_in(ARRAY['account_officer', 'manager', 'dps', 'super_admin', 'teller']));

-- ==========================================
-- 6. PROSPECTS
-- AO/Manager: CRUD
-- ==========================================
DROP POLICY IF EXISTS "AO Manager manage prospects" ON public.prospects;
CREATE POLICY "AO Manager manage prospects" ON public.prospects
    FOR ALL TO authenticated 
    USING (public.check_user_role_in(ARRAY['account_officer', 'manager', 'super_admin']));

-- ==========================================
-- 7. TELLER SHIFTS
-- Teller: CRUD own, Manager: Read
-- ==========================================
DROP POLICY IF EXISTS "Teller manage own shifts" ON public.teller_shifts;
CREATE POLICY "Teller manage own shifts" ON public.teller_shifts
    FOR ALL TO authenticated 
    USING (teller_id = auth.uid());

DROP POLICY IF EXISTS "Manager view shifts" ON public.teller_shifts;
CREATE POLICY "Manager view shifts" ON public.teller_shifts
    FOR SELECT TO authenticated 
    USING (public.check_user_role_in(ARRAY['manager', 'accounting', 'super_admin']));

-- ==========================================
-- 8. SHARIA KNOWLEDGE & SYSTEM PARAMS
-- Read: All authenticated, Write: Super Admin / DPS
-- ==========================================
DROP POLICY IF EXISTS "All read sharia" ON public.sharia_knowledge;
CREATE POLICY "All read sharia" ON public.sharia_knowledge FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "DPS manage sharia" ON public.sharia_knowledge;
CREATE POLICY "DPS manage sharia" ON public.sharia_knowledge FOR ALL TO authenticated USING (public.check_user_role_in(ARRAY['dps', 'super_admin']));

DROP POLICY IF EXISTS "All read params" ON public.system_parameters;
CREATE POLICY "All read params" ON public.system_parameters FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage params" ON public.system_parameters;
CREATE POLICY "Admin manage params" ON public.system_parameters FOR ALL TO authenticated USING (public.check_user_role('super_admin'));

-- ==========================================================
-- SQL MIGRATION: MISSING TABLES & COA NORMAL BALANCE PATCH
-- Creates members and access_rules tables, and updates coa_accounts.
-- ==========================================================

-- 1. Create members table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    nik TEXT UNIQUE,
    mother_name TEXT,
    religion TEXT DEFAULT 'Islam',
    occupation TEXT,
    monthly_income NUMERIC DEFAULT 0,
    phone_number TEXT,
    ktp_address TEXT,
    domicile_address TEXT,
    birth_place_date TEXT,
    gender TEXT,
    marital_status TEXT,
    citizenship TEXT DEFAULT 'WNI',
    company_name TEXT,
    funding_source TEXT,
    heir_name TEXT,
    heir_relationship TEXT,
    heir_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create access_rules table
CREATE TABLE IF NOT EXISTS public.access_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    responsibility TEXT,
    authority_scope TEXT,
    limitations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add normal_balance to coa_accounts
ALTER TABLE public.coa_accounts
ADD COLUMN IF NOT EXISTS normal_balance TEXT CHECK (normal_balance IN ('Debit', 'Kredit')) DEFAULT 'Debit';

-- Populate normal balance logically based on COA prefix
UPDATE public.coa_accounts
SET normal_balance = CASE
    WHEN code LIKE '19%' THEN 'Kredit' -- Kontra-Aset (Akumulasi Penyusutan, CKPN)
    WHEN code LIKE '1%' THEN 'Debit'   -- Aset
    WHEN code LIKE '2%' THEN 'Kredit'  -- Liabilitas
    WHEN code LIKE '3%' THEN 'Kredit'  -- Dana Syirkah
    WHEN code LIKE '4%' THEN 'Kredit'  -- Ekuitas
    WHEN code LIKE '5%' THEN 'Kredit'  -- Pendapatan
    WHEN code LIKE '6%' THEN 'Debit'   -- Hak Pihak Ketiga atas Bagi Hasil (Beban)
    WHEN code LIKE '7%' THEN 'Debit'   -- Beban
    ELSE 'Debit'
END;

-- 4. Enable RLS and Policies for new tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_rules ENABLE ROW LEVEL SECURITY;

-- Members policy
DROP POLICY IF EXISTS "Users can view own member profile" ON public.members;
CREATE POLICY "Users can view own member profile" ON public.members FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'teller', 'customer_service', 'accounting', 'manager', 'account_officer')
    )
);

DROP POLICY IF EXISTS "Staff can manage members" ON public.members;
CREATE POLICY "Staff can manage members" ON public.members FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'teller', 'customer_service', 'accounting', 'manager', 'account_officer')
    )
);

-- Access rules policy
DROP POLICY IF EXISTS "Anyone can read access rules" ON public.access_rules;
CREATE POLICY "Anyone can read access rules" ON public.access_rules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Super admin can manage access rules" ON public.access_rules;
CREATE POLICY "Super admin can manage access rules" ON public.access_rules FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super_admin')
);

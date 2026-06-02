-- ==========================================================
-- MASTER SQL PATCH: IQ-RA SYSTEM
-- Jalankan script ini di Supabase Studio > SQL Editor
-- Script ini AMAN: tidak menghapus data apapun yang sudah ada
-- Hanya menambah tabel / kolom / kebijakan yang belum ada
-- ==========================================================

-- ----------------------------------------
-- 1. TABEL: members (jika belum ada)
-- ----------------------------------------
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
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
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

-- ----------------------------------------
-- 2. TABEL: access_rules (jika belum ada)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.access_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    responsibility TEXT,
    authority_scope TEXT,
    limitations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.access_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read access rules" ON public.access_rules;
CREATE POLICY "Anyone can read access rules" ON public.access_rules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Super admin can manage access rules" ON public.access_rules;
CREATE POLICY "Super admin can manage access rules" ON public.access_rules FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super_admin')
);

-- ----------------------------------------
-- 3. TABEL: notifications (jika belum ada)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----------------------------------------
-- 4. KOLOM: normal_balance di coa_accounts (jika belum ada)
-- ----------------------------------------
ALTER TABLE public.coa_accounts
    ADD COLUMN IF NOT EXISTS normal_balance TEXT
        CHECK (normal_balance IN ('Debit', 'Kredit'))
        DEFAULT 'Debit';

UPDATE public.coa_accounts
SET normal_balance = CASE
    WHEN code LIKE '19%' THEN 'Kredit'
    WHEN code LIKE '1%'  THEN 'Debit'
    WHEN code LIKE '2%'  THEN 'Kredit'
    WHEN code LIKE '3%'  THEN 'Kredit'
    WHEN code LIKE '4%'  THEN 'Kredit'
    WHEN code LIKE '5%'  THEN 'Kredit'
    WHEN code LIKE '6%'  THEN 'Debit'
    WHEN code LIKE '7%'  THEN 'Debit'
    ELSE 'Debit'
END
WHERE normal_balance IS NULL;

-- ----------------------------------------
-- 5. ROLE: tambahkan 'super_admin' dan 'dps' ke constraint (jika belum ada)
-- ----------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('teller', 'customer_service', 'account_officer', 'manager', 'accounting', 'super_admin', 'member', 'dps'));

-- ==========================================================
-- SELESAI. Semua tabel yang diperlukan sudah tersedia.
-- Tidak ada data yang dihapus.
-- ==========================================================

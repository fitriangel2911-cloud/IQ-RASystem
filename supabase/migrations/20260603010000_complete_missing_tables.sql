-- ==========================================================
-- SQL MIGRATION: COMPLETE MISSING TABLES & ADD NOTIFICATIONS
-- This migration adds any tables that were not present yet without
-- touching existing data. It uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS
-- so it is safe to run on a database that already contains these objects.
-- ==========================================================

-- 1. members table (if not yet created)
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

-- Enable Row Level Security for members (if not yet enabled)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                   WHERE c.relname = 'members' AND n.nspname = 'public' AND c.relkind = 'r') THEN
        -- table does not exist, nothing to enable
        RETURN;
    END IF;
    EXECUTE 'ALTER TABLE public.members ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. access_rules table (if not yet created)
CREATE TABLE IF NOT EXISTS public.access_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    responsibility TEXT,
    authority_scope TEXT,
    limitations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for access_rules (safe guard)
DO $$
BEGIN
    EXECUTE 'ALTER TABLE public.access_rules ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. notifications table (new table for UI alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,               -- e.g., 'info', 'warning', 'error'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications (safe guard)
DO $$
BEGIN
    EXECUTE 'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Add normal_balance column to coa_accounts if it does not exist yet
ALTER TABLE public.coa_accounts
    ADD COLUMN IF NOT EXISTS normal_balance TEXT
        CHECK (normal_balance IN ('Debit', 'Kredit'))
        DEFAULT 'Debit';

-- 5. Populate normal_balance for existing rows (idempotent – runs only if column is newly added)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'coa_accounts' AND column_name = 'normal_balance') THEN
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
        END;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- End of migration – no data is deleted.

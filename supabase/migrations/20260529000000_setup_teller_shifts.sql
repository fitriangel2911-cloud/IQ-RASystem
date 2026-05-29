-- ==========================================================
-- SQL MIGRATION: SETUP TELLER SHIFTS
-- Creates the table to track teller shift history and balances.
-- ==========================================================

-- 1. Create teller_shifts table
CREATE TABLE IF NOT EXISTS public.teller_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    teller_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('aktif', 'tutup')) NOT NULL DEFAULT 'aktif',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    cash_in NUMERIC NOT NULL DEFAULT 0,
    cash_system_end NUMERIC DEFAULT 0,
    cash_physical_end NUMERIC DEFAULT 0,
    difference NUMERIC DEFAULT 0,
    difference_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row-Level Security
ALTER TABLE public.teller_shifts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Staff can view all shifts" ON public.teller_shifts;
CREATE POLICY "Staff can view all shifts"
ON public.teller_shifts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'teller', 'accounting', 'manager')
    )
);

DROP POLICY IF EXISTS "Tellers can manage their own shifts" ON public.teller_shifts;
CREATE POLICY "Tellers can manage their own shifts"
ON public.teller_shifts
FOR ALL
TO authenticated
USING (
    teller_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'accounting', 'manager')
    )
);

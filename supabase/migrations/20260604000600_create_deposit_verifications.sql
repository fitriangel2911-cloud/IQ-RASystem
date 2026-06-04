-- ==========================================================
-- SQL MIGRATION: DEPOSIT VERIFICATIONS
-- Stores pending online deposits waiting for CS approval
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.deposit_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payment_type VARCHAR(50) NOT NULL,
    target_account_type VARCHAR(50) NOT NULL,
    amount NUMERIC NOT NULL,
    admin_fee NUMERIC DEFAULT 0,
    infaq NUMERIC DEFAULT 0,
    unique_code NUMERIC DEFAULT 0,
    total_paid NUMERIC NOT NULL,
    reference_no VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deposit_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read own verifications
DROP POLICY IF EXISTS "Users can read own verifications" ON public.deposit_verifications;
CREATE POLICY "Users can read own verifications" ON public.deposit_verifications
    FOR SELECT TO authenticated USING (member_id = auth.uid());

-- Policy: Admin/CS can read all
DROP POLICY IF EXISTS "Admin can read all verifications" ON public.deposit_verifications;
CREATE POLICY "Admin can read all verifications" ON public.deposit_verifications
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.access_rules
        WHERE access_rules.user_id = auth.uid()
        AND access_rules.role IN ('super_admin', 'cs', 'manager', 'teller')
      )
    );

-- Policy: Admin/CS can update verifications
DROP POLICY IF EXISTS "Admin can update verifications" ON public.deposit_verifications;
CREATE POLICY "Admin can update verifications" ON public.deposit_verifications
    FOR UPDATE TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.access_rules
        WHERE access_rules.user_id = auth.uid()
        AND access_rules.role IN ('super_admin', 'cs', 'manager', 'teller')
      )
    );

-- Give access to anon and authenticated
GRANT ALL ON TABLE public.deposit_verifications TO anon, authenticated, service_role;

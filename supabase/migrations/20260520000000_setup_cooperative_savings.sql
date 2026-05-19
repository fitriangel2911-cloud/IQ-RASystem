-- ==========================================================
-- SQL MIGRATION: SETUP COOPERATIVE SAVINGS & ACCOUNTS
-- Creates tables to track cooperative member savings balances and transactions.
-- ==========================================================

-- 1. Create savings_accounts table
CREATE TABLE IF NOT EXISTS public.savings_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    account_number TEXT UNIQUE NOT NULL,
    account_type TEXT CHECK (account_type IN ('pokok', 'wajib', 'wadiah', 'mudharabah')),
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create savings_transactions table
CREATE TABLE IF NOT EXISTS public.savings_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.savings_accounts(id) ON DELETE CASCADE,
    transaction_type TEXT CHECK (transaction_type IN ('deposit', 'withdrawal')),
    amount NUMERIC NOT NULL,
    reference_no TEXT UNIQUE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for savings_accounts
DROP POLICY IF EXISTS "Users can view their own savings accounts" ON public.savings_accounts;
CREATE POLICY "Users can view their own savings accounts"
ON public.savings_accounts
FOR SELECT
TO authenticated
USING (
    member_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'teller', 'customer_service', 'accounting', 'manager')
    )
);

DROP POLICY IF EXISTS "Staff can manage all savings accounts" ON public.savings_accounts;
CREATE POLICY "Staff can manage all savings accounts"
ON public.savings_accounts
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'teller', 'customer_service', 'accounting', 'manager')
    )
);

-- 5. Create Policies for savings_transactions
DROP POLICY IF EXISTS "Users can view their own savings transactions" ON public.savings_transactions;
CREATE POLICY "Users can view their own savings transactions"
ON public.savings_transactions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.savings_accounts
        WHERE savings_accounts.id = savings_transactions.account_id
        AND savings_accounts.member_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'teller', 'customer_service', 'accounting', 'manager')
    )
);

DROP POLICY IF EXISTS "Staff can manage all savings transactions" ON public.savings_transactions;
CREATE POLICY "Staff can manage all savings transactions"
ON public.savings_transactions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'teller', 'customer_service', 'accounting', 'manager')
    )
);

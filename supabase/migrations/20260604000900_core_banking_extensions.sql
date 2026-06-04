-- 1. FINANCING SCHEDULES (Amortization)
CREATE TABLE IF NOT EXISTS financing_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES financing_contracts(id) ON DELETE CASCADE,
    member_id UUID REFERENCES users(id),
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    principal_amount NUMERIC DEFAULT 0,
    margin_amount NUMERIC DEFAULT 0,
    total_installment NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'paid', 'late')) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. WITHDRAWAL REQUESTS
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES users(id),
    account_id UUID REFERENCES savings_accounts(id),
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    reference_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant Access
GRANT ALL ON financing_schedules TO authenticated;
GRANT ALL ON financing_schedules TO service_role;
GRANT ALL ON withdrawal_requests TO authenticated;
GRANT ALL ON withdrawal_requests TO service_role;

-- RLS Policies
ALTER TABLE financing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own schedules" ON financing_schedules;
DROP POLICY IF EXISTS "Staff can view all schedules" ON financing_schedules;
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON withdrawal_requests;
DROP POLICY IF EXISTS "Staff can view all withdrawals" ON withdrawal_requests;

CREATE POLICY "Users can view their own schedules" ON financing_schedules FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Staff can view all schedules" ON financing_schedules FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND role IN ('teller', 'customer_service', 'manager', 'super_admin')));

CREATE POLICY "Users can view their own withdrawals" ON withdrawal_requests FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Users can insert their own withdrawals" ON withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = member_id);
CREATE POLICY "Staff can view all withdrawals" ON withdrawal_requests FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND role IN ('teller', 'customer_service', 'manager', 'super_admin')));

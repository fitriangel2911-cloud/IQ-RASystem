-- ==========================================================
-- SQL MIGRATION: SUPER ADMIN EXTENSIONS
-- Creates tables for audit logs, user activity tracking, COA accounts, and system tasks with appropriate RLS.
-- ==========================================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies for audit_logs
DROP POLICY IF EXISTS "Super Admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Super Admin can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Create user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for user_activities
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Create Policies for user_activities
DROP POLICY IF EXISTS "Super Admin can view user activities" ON public.user_activities;
CREATE POLICY "Super Admin can view user activities"
ON public.user_activities
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Authenticated users can insert user activities" ON public.user_activities;
CREATE POLICY "Authenticated users can insert user activities"
ON public.user_activities
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Create coa_accounts table
CREATE TABLE IF NOT EXISTS public.coa_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for coa_accounts
ALTER TABLE public.coa_accounts ENABLE ROW LEVEL SECURITY;

-- Create Policies for coa_accounts
DROP POLICY IF EXISTS "Anyone authenticated can view COA accounts" ON public.coa_accounts;
CREATE POLICY "Anyone authenticated can view COA accounts"
ON public.coa_accounts
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Super Admin can manage COA accounts" ON public.coa_accounts;
CREATE POLICY "Super Admin can manage COA accounts"
ON public.coa_accounts
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

-- 4. Create system_tasks table
CREATE TABLE IF NOT EXISTS public.system_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_to_email TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'PENDING' NOT NULL, -- PENDING, IN_PROGRESS, COMPLETED
    due_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for system_tasks
ALTER TABLE public.system_tasks ENABLE ROW LEVEL SECURITY;

-- Create Policies for system_tasks
DROP POLICY IF EXISTS "Anyone authenticated can view tasks" ON public.system_tasks;
CREATE POLICY "Anyone authenticated can view tasks"
ON public.system_tasks
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Super Admin and Manager can manage all tasks" ON public.system_tasks;
CREATE POLICY "Super Admin and Manager can manage all tasks"
ON public.system_tasks
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'manager')
    )
);

DROP POLICY IF EXISTS "Users can update their assigned tasks status" ON public.system_tasks;
CREATE POLICY "Users can update their assigned tasks status"
ON public.system_tasks
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

-- 5. Seed default COA accounts
INSERT INTO public.coa_accounts (code, name, category) VALUES
('110101', 'Kas Brankas', 'Aset'),
('110102', 'Kas Teller', 'Aset'),
('110201', 'Giro Bank A', 'Aset'),
('140001', 'Piutang Murabahah Anggota', 'Aset'),
('170001', 'Pembiayaan Mudharabah Anggota', 'Aset'),
('190002', 'CKPN Piutang Murabahah (-)', 'Kontra-Aset'),
('230001', 'Simpanan Wadiah Anggota', 'Liabilitas'),
('310001', 'Simpanan Mudharabah Anggota', 'Dana Syirkah'),
('400001', 'Simpanan Pokok', 'Ekuitas'),
('400002', 'Simpanan Wajib', 'Ekuitas'),
('400009', 'SHU Tahun Berjalan', 'Ekuitas'),
('510001', 'Pendapatan Murabahah - Margin', 'Pendapatan'),
('510004', 'Pendapatan Mudharabah', 'Pendapatan'),
('520001', 'Pendapatan Administrasi Pembiayaan', 'Pendapatan'),
('600001', 'Bagi Hasil Simpanan Mudharabah', 'Bagi Hasil'),
('710002', 'Beban CKPN Murabahah', 'Beban'),
('720001', 'Gaji/Honor', 'Beban'),
('730001', 'Beban Listrik dan Air', 'Beban')
ON CONFLICT (code) DO NOTHING;

-- 6. Grant access to authenticated and service_role
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.user_activities TO authenticated;
GRANT ALL ON public.user_activities TO service_role;
GRANT ALL ON public.coa_accounts TO authenticated;
GRANT ALL ON public.coa_accounts TO service_role;
GRANT ALL ON public.system_tasks TO authenticated;
GRANT ALL ON public.system_tasks TO service_role;

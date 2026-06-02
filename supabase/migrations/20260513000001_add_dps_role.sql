-- ==========================================================
-- SQL MIGRATION: REGISTER DEWAN PENGAWAS SYARIAH (DPS) ROLE
-- Updates CHECK constraint to allow the 'dps' enum state
-- Uses super_admin (renamed from super_user) to match existing data
-- ==========================================================

-- 1. Drop existing role check constraint (if exists under default naming)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Re-apply check constraint including new 'dps' role type
--    Note: Uses super_admin (not super_user) to avoid constraint violation on existing data
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('teller', 'customer_service', 'account_officer', 'manager', 'accounting', 'super_admin', 'member', 'dps'));

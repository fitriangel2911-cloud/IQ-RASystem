-- ==========================================================
-- SQL MIGRATION: REGISTER DEWAN PENGAWAS SYARIAH (DPS) ROLE
-- Updates CHECK constraint to allow the 'dps' enum state
-- ==========================================================

-- 1. Drop existing role check constraint (if exists under default naming)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Re-apply check constraint including new 'dps' role type
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('teller', 'customer_service', 'account_officer', 'manager', 'accounting', 'super_user', 'member', 'dps'));

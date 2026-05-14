-- ==========================================================
-- SQL MIGRATION: RENAME SUPER_USER TO SUPER_ADMIN
-- Updates both the data, the CHECK constraint, and the auto-confirm trigger function.
-- ==========================================================

-- 1. Drop existing role check constraint (WAJIB dilakukan sebelum update data agar tidak kena Error 23514)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Update existing data dari 'super_user' menjadi 'super_admin'
UPDATE public.users 
SET role = 'super_admin' 
WHERE role = 'super_user';

-- 3. Re-apply check constraint baru dengan 'super_admin'
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('teller', 'customer_service', 'account_officer', 'manager', 'accounting', 'super_admin', 'member', 'dps'));

-- 4. Update the auto-confirm function to recognize 'super_admin'
CREATE OR REPLACE FUNCTION public.auto_confirm_staff_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger rule: Only activate if the role is explicitly a management/staff tier
  -- Replaced 'super_user' with 'super_admin'
  IF NEW.role IN ('super_admin', 'manager', 'account_officer', 'accounting', 'customer_service', 'teller') THEN
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

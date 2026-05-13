-- ==========================================================
-- SQL MIGRATION: AUTO-CONFIRM STAFF USERS ONLY
-- Automatically activates email verification for staff roles,
-- while leaving member accounts requiring standard activation.
-- ==========================================================

-- 1. Create function with SECURITY DEFINER to bypass standard schema privileges safely
CREATE OR REPLACE FUNCTION public.auto_confirm_staff_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger rule: Only activate if the role is explicitly a management/staff tier
  IF NEW.role IN ('super_user', 'manager', 'account_officer', 'accounting', 'customer_service', 'teller') THEN
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the trigger to public.users AFTER an admin inserts the user's custom profile
DROP TRIGGER IF EXISTS tr_auto_confirm_staff ON public.users;
CREATE TRIGGER tr_auto_confirm_staff
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_staff_account();

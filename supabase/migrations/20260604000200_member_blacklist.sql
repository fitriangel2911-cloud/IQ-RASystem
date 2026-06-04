-- ==========================================================
-- SQL MIGRATION: PI CHECKING / INTERNAL BLACKLIST
-- Adds blacklist flags to members table for risk mitigation.
-- ==========================================================

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blacklist_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blacklist_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Log audit trigger function for blacklist changes
CREATE OR REPLACE FUNCTION audit_blacklist_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.is_blacklisted = true AND OLD.is_blacklisted = false) THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            auth.uid(),
            'MEMBER_BLACKLISTED',
            'members',
            NEW.id,
            jsonb_build_object('reason', NEW.blacklist_reason, 'timestamp', now())
        );
    ELSIF (NEW.is_blacklisted = false AND OLD.is_blacklisted = true) THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            auth.uid(),
            'MEMBER_WHITELISTED',
            'members',
            NEW.id,
            jsonb_build_object('timestamp', now())
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger
DROP TRIGGER IF EXISTS tr_audit_blacklist ON public.members;
CREATE TRIGGER tr_audit_blacklist
AFTER UPDATE ON public.members
FOR EACH ROW
WHEN (OLD.is_blacklisted IS DISTINCT FROM NEW.is_blacklisted)
EXECUTE FUNCTION audit_blacklist_change();

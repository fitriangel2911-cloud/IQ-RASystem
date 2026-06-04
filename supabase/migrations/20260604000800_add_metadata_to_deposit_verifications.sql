-- Add metadata column to store split payment details for bundled registrations
ALTER TABLE public.deposit_verifications
ADD COLUMN IF NOT EXISTS metadata JSONB;

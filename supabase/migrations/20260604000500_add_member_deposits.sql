-- ==========================================================
-- SQL MIGRATION: MEMBER DEPOSITS TRACKING
-- Adds columns to track payment of principal & mandatory deposits.
-- ==========================================================

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS paid_principal_deposit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_mandatory_deposit BOOLEAN DEFAULT false;

-- ==========================================================
-- SQL MIGRATION: ADD DESCRIPTION TO COA
-- ==========================================================

ALTER TABLE public.coa_accounts
ADD COLUMN IF NOT EXISTS description TEXT;

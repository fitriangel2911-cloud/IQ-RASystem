-- ==========================================================
-- SQL MIGRATION: EXTEND MEMBERS WITH KYC, APU-PPT & HEIR FIELDS
-- Adds additional fields to the members table for strict compliance.
-- ==========================================================

-- Add new columns if they do not exist
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS birth_place_date TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS citizenship TEXT DEFAULT 'WNI',
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS funding_source TEXT,
ADD COLUMN IF NOT EXISTS heir_name TEXT,
ADD COLUMN IF NOT EXISTS heir_relationship TEXT,
ADD COLUMN IF NOT EXISTS heir_phone TEXT;

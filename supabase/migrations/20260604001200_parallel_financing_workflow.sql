-- Supabase Migration: Parallel Financing Workflow
-- Adds columns to financing_contracts to support independent inputs from AO and DPS.

ALTER TABLE public.financing_contracts
ADD COLUMN IF NOT EXISTS collateral_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dps_advice JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_surveyed_by_ao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prospect_id UUID REFERENCES prospects(id); -- linking back to prospects just in case

-- Ensure RLS allows AO and Manager to read/write these fields
-- "Staff manage contracts" policy usually covers this, but we will make sure.

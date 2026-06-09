-- ==========================================================
-- SQL MIGRATION: ADD TENOR_MONTHS AND MEMBER_NAME TO FINANCING_CONTRACTS
-- ==========================================================

-- 1. Tambahkan kolom tenor_months (default 12) dan member_name pada tabel financing_contracts jika belum ada
ALTER TABLE public.financing_contracts
    ADD COLUMN IF NOT EXISTS tenor_months INTEGER DEFAULT 12,
    ADD COLUMN IF NOT EXISTS member_name TEXT;

-- 2. Bersihkan skema cache agar PostgREST membaca perubahan kolom ini segera
NOTIFY pgrst, 'reload schema';

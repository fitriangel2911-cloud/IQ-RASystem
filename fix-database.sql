-- ==========================================
-- SCRIPT KEAMANAN DATABASE IQ-RA SYSTEM (RLS AKTIF)
-- ==========================================
-- Script ini untuk mempertahankan keamanan (Row Level Security tetap AKTIF),
-- namun memberikan "kartu akses" (Policy) kepada user yang sudah login (Authenticated)
-- agar mereka bisa memasukkan dan mengubah data.
--
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih Project Anda -> Masuk ke menu SQL Editor (Ikon "</>")
-- 3. Copy semua kode di bawah ini, Paste, lalu klik "Run".
-- ==========================================

-- 1. Pastikan fitur keamanan (RLS) tetap AKTIF
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_contracts ENABLE ROW LEVEL SECURITY;

-- 2. Hapus aturan lama (jika ada) agar tidak bentrok
DROP POLICY IF EXISTS "Allow authenticated insert prospects" ON public.prospects;
DROP POLICY IF EXISTS "Allow authenticated select prospects" ON public.prospects;
DROP POLICY IF EXISTS "Allow authenticated update prospects" ON public.prospects;

DROP POLICY IF EXISTS "Allow authenticated insert contracts" ON public.financing_contracts;
DROP POLICY IF EXISTS "Allow authenticated select contracts" ON public.financing_contracts;
DROP POLICY IF EXISTS "Allow authenticated update contracts" ON public.financing_contracts;

-- 3. BUAT ATURAN BARU UNTUK TABEL PROSPEK
-- Mengizinkan user yang sudah login untuk Membaca, Memasukkan, dan Mengubah prospek
CREATE POLICY "Allow authenticated select prospects" 
ON public.prospects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert prospects" 
ON public.prospects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update prospects" 
ON public.prospects FOR UPDATE TO authenticated USING (true);


-- 4. BUAT ATURAN BARU UNTUK TABEL KONTRAK (FINANCING CONTRACTS)
-- Mengizinkan user yang sudah login untuk Membaca, Memasukkan, dan Mengubah kontrak
CREATE POLICY "Allow authenticated select contracts" 
ON public.financing_contracts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert contracts" 
ON public.financing_contracts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update contracts" 
ON public.financing_contracts FOR UPDATE TO authenticated USING (true);

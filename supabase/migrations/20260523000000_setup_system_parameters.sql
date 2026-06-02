-- ==========================================================
-- SQL MIGRATION: SETUP SYSTEM PARAMETERS
-- Creates the table for system parameters and seeds default cooperative settings.
-- ==========================================================

-- 1. Create system_parameters table
CREATE TABLE IF NOT EXISTS public.system_parameters (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for system_parameters
DROP POLICY IF EXISTS "Anyone can view system parameters" ON public.system_parameters;
CREATE POLICY "Anyone can view system parameters"
ON public.system_parameters
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Super Admin can manage system parameters" ON public.system_parameters;
CREATE POLICY "Super Admin can manage system parameters"
ON public.system_parameters
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

-- 3. Seed Default Cooperative Settings
INSERT INTO public.system_parameters (key, value, description)
VALUES 
  ('simpanan_pokok', '300000', 'Setoran awal pokok bagi setiap anggota baru Koperasi Syariah (Rupiah)'),
  ('simpanan_wajib', '50000', 'Setoran awal wajib yang dibayarkan anggota baru Koperasi Syariah (Rupiah)'),
  ('biaya_adm', '15000', 'Biaya administrasi pendaftaran untuk pembukaan rekening CIF baru (Rupiah)'),
  ('biaya_infaq', '10000', 'Nilai sumbangan dasar infaq & sedekah sukarela per transaksi registrasi (Rupiah)'),
  ('nisbah_mudharabah', '60', 'Porsi bagi hasil untuk nasabah/anggota pada skema tabungan mudharabah (%)'),
  ('min_syariah_score', '80', 'Ambang batas kelayakan/compliance akad syariah berdasarkan keputusan AI RAG (%)'),
  ('wa_api_url', 'https://api.whatsapp.example.com/send', 'Gateway URL API pihak ketiga untuk pengiriman pesan OTP dan bukti transaksi'),
  ('max_output_tokens', '4096', 'Batas output token penjelasan AI RAG'),
  ('unified_context_threshold', '120000', 'Batas kapasitas Window Konteks RAG dalam karakter'),
  ('supervisor_approval_limit', '5000000', 'Ambang batas penarikan kas teller untuk otorisasi supervisor (Rupiah)')
ON CONFLICT (key) DO NOTHING;


-- 1. PASTIKAN TABEL PROSPECTS MEMILIKI SEMUA KOLOM YANG DIBUTUHKAN
ALTER TABLE public.prospects 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS amount NUMERIC,
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS ao_id UUID,
ADD COLUMN IF NOT EXISTS ai_contract_type TEXT,
ADD COLUMN IF NOT EXISTS is_converted BOOLEAN DEFAULT FALSE;

-- HAPUS BATASAN STATUS (CHECK CONSTRAINT) KARENA KITA MENGGUNAKAN BAHASA INDONESIA
ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
ALTER TABLE public.financing_contracts DROP CONSTRAINT IF EXISTS financing_contracts_status_check;

-- 2. PASTIKAN TABEL FINANCING_CONTRACTS MEMILIKI SEMUA KOLOM
ALTER TABLE public.financing_contracts
ADD COLUMN IF NOT EXISTS member_id UUID,
ADD COLUMN IF NOT EXISTS prospect_id UUID,
ADD COLUMN IF NOT EXISTS member_name TEXT,
ADD COLUMN IF NOT EXISTS amount NUMERIC,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS disbursement_date TIMESTAMP WITH TIME ZONE;

-- 3. PERBAIKI KEBIJAKAN KEAMANAN (RLS) AGAR TIDAK MEMBLOKIR TRANSAKSI
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert prospects" ON public.prospects;
DROP POLICY IF EXISTS "Allow authenticated update prospects" ON public.prospects;
DROP POLICY IF EXISTS "Allow authenticated select prospects" ON public.prospects;

CREATE POLICY "Allow authenticated select prospects" ON public.prospects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert prospects" ON public.prospects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update prospects" ON public.prospects FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert contracts" ON public.financing_contracts;
DROP POLICY IF EXISTS "Allow authenticated update contracts" ON public.financing_contracts;
DROP POLICY IF EXISTS "Allow authenticated select contracts" ON public.financing_contracts;

CREATE POLICY "Allow authenticated select contracts" ON public.financing_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert contracts" ON public.financing_contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update contracts" ON public.financing_contracts FOR UPDATE TO authenticated USING (true);

-- 4. GRANT HAK AKSES PERMANEN KE ROLE AUTHENTICATED
GRANT ALL ON public.prospects TO authenticated;
GRANT ALL ON public.financing_contracts TO authenticated;
GRANT ALL ON public.prospects TO service_role;
GRANT ALL ON public.financing_contracts TO service_role;

-- Menyiapkan tabel prospects jika belum ada, atau memperbarui kolomnya
-- Digunakan untuk pipeline sebelum menjadi kontrak resmi

CREATE TABLE IF NOT EXISTS public.prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    amount NUMERIC NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'Analisis Kelayakan',
    ao_id UUID REFERENCES public.users(id),
    ai_recommendation JSONB, -- Menyimpan hasil analisis dari AIService
    is_converted BOOLEAN DEFAULT false, -- Menandai jika sudah jadi kontrak
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Memperbarui tabel financing_contracts untuk pencairan
ALTER TABLE public.financing_contracts 
ADD COLUMN IF NOT EXISTS prospect_id UUID REFERENCES public.prospects(id),
ADD COLUMN IF NOT EXISTS disbursement_date DATE,
ADD COLUMN IF NOT EXISTS installment_amount NUMERIC;

-- Izin Akses
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AO can manage their prospects" ON public.prospects;
CREATE POLICY "AO can manage their prospects" 
ON public.prospects 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'account_officer' OR users.role = 'super_admin')
  )
);

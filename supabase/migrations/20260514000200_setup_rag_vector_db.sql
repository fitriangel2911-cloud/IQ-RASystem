-- Mengaktifkan ekstensi pgvector untuk pencarian berbasis kecerdasan buatan (RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabel untuk menyimpan basis pengetahuan syariah (Fatwa DSN-MUI, SOP, dll)
CREATE TABLE IF NOT EXISTS public.sharia_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(1536), -- Dimensi standar untuk model OpenAI (ada-002 atau v3-small)
    category TEXT, -- Contoh: 'FATWA', 'SOP', 'REGULASI'
    source_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indeks IVFFlat untuk mempercepat pencarian kemiripan vektor
-- Note: Lists ditentukan berdasarkan jumlah data, 100 adalah default yang baik untuk ribuan baris awal
CREATE INDEX IF NOT EXISTS idx_sharia_knowledge_embedding ON public.sharia_knowledge 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Menambahkan kolom 'analysis_result' pada tabel applications (jika sudah ada)
-- Untuk menyimpan hasil rekomendasi AI secara permanen pada setiap pengajuan
ALTER TABLE IF EXISTS public.applications 
ADD COLUMN IF NOT EXISTS ai_recommendation JSONB;

-- Izin Akses: Hanya Super Admin dan AO yang bisa melihat/mencari
ALTER TABLE public.sharia_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staf can read knowledge base" ON public.sharia_knowledge;
CREATE POLICY "Staf can read knowledge base" 
ON public.sharia_knowledge 
FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Super Admin can manage knowledge base" ON public.sharia_knowledge;
CREATE POLICY "Super Admin can manage knowledge base" 
ON public.sharia_knowledge 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'super_admin'
  )
);

-- Add audit_metadata column to financing_contracts table
ALTER TABLE public.financing_contracts 
ADD COLUMN IF NOT EXISTS audit_metadata JSONB;

-- Drop check constraint on status if it exists, to support VERIFIED_HALAL and ANOMALY_REVISION
ALTER TABLE public.financing_contracts DROP CONSTRAINT IF EXISTS financing_contracts_status_check;

-- Ensure RLS is enabled and set policy to allow authenticated users to perform audits
ALTER TABLE public.financing_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DPS can update contracts for audit" ON public.financing_contracts;
CREATE POLICY "DPS can update contracts for audit" 
ON public.financing_contracts 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Update journal_entries RLS to allow DPS to perform purification journal entries
DROP POLICY IF EXISTS "Accounting can manage all journals" ON public.journal_entries;
DROP POLICY IF EXISTS "Accounting and DPS can manage journals" ON public.journal_entries;

CREATE POLICY "Accounting and DPS can manage journals" 
ON public.journal_entries 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'accounting' OR users.role = 'super_admin' OR users.role = 'dps')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'accounting' OR users.role = 'super_admin' OR users.role = 'dps')
  )
);

-- Perbaikan Skema Tabel sharia_knowledge untuk mengatasi konflik kolom (title vs source_title)
ALTER TABLE public.sharia_knowledge ADD COLUMN IF NOT EXISTS source_title TEXT;
ALTER TABLE public.sharia_knowledge ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.sharia_knowledge ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.sharia_knowledge ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);
ALTER TABLE public.sharia_knowledge ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Hapus batasan NOT NULL agar query insert dari API / Service tidak gagal
ALTER TABLE public.sharia_knowledge ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.sharia_knowledge ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.sharia_knowledge ALTER COLUMN content DROP NOT NULL;

-- Update sharia_knowledge RLS to allow both Super Admin and DPS to manage documents (Ingestion)
DROP POLICY IF EXISTS "Super Admin can manage knowledge base" ON public.sharia_knowledge;
DROP POLICY IF EXISTS "Super Admin and DPS can manage knowledge base" ON public.sharia_knowledge;

CREATE POLICY "Super Admin and DPS can manage knowledge base" 
ON public.sharia_knowledge 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'super_admin' OR users.role = 'dps')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'super_admin' OR users.role = 'dps')
  )
);

GRANT ALL ON public.sharia_knowledge TO authenticated;
GRANT ALL ON public.sharia_knowledge TO service_role;

-- Menambahkan kolom member_id ke journal_entries untuk pelacakan transaksi per anggota
-- Serta memastikan audit trail yang lebih baik untuk Core Banking

ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.members(id);

-- Indeks untuk mempercepat pencarian riwayat transaksi anggota
CREATE INDEX IF NOT EXISTS idx_journal_entries_member_id ON public.journal_entries(member_id);

-- Memastikan RLS memungkinkan Super Admin dan Accounting untuk membaca/menulis
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accounting can manage all journals" ON public.journal_entries;
CREATE POLICY "Accounting can manage all journals" 
ON public.journal_entries 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'accounting' OR users.role = 'super_admin')
  )
);

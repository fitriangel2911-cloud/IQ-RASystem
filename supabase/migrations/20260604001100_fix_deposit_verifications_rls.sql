-- Add INSERT policies for deposit_verifications
DROP POLICY IF EXISTS "Admin can insert verifications" ON public.deposit_verifications;
CREATE POLICY "Admin can insert verifications" ON public.deposit_verifications
    FOR INSERT TO authenticated WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE public.users.id = auth.uid()
        AND public.users.role IN ('super_admin', 'customer_service', 'manager', 'teller')
      )
    );

DROP POLICY IF EXISTS "Users can insert own verifications" ON public.deposit_verifications;
CREATE POLICY "Users can insert own verifications" ON public.deposit_verifications
    FOR INSERT TO authenticated WITH CHECK (member_id = auth.uid());

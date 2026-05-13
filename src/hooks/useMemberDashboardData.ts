'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function useMemberDashboardData() {
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    
    const supabase = createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      if (!isSilent) {
        router.push('/login');
      }
      return;
    }

    try {
      // 1. Fetch member profile linked to user
      const { data: prof, error: profErr } = await supabase
        .from('members')
        .select('*, users(full_name, email)')
        .eq('user_id', user.id)
        .single();

      if (profErr && profErr.code !== 'PGRST116') { // Code PGRST116 is when no row is found (no profile yet)
        throw new Error('Gagal mengambil data profil: ' + profErr.message);
      }

      // Store profile
      setProfile(prof || { user_id: user.id, user_email: user.email, users: { full_name: user.user_metadata?.full_name || 'Anggota', email: user.email } });

      // If profile doesn't exist physically yet, user won't have accounts/transactions/contracts yet.
      if (!prof) {
        setLoading(false);
        return;
      }

      // 2. Fetch all accounts for this member (Show All)
      const { data: acc, error: accErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('member_id', prof.id)
        .order('created_at', { ascending: false });
      if (accErr) throw new Error('Gagal mengambil data rekening: ' + accErr.message);
      setAccounts(acc || []);

      // 3. Fetch all transactions (Show All)
      const { data: tx, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', prof.id)
        .order('created_at', { ascending: false });
      if (txErr) throw new Error('Gagal mengambil data transaksi: ' + txErr.message);
      setTransactions(tx || []);

      // 4. Fetch all financing contracts (Show All)
      const { data: con, error: conErr } = await supabase
        .from('financing_contracts')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });
      if (conErr) throw new Error('Gagal mengambil data pengajuan: ' + conErr.message);
      setContracts(con || []);

    } catch (err: any) {
      console.error('Fetch Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();

    // Setting up the 1 minute auto-refresh interval (60000ms)
    const intervalId = setInterval(() => {
      fetchData(true); // Trigger silent refresh so UI loading state doesn't flicker
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  return {
    profile,
    accounts,
    transactions,
    contracts,
    loading,
    error,
    refetch: () => fetchData(false)
  };
}

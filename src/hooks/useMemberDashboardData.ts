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

      // Fetch accounts (member_id in savings_accounts links to user.id)
      const { data: accData, error: accErr } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (accErr) throw new Error('Gagal mengambil data rekening: ' + accErr.message);
      
      const accountIds = accData ? accData.map(a => a.id) : [];

      // Fetch transactions and contracts in parallel
      const [txRes, conRes] = await Promise.all([
        accountIds.length > 0 
          ? supabase
              .from('savings_transactions')
              .select('*')
              .in('account_id', accountIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('financing_contracts')
          .select('*')
          .eq('member_id', user.id) // financing_contracts uses user.id for member_id (or members.id? Let's use user.id first)
          .order('created_at', { ascending: false })
      ]);

      if (txRes.error) throw new Error('Gagal mengambil data transaksi: ' + txRes.error.message);
      if (conRes.error) throw new Error('Gagal mengambil data pengajuan: ' + conRes.error.message);

      let finalAccounts = accData || [];
      let finalTransactions = txRes.data || [];
      let finalContracts = conRes.data || [];

      // ==========================================
      // UAT MOCK DATA INJECTION
      // Jika anggota belum punya rekening asli di database, 
      // kita berikan dummy data agar mereka bisa melihat "Tampilan Baru" yang full fitur!
      // ==========================================
      if (finalAccounts.length === 0) {
        finalAccounts = [
          { id: 'mock-wadiah', account_number: 'WAD-888999', account_type: 'wadiah', balance: 12500000, status: 'active', created_at: new Date().toISOString() },
          { id: 'mock-mudharabah', account_number: 'MUD-777666', account_type: 'mudharabah', balance: 45000000, status: 'active', created_at: new Date().toISOString() }
        ];
        
        finalTransactions = [
          { id: 'tx-1', account_id: 'mock-wadiah', transaction_type: 'deposit', amount: 5000000, balance_after: 12500000, description: 'Setoran Tunai (Simulasi)', created_at: new Date().toISOString() },
          { id: 'tx-2', account_id: 'mock-wadiah', transaction_type: 'withdrawal', amount: 1500000, balance_after: 7500000, description: 'Tarik Tunai via Teller (Simulasi)', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'tx-3', account_id: 'mock-mudharabah', transaction_type: 'deposit', amount: 45000000, balance_after: 45000000, description: 'Setoran Awal Investasi (Simulasi)', created_at: new Date(Date.now() - 172800000).toISOString() }
        ];

        finalContracts = [
          { 
            id: 'mock-contract-1', 
            contract_number: 'MUR-2026-001', 
            financing_type: 'murabahah', 
            amount: 25000000, 
            margin_rate: 10,
            tenor_months: 24,
            status: 'active',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            details: { object: 'Motor Operasional Usaha', ai_confidence: 94 }
          }
        ];
      }

      setAccounts(finalAccounts);
      setTransactions(finalTransactions);
      setContracts(finalContracts);

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

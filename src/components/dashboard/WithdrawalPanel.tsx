'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WithdrawalPanelProps {
  profile: any;
  accounts: any[];
  onPaymentSuccess: () => void;
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function WithdrawalPanel({ profile, accounts, onPaymentSuccess }: WithdrawalPanelProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  // Eligible accounts for withdrawal (e.g. Wadiah, Mudharabah)
  const withdrawableAccounts = accounts.filter(a => ['wadiah', 'mudharabah'].includes(a.account_type));
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  useEffect(() => {
    if (withdrawableAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(withdrawableAccounts[0].id);
    }
  }, [withdrawableAccounts, selectedAccountId]);

  useEffect(() => {
    const fetchRequests = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('member_id', profile.user_id)
        .order('created_at', { ascending: false });
      setRequests(data || []);
    };
    fetchRequests();
  }, [profile.user_id]);

  const handleManualAmount = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    const numValue = Number(numeric);
    setAmount(numValue);
    setDisplayAmount(numeric ? numValue.toLocaleString('id-ID') : '');
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setMessage({ type: 'error', text: 'Pilih rekening sumber.' });
      return;
    }
    if (amount <= 0 || amount > selectedAccount.balance) {
      setMessage({ type: 'error', text: 'Nominal tidak valid atau saldo tidak mencukupi.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const refNo = `TRK-${Date.now()}`;
      
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          member_id: profile.user_id,
          account_id: selectedAccountId,
          amount: amount,
          status: 'pending',
          reference_no: refNo
        });

      if (error) throw error;

      setMessage({ type: 'success', text: `Berhasil mengajukan penarikan tunai sebesar ${fmt(amount)}. Menunggu konfirmasi pihak koperasi. Silakan datangi kantor Koperasi untuk proses selanjutnya.` });
      setAmount(0);
      setDisplayAmount('');
      
      // Refresh requests list
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('member_id', profile.user_id)
        .order('created_at', { ascending: false });
      setRequests(data || []);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Col 1: Form Pengajuan */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-primary)',
        borderRadius: '24px',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <h3 style={{ color: 'var(--gold-intense)', margin: 0, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Pengajuan Tarik Tunai
        </h3>

        {withdrawableAccounts.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Anda belum memiliki rekening Wadiah atau Mudharabah.</div>
        ) : (
          <form onSubmit={handleWithdrawalRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
                Pilih Rekening Sumber
              </label>
              <select 
                value={selectedAccountId} 
                onChange={(e) => setSelectedAccountId(e.target.value)}
                style={{
                  width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)',
                  borderRadius: '14px', padding: '16px', color: 'var(--text-primary)',
                  fontSize: '15px', fontWeight: 800, outline: 'none'
                }}
              >
                {withdrawableAccounts.map(a => (
                  <option key={a.id} value={a.id}>Tabungan {a.account_type.toUpperCase()} - Saldo: {fmt(a.balance || 0)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
                Nominal Penarikan
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>Rp</span>
                <input
                  type="text"
                  value={displayAmount}
                  onChange={(e) => handleManualAmount(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)',
                    borderRadius: '14px', padding: '16px 16px 16px 45px', color: 'var(--text-primary)',
                    fontSize: '20px', fontWeight: 900, outline: 'none'
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            {message && (
              <div style={{
                padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', textAlign: 'center',
                background: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1.5px solid ${message.type === 'success' ? '#4ade80' : '#ef4444'}`,
                color: message.type === 'success' ? '#4ade80' : '#fca5a5'
              }}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '18px', borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(243, 198, 83, 0.3)' : 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                color: loading ? 'var(--text-secondary)' : '#02130e', border: 'none',
                fontWeight: 900, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px',
                boxShadow: '0 10px 25px var(--shadow-color)', transition: 'all 0.2s', marginTop: '10px'
              }}
            >
              {loading ? 'MEMPROSES...' : 'AJUKAN PENARIKAN TUNAI'}
            </button>
          </form>
        )}
      </div>

      {/* Col 2: Riwayat Pengajuan */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-primary)',
        borderRadius: '24px',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Riwayat Pengajuan Tarik Tunai
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '400px' }}>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Belum ada riwayat pengajuan penarikan.</div>
          ) : (
            requests.map(req => (
              <div key={req.id} style={{
                background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
                padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    {new Date(req.created_at).toLocaleDateString('id-ID')} • {req.reference_no}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {fmt(req.amount)}
                  </div>
                </div>
                <div>
                  <span style={{
                    fontSize: '11px', fontWeight: 900, padding: '6px 12px', borderRadius: '8px',
                    background: req.status === 'pending' ? 'rgba(243, 198, 83, 0.15)' : req.status === 'approved' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: req.status === 'pending' ? '#f3c653' : req.status === 'approved' ? '#34d399' : '#ef4444',
                    border: `1px solid ${req.status === 'pending' ? '#f3c653' : req.status === 'approved' ? '#34d399' : '#ef4444'}`
                  }}>
                    {req.status === 'pending' ? 'MENUNGGU KONFIRMASI PIHAK KOPERASI' : req.status === 'approved' ? 'SELESAI (CAIR)' : 'DITOLAK'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

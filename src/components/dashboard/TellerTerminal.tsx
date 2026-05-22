'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { COA } from '@/lib/constants/coa';
import { AccountingService } from '@/services/accounting.service';

interface TellerTerminalProps {
  userId: string;
}

export default function TellerTerminal({ userId }: TellerTerminalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [trxType, setTrxType] = useState<'deposit' | 'withdrawal' | 'payment'>('deposit');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [options, setOptions] = useState({ slip: true, passbook: false, supervisor: false });

  const [tellerName, setTellerName] = useState('Memuat...');

  const formatNumber = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(numeric));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const numeric = val.replace(/\D/g, '');
    setAmount(Number(numeric));
    setDisplayAmount(formatNumber(numeric));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const supabase = createClient();
      
      // Fetch Members
      const { data: membersData } = await supabase.from('members').select('*, users(full_name)');
      if (membersData) setMembers(membersData);

      // Fetch Teller Profile Name from users table
      if (userId) {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', userId)
          .single();
        if (userData) setTellerName(userData.full_name);
      }
    };
    fetchInitialData();
  }, [userId]);

  // Fetch balance and history when member is selected
  useEffect(() => {
    if (selectedMemberId) {
      const fetchData = async () => {
        const supabase = createClient();
        
        // Fetch everything from journal_entries that mentions this member
        const { data: trxHistory } = await supabase
          .from('journal_entries')
          .select('*')
          .ilike('description', `%${selectedMemberId}%`)
          .order('created_at', { ascending: false });
        
        if (trxHistory) {
          setHistory(trxHistory);
          
          // Calculate balance: (Sum Debit - Sum Credit) + Initial Simulation 5.000.000
          const totalDebit = trxHistory.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
          const totalCredit = trxHistory.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
          setBalance((totalDebit - totalCredit) + 5000000);
        } else {
          setBalance(5000000); // Default simulation if no records
          setHistory([]);
        }
      };
      fetchData();
    } else {
      setBalance(null);
      setHistory([]);
    }
  }, [selectedMemberId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || amount <= 0) {
      setMessage({ type: 'error', text: 'Pilih anggota dan masukkan nominal yang valid.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const selectedMember = members.find(m => m.id === selectedMemberId || m.user_id === selectedMemberId);
      const memberName = selectedMember?.users?.full_name || 'Anggota';
      
      let entries = [];
      let finalDesc = description || `${trxType.toUpperCase()} - ${memberName} (${selectedMemberId})`;

      const admFee = 15000;
      const infaqSedekahBase = 10000;
      const memberPhone = selectedMember?.phone_number || selectedMember?.nik || '';
      const phoneDigits = memberPhone.replace(/\D/g, '');
      const uniqueCodeStr = phoneDigits.slice(-3).padStart(3, '0');
      const uniqueCodeValue = Number(uniqueCodeStr) || 0;
      const infaqSedekahTotal = infaqSedekahBase + uniqueCodeValue;

      // IMPLEMENTASI DOUBLE-ENTRY (DEBIT & KREDIT HARUS SEIMBANG)
      switch (trxType) {
        case 'deposit':
          // SETORAN: Debit Kas (Harta Bertambah), Kredit Simpanan (Kewajiban Bertambah)
          entries.push({ account_code: COA.CASH_ON_HAND, debit: amount, credit: 0 });
          entries.push({ account_code: COA.SAVINGS_WADIAH, debit: 0, credit: amount });
          break;
        case 'withdrawal':
          // PENARIKAN: Debit Simpanan (Kewajiban Berkurang), Kredit Kas (Harta Berkurang)
          entries.push({ account_code: COA.SAVINGS_WADIAH, debit: amount, credit: 0 });
          entries.push({ account_code: COA.CASH_ON_HAND, debit: 0, credit: amount });
          break;
        case 'payment':
          // ANGSURAN: Debit Kas (Harta Bertambah), Kredit Piutang (Harta Berkurang), Kredit ADM, Kredit Infaq
          const grandTotalPayment = amount + admFee + infaqSedekahTotal;
          entries.push({ account_code: COA.CASH_ON_HAND, debit: grandTotalPayment, credit: 0 });
          entries.push({ account_code: COA.RECEIVABLE_MURABAHAH, debit: 0, credit: amount });
          entries.push({ account_code: COA.INCOME_SERVICE_FEE, debit: 0, credit: admFee });
          entries.push({ account_code: COA.RETAINED_EARNINGS, debit: 0, credit: infaqSedekahTotal });
          
          finalDesc = description || `ANGSURAN - ${memberName} (Angsuran: Rp ${amount.toLocaleString('id-ID')}, ADM: Rp ${admFee.toLocaleString('id-ID')}, Infaq & Kode Unik: Rp ${infaqSedekahTotal.toLocaleString('id-ID')})`;
          break;
      }

      // Kirim seluruh entri dalam satu transaksi accounting
      const res = await fetch('/api/accounting/record-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          description: `[TELLER: ${tellerName}] ${finalDesc}`,
          entries,
          reference_no: `TLR-${Date.now()}`,
          member_id: selectedMemberId
        })
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Gagal mencatat transaksi');

      // Sequential Printing Simulation
      if (options.slip) {
        alert('🔄 SEDANG MENCETAK SLIP TRANSAKSI...');
      }
      
      if (options.passbook) {
        setTimeout(() => {
          alert('📖 SLIP SELESAI. Silakan masukkan BUKU TABUNGAN untuk cetak baris.');
        }, 1000);
      }

      const grandTotalMsg = trxType === 'payment' 
        ? `sebesar Rp ${(amount + admFee + infaqSedekahTotal).toLocaleString('id-ID')} (Termasuk ADM Rp 15.000, Infaq Rp 10.000, dan Kode Unik Rp ${uniqueCodeStr})`
        : `sebesar Rp ${amount.toLocaleString('id-ID')}`;
      
      setMessage({ type: 'success', text: `Transaksi Berhasil! Pembayaran ${grandTotalMsg} telah diposting ke Buku Besar dengan Double-Entry SAK EP.` });
      setAmount(0);
      setDisplayAmount('');
      setDescription('');
      
      // Refresh balance & history
      if (selectedMemberId) {
        const supabase = createClient();
        const { data: trxHistory } = await supabase
          .from('journal_entries')
          .select('*')
          .ilike('description', `%${selectedMemberId}%`)
          .order('created_at', { ascending: false });
        
        if (trxHistory) {
          setHistory(trxHistory);
          // Recalculate balance for specific savings account (SAVINGS_WADIAH)
          const totalCredit = trxHistory.filter(h => h.account_code === COA.SAVINGS_WADIAH).reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
          const totalDebit = trxHistory.filter(h => h.account_code === COA.SAVINGS_WADIAH).reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
          setBalance(totalCredit - totalDebit);
        }
      }

    } catch (err: any) {
      setMessage({ type: 'error', text: `ERROR: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{
        background: 'var(--bg-header)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '32px',
        border: '1px solid var(--border-primary)',
        padding: '40px',
        boxShadow: '0 40px 100px var(--shadow-color)',
        color: 'var(--text-primary)',
        width: '100%',
        animation: 'fadeInScale 0.4s ease'
      }}>
        <div style={{ marginBottom: '40px', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--gold-intense)', margin: 0, textTransform: 'uppercase', letterSpacing: '3px' }}>
            Layanan Transaksi
          </h2>
          <div style={{ width: '100px', height: '4px', background: 'var(--gold-intense)', margin: '16px auto', borderRadius: '2px', boxShadow: '0 0 10px var(--shadow-color)' }} />
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 600, fontSize: '15px' }}>
            Pusat Operasional Kasir | Petugas: <span style={{ color: 'var(--gold-intense)', fontWeight: 800 }}>{tellerName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ 
            background: 'var(--border-primary)', 
            padding: '24px', 
            borderRadius: '20px', 
            display: 'grid', 
            gridTemplateColumns: '1.5fr 1fr', 
            gap: '24px',
            alignItems: 'center',
            border: '1px solid var(--border-primary)'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase' }}>Cari Nama Anggota</label>
              <select 
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  padding: '14px',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              >
                <option value="" style={{ color: '#000' }}>-- Klik untuk Memilih Anggota --</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id} style={{ color: '#000' }}>
                    {m.users?.full_name} ({m.nik})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--gold-bright)', textTransform: 'uppercase', marginBottom: '4px' }}>Saldo Terakhir</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: balance !== null ? '#4ade80' : 'var(--text-secondary)' }}>
                {balance !== null ? `Rp ${balance.toLocaleString('id-ID')}` : 'Rp 0'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '10px', textTransform: 'uppercase' }}>Jenis Layanan</label>
              <select 
                value={trxType}
                onChange={(e) => setTrxType(e.target.value as any)}
                style={{
                  width: '100%',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              >
                <option value="deposit" style={{ color: '#000' }}>Setoran Tunai</option>
                <option value="withdrawal" style={{ color: '#000' }}>Penarikan Tunai</option>
                <option value="payment" style={{ color: '#000' }}>Angsuran</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: 'var(--gold-bright)', marginBottom: '10px', textTransform: 'uppercase' }}>Nominal Transaksi</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '20px', top: '18px', fontSize: '20px', fontWeight: 900, color: 'var(--gold-bright)' }}>Rp</span>
                <input 
                  type="text"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  style={{
                    width: '100%',
                    background: 'var(--border-primary)',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '16px',
                    padding: '18px 18px 18px 55px',
                    color: 'var(--text-primary)',
                    fontSize: '28px',
                    fontWeight: 900,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {trxType === 'payment' && selectedMemberId && (
            <div style={{
              background: 'rgba(218, 165, 32, 0.05)',
              border: '1px solid rgba(218, 165, 32, 0.2)',
              padding: '24px',
              borderRadius: '20px',
              marginTop: '-10px',
              color: 'var(--text-primary)',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              <h4 style={{ color: 'var(--gold-bright)', margin: '0 0 16px 0', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>✨ Rincian Tagihan & Biaya Operasional</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '15px', fontWeight: 600 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Angsuran Pokok:</span>
                  <span>Rp {amount.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Biaya Administrasi:</span>
                  <span>Rp {(15000).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Infaq & Sedekah:</span>
                  <span>Rp {(10000).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold-bright)' }}>
                  <span>Kode Unik Anggota (3 Digit Terakhir):</span>
                  <span>Rp {(() => {
                    const selectedMember = members.find(m => m.id === selectedMemberId || m.user_id === selectedMemberId);
                    if (!selectedMember) return '000';
                    const source = selectedMember.phone_number || selectedMember.nik || '';
                    const digits = source.replace(/\D/g, '');
                    return digits.slice(-3).padStart(3, '0');
                  })()}</span>
                </div>
                <div style={{ height: '1.5px', background: 'rgba(218, 165, 32, 0.2)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '18px', color: '#4ade80' }}>
                  <span>Total Wajib Setor:</span>
                  <span>Rp {(() => {
                    const selectedMember = members.find(m => m.id === selectedMemberId || m.user_id === selectedMemberId);
                    const source = selectedMember ? (selectedMember.phone_number || selectedMember.nik || '') : '';
                    const digits = source.replace(/\D/g, '');
                    const uniqueCodeVal = Number(digits.slice(-3)) || 0;
                    return (amount + 15000 + 10000 + uniqueCodeVal).toLocaleString('id-ID');
                  })()}</span>
                </div>
              </div>
            </div>
          )}


          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '10px', textTransform: 'uppercase' }}>Keterangan / Berita Acara</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masukkan berita acara transaksi di sini..."
              style={{
                width: '100%',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                padding: '16px',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 500,
                outline: 'none',
                minHeight: '80px',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            padding: '24px', 
            borderRadius: '20px', 
            border: '1px solid rgba(255,255,255,0.05)' 
          }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '16px', textTransform: 'uppercase' }}>Opsi Antrian Cetak (Satu-per-Satu)</label>
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
                <input 
                  type="checkbox" 
                  checked={options.slip} 
                  onChange={(e) => setOptions({ ...options, slip: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#f3c653' }} 
                /> Cetak Slip Setoran
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
                <input 
                  type="checkbox" 
                  checked={options.passbook}
                  onChange={(e) => setOptions({ ...options, passbook: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#f3c653' }} 
                /> Cetak Buku Tabungan
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
                <input 
                  type="checkbox" 
                  checked={options.supervisor}
                  onChange={(e) => setOptions({ ...options, supervisor: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#f3c653' }} 
                /> Validasi Manager
              </label>
            </div>
          </div>

          {message && (
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' ? '#4ade80' : '#ef4444'}`,
              color: message.type === 'success' ? '#4ade80' : '#fca5a5',
              fontSize: '14px',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              {message.text}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, var(--gold-intense) 0%, var(--gold-bright) 100%)',
              border: 'none',
              padding: '24px',
              borderRadius: '18px',
              color: '#02130e',
              fontSize: '18px',
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 30px var(--shadow-color)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
            onMouseOver={(e) => { if(!loading) e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)'; }}
            onMouseOut={(e) => { if(!loading) e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
          >
            {loading ? '⏳ SEDANG MEMPROSES...' : '🔥 SIMPAN & PROSES CETAK'}
          </button>
        </form>
      </div>

      {/* Member Transaction History Section */}
      {selectedMemberId && (
        <div style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          borderRadius: '32px',
          border: '1px solid var(--border-primary)',
          padding: '40px',
          boxShadow: '0 20px 60px var(--shadow-color)',
          color: 'var(--text-primary)',
          animation: 'fadeInUp 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f3c653', margin: 0 }}>
              📜 Riwayat Rekening Anggota
            </h3>
            <span style={{ background: '#043121', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#4ade80', border: '1px solid #4ade80' }}>
              Aktif
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gold-bright)', textAlign: 'left', background: 'var(--border-primary)' }}>
                  <th style={{ padding: '20px', color: 'var(--gold-intense)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}>TANGGAL</th>
                  <th style={{ padding: '20px', color: 'var(--gold-intense)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}>KETERANGAN</th>
                  <th style={{ padding: '20px', color: 'var(--gold-intense)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>DEBIT</th>
                  <th style={{ padding: '20px', color: 'var(--gold-intense)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>KREDIT</th>
                  <th style={{ padding: '20px', color: 'var(--gold-intense)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>SALDO</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-primary)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{item.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: '#4ade80', fontWeight: 800 }}>
                      {item.debit > 0 ? `+Rp ${item.debit.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', color: '#fca5a5', fontWeight: 800 }}>
                      {item.credit > 0 ? `-Rp ${item.credit.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, color: 'var(--gold-intense)' }}>
                      Rp {(balance || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.5, fontWeight: 600 }}>
                      Belum ada riwayat transaksi untuk anggota ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}




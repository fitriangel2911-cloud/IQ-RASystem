'use client';

import React, { useState } from 'react';
import { COA } from '@/lib/constants/coa';
import { createClient } from '@/lib/supabase/client';

interface Member {
  id: string;
  user_id: string;
  nik: string;
  phone_number?: string;
  users?: { full_name: string; email: string };
  savings_accounts?: { id: string; account_number: string; account_type: string; balance: number }[];
}

interface Panel4Props {
  selectedMember: Member | null;
  tellerName: string;
  onSuccess: () => void;
}

const MIN_BALANCE = 50000; // Saldo mengendap minimum
const DEFAULT_SUPERVISOR_LIMIT = 5000000;
const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

function printReceipt(data: {
  memberName: string; nik: string; accountNumber: string;
  amount: number; refNo: string; teller: string; date: string;
  cardNo: string;
}) {
  const win = window.open('', '_blank', 'width=380,height=600');
  if (!win) return;
  win.document.write(`
    <html><head><title>Struk Penarikan</title>
    <style>body{font-family:'Courier New',monospace;font-size:13px;padding:16px;max-width:300px;margin:0 auto;}.center{text-align:center;}.bold{font-weight:bold;}.line{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;margin:4px 0;}.title{font-size:18px;font-weight:bold;text-align:center;margin:8px 0;}</style>
    </head><body>
    <div class="title">KOPERASI SYARIAH IQ-RA</div>
    <div class="center">Struk Penarikan Tunai</div>
    <div class="line"></div>
    <div class="row"><span>Tanggal</span><span>${data.date}</span></div>
    <div class="row"><span>No. Ref</span><span>${data.refNo}</span></div>
    <div class="row"><span>Petugas</span><span>${data.teller}</span></div>
    <div class="line"></div>
    <div class="row"><span>Nama</span><span>${data.memberName}</span></div>
    <div class="row"><span>NIK</span><span>${data.nik}</span></div>
    <div class="row"><span>No. Kartu</span><span>${data.cardNo}</span></div>
    <div class="row"><span>No. Rek</span><span>${data.accountNumber}</span></div>
    <div class="line"></div>
    <div class="row bold"><span>PENARIKAN</span><span>${fmt(data.amount)}</span></div>
    <div class="line"></div>
    <div class="center">Terima kasih.</div>
    <div class="center">Barakallahu fiikum.</div>
    <script>window.print();window.close();</script>
    </body></html>
  `);
  win.document.close();
}

export default function Panel4Withdrawal({ selectedMember, tellerName, onSuccess }: Panel4Props) {
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [selectedAccId, setSelectedAccId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'pokok' | 'wajib' | 'wadiah' | 'mudharabah'>('wadiah');
  const [cardNo, setCardNo] = useState('');
  const [authNote, setAuthNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [supervisorLimit, setSupervisorLimit] = useState(DEFAULT_SUPERVISOR_LIMIT);
  const [printSlip, setPrintSlip] = useState(true);

  const fetchApprovedRequests = async () => {
    if (!selectedMember || selectedMember.id === 'mock-member-fitri') return;
    const supabase = createClient();
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*, savings_accounts(account_type, balance, account_number)')
      .eq('member_id', selectedMember.user_id)
      .eq('status', 'approved');
    setApprovedRequests(data || []);
  };

  React.useEffect(() => {
    fetchApprovedRequests();
  }, [selectedMember]);

  const executeApprovedRequest = async (req: any) => {
    setLoading(true); setMessage(null);
    try {
      const supabase = createClient();
      const memberName = selectedMember!.users?.full_name || (selectedMember as any).mother_name || 'Anggota Tanpa Nama';
      const desc = `PENARIKAN TUNAI (VIA OTORISASI MANAJER) - ${memberName}`;
      
      let debitAccount = COA.SAVINGS_WADIAH; 
      if (req.savings_accounts?.account_type === 'pokok') debitAccount = COA.MEMBER_CAPITAL_PRINCIPAL;
      else if (req.savings_accounts?.account_type === 'wajib') debitAccount = COA.MEMBER_CAPITAL_MANDATORY;
      else if (req.savings_accounts?.account_type === 'mudharabah') debitAccount = COA.SAVINGS_MUDHARABAH;

      // 1. Post double-entry journal book entries
      const res = await fetch('/api/accounting/record-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          description: `[TELLER: ${tellerName}] ${desc}`,
          entries: [
            { account_code: debitAccount, debit: req.amount, credit: 0 },
            { account_code: COA.CASH_ON_HAND, debit: 0, credit: req.amount },
          ],
          reference_no: req.reference_no,
          member_id: selectedMember!.user_id,
        })
      });
      if (!res.ok) throw new Error('Gagal mencatat transaksi akuntansi');

      // 2. Perform direct update to savings accounts balance
      const currentBalance = Number(req.savings_accounts?.balance || 0);
      const newBalance = currentBalance - req.amount;
      const { error: balanceErr } = await supabase.from('savings_accounts').update({ balance: newBalance }).eq('id', req.account_id);
      if (balanceErr) throw balanceErr;

      // 3. Log mutation in savings_transactions
      const { error: txErr } = await supabase.from('savings_transactions').insert([{
        account_id: req.account_id, transaction_type: 'withdrawal', amount: req.amount, reference_no: req.reference_no
      }]);
      if (txErr) throw txErr;

      // 4. Update status to completed
      await supabase.from('withdrawal_requests').update({ status: 'completed' }).eq('id', req.id);

      setMessage({ type: 'success', text: `Eksekusi Penarikan Tunai Rp ${req.amount.toLocaleString('id-ID')} Berhasil diserahkan ke nasabah!` });
      fetchApprovedRequests();
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: `ERROR: ${err.message}` });
    } finally { setLoading(false); }
  };

  // Load dynamic supervisor limit from system parameters on mount
  React.useEffect(() => {
    async function loadSupervisorLimit() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('system_parameters')
          .select('value')
          .eq('key', 'supervisor_approval_limit')
          .single();
        if (!error && data) {
          const val = parseInt(data.value, 10);
          if (!isNaN(val)) {
            setSupervisorLimit(val);
          }
        }
      } catch (err) {
        console.warn("Failed to load supervisor limit parameter:", err);
      }
    }
    loadSupervisorLimit();
  }, []);

  // Automatically select the account that matches the selected category
  React.useEffect(() => {
    if (selectedMember && selectedMember.savings_accounts) {
      const match = selectedMember.savings_accounts.find(a => a.account_type === selectedCategory);
      if (match) {
        setSelectedAccId(match.id);
      } else {
        setSelectedAccId('');
      }
    }
  }, [selectedCategory, selectedMember]);

  const selectedAcc = selectedMember?.savings_accounts?.find(a => a.id === selectedAccId);
  const availableBalance = Math.max(0, (selectedAcc?.balance || 0) - MIN_BALANCE);

  const handleAmountChange = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    setAmount(Number(numeric));
    setDisplayAmount(numeric ? Number(numeric).toLocaleString('id-ID') : '');
  };

  const processWithdrawal = async () => {
    setLoading(true); setMessage(null);
    try {
      const memberName = selectedMember!.users?.full_name || (selectedMember as any).mother_name || 'Anggota Tanpa Nama';
      const refNo = `TLR-WDR-${Date.now()}`;
      const desc = `PENARIKAN TUNAI - ${memberName} (Kartu: ${cardNo})`;

      // Dynamic debit account COA code mapping based on selected account type
      let debitAccount = COA.SAVINGS_WADIAH; // Default wadiah: 201.01
      if (selectedAcc?.account_type === 'pokok') debitAccount = COA.MEMBER_CAPITAL_PRINCIPAL; // 301.01
      else if (selectedAcc?.account_type === 'wajib') debitAccount = COA.MEMBER_CAPITAL_MANDATORY; // 301.02
      else if (selectedAcc?.account_type === 'mudharabah') debitAccount = COA.SAVINGS_MUDHARABAH; // 201.02

      // 1. Post double-entry journal book entries
      const res = await fetch('/api/accounting/record-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          description: `[TELLER: ${tellerName}] ${desc} [KTP & KARTU ANGGOTA COCOK]`,
          entries: [
            { account_code: debitAccount, debit: amount, credit: 0 },
            { account_code: COA.CASH_ON_HAND, debit: 0, credit: amount },
          ],
          reference_no: refNo,
          member_id: selectedMember!.user_id,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat transaksi akuntansi');

      // 2. Perform direct update to savings accounts balance
      const supabase = createClient();
      const currentBalance = Number(selectedAcc?.balance || 0);
      const newBalance = currentBalance - amount;

      const { error: balanceErr } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', selectedAccId);
      if (balanceErr) throw balanceErr;

      // 3. Log mutation in savings_transactions
      const { error: txErr } = await supabase
        .from('savings_transactions')
        .insert([{
          account_id: selectedAccId,
          transaction_type: 'withdrawal',
          amount: amount,
          reference_no: refNo
        }]);
      if (txErr) throw txErr;

      // 4. Notify the member
      await supabase.from('notifications').insert({
        user_id: selectedMember!.user_id,
        title: 'Penarikan Tunai Berhasil',
        message: `Penarikan tunai sebesar ${fmt(amount)} berhasil diproses oleh teller. Saldo Anda telah diperbarui. No Ref: ${refNo}`,
        type: 'info',
        is_read: false
      });

      if (printSlip) {
        printReceipt({
          memberName,
          nik: selectedMember!.nik,
          cardNo,
          accountNumber: selectedAcc?.account_number || '-',
          amount,
          refNo,
          teller: tellerName,
          date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        });
      }

      setMessage({ type: 'success', text: `Penarikan ${fmt(amount)} berhasil! Ref: ${refNo}` });
      setAmount(0); setDisplayAmount(''); setCardNo(''); setAuthNote('');
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: `ERROR: ${err.message}` });
    } finally { setLoading(false); }
  };

  const submitToManager = async () => {
    setLoading(true); setMessage(null);
    try {
      const supabase = createClient();
      const refNo = `TRK-REQ-${Date.now()}`;
      const { error } = await supabase.from('withdrawal_requests').insert({
        member_id: selectedMember!.user_id,
        account_id: selectedAccId,
        amount: amount,
        status: 'pending',
        reference_no: refNo
      });

      if (error) throw error;

      setMessage({ type: 'success', text: `🚨 Penarikan > ${fmt(supervisorLimit)}. Transaksi berhasil diteruskan ke Dasbor Manajer untuk Otorisasi. Status: Menunggu.` });
      setAmount(0); setDisplayAmount(''); setCardNo(''); setAuthNote('');
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: `ERROR: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) { setMessage({ type: 'error', text: 'Pilih anggota terlebih dahulu di Panel [2].' }); return; }
    if (!selectedAccId) { setMessage({ type: 'error', text: `Anggota belum memiliki rekening tipe ${selectedCategory.toUpperCase()} untuk penarikan ini.` }); return; }
    if (amount <= 0) { setMessage({ type: 'error', text: 'Masukkan nominal penarikan yang valid.' }); return; }
    if (amount > availableBalance) { setMessage({ type: 'error', text: `Saldo tersedia tidak mencukupi. Penarikan maks: ${fmt(availableBalance)}` }); return; }
    if (!cardNo) { setMessage({ type: 'error', text: 'Masukkan Nomor Kartu Anggota untuk verifikasi kepemilikan fisik.' }); return; }

    if (amount > supervisorLimit) {
      submitToManager();
    } else {
      processWithdrawal();
    }
  };

  if (!selectedMember) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '2px dashed rgba(243,198,83,0.3)', borderRadius: '20px', padding: '80px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '16px' }}>Pilih anggota di Panel [2] Cari Anggota terlebih dahulu.</div>
      </div>
    );
  }

  return (
    <>
      {approvedRequests.length > 0 && (
        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '2px dashed #10b981', borderRadius: '20px', padding: '24px', marginBottom: '24px', animation: 'fadeInUp 0.5s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🚨</span>
            <h4 style={{ margin: 0, color: '#10b981', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>Antrean Siap Cair (Telah Diotorisasi Manajer)</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {approvedRequests.map(req => (
              <div key={req.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800 }}>Nominal Penarikan Disetujui</div>
                  <div style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 900, marginTop: '4px' }}>{fmt(req.amount)}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Rekening Tujuan: <strong>{req.savings_accounts?.account_number || '-'}</strong> (Tipe: {req.savings_accounts?.account_type})
                  </div>
                </div>
                <button 
                  onClick={() => executeApprovedRequest(req)}
                  disabled={loading}
                  style={{
                    background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 24px',
                    fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                  }}
                >
                  Eksekusi & Serahkan Tunai
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Member Header */}
        <div style={{ background: 'rgba(252,165,165,0.06)', border: '1.5px solid rgba(252,165,165,0.3)', borderRadius: '16px', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#fca5a5', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Anggota Terpilih</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>{selectedMember.users?.full_name || (selectedMember as any).mother_name || 'Anggota Tanpa Nama'}</div>
            <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '2px' }}>NIK: {selectedMember.nik}</div>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 900, color: '#fca5a5', background: 'rgba(252,165,165,0.1)', padding: '8px 16px', borderRadius: '6px' }}>PENARIKAN</span>
        </div>

        {/* Kategori Simpanan Syariah Buttons */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: 900, color: '#cca334', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Kategori Rekening Sumber (Akad Syariah)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '14px' }}>
            {([
              { value: 'pokok', label: 'Simpanan Pokok', desc: 'Syirkah (Penyertaan)' },
              { value: 'wajib', label: 'Simpanan Wajib', desc: 'Syirkah (Kewajiban)' },
              { value: 'wadiah', label: 'Simpanan Wadiah', desc: 'Titipan Wadiah' },
              { value: 'mudharabah', label: 'Simpanan Mudharabah', desc: 'Bagi Hasil' },
            ] as const).map(cat => {
              const matchedAcc = selectedMember.savings_accounts?.find(a => a.account_type === cat.value);
              const hasAcc = !!matchedAcc;
              return (
                <button key={cat.value} type="button" onClick={() => {
                  setSelectedCategory(cat.value);
                }} style={{
                  padding: '20px 12px', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  background: selectedCategory === cat.value ? 'rgba(243,198,83,0.12)' : 'var(--bg-card)',
                  border: `2.5px solid ${selectedCategory === cat.value ? '#f3c653' : 'var(--border-primary)'}`,
                  color: selectedCategory === cat.value ? '#f3c653' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, opacity: 0.7 }}>{cat.desc}</span>
                  {hasAcc ? (
                    <span style={{ fontSize: '15px', color: '#4ade80', fontWeight: 850, marginTop: '4px' }}>
                      {fmt(matchedAcc.balance)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#f87171', fontWeight: 900, marginTop: '4px', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '6px' }}>Belum Aktif</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Akad Syariah Explanation Card */}
        <div style={{
          background: 'rgba(4,49,33,0.4)', border: '1.5px solid rgba(243,198,83,0.2)', borderRadius: '16px', padding: '20px 24px',
          fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', transition: 'all 0.2s'
        }}>
          {selectedCategory === 'wadiah' && (
            <div>
              <div style={{ fontWeight: 900, color: '#f3c653', marginBottom: '8px', fontSize: '17px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AKAD WADIAH YAD DHAMANAH (Titipan Penjaminan)
              </div>
              <span>Dana titipan nasabah yang dijamin penuh keutuhannya dan dapat ditarik/diambil sewaktu-waktu oleh anggota tanpa pengurangan nilai nominal pokok.</span>
            </div>
          )}
          {selectedCategory === 'pokok' && (
            <div>
              <div style={{ fontWeight: 900, color: '#f3c653', marginBottom: '8px', fontSize: '17px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AKAD SYIRKAH / PENYERTAAN MODAL POKOK
              </div>
              <span>Penarikan Modal Pokok hanya diperbolehkan apabila anggota secara resmi mengundurkan diri dari keanggotaan Koperasi Syariah IQ-RA.</span>
            </div>
          )}
          {selectedCategory === 'wajib' && (
            <div>
              <div style={{ fontWeight: 900, color: '#f3c653', marginBottom: '8px', fontSize: '17px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AKAD SYIRKAH / IURAN MODAL WAJIB
              </div>
              <span>Sama dengan Modal Pokok, penarikan Modal Wajib hanya dapat dilakukan saat keanggotaan resmi berakhir/mengundurkan diri.</span>
            </div>
          )}
          {selectedCategory === 'mudharabah' && (
            <div>
              <div style={{ fontWeight: 900, color: '#f3c653', marginBottom: '8px', fontSize: '17px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AKAD MUDHARABAH MUTLAQAH (Investasi Bagi Hasil)
              </div>
              <span>Penarikan dana investasi mudharabah produktif yang dikelola oleh koperasi untuk usaha komersial sesuai kesepakatan nisbah.</span>
            </div>
          )}
        </div>

        {selectedAcc && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(74,222,128,0.06)', border: '1.5px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>Saldo Total</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#4ade80' }}>{fmt(selectedAcc.balance)}</div>
            </div>
            <div style={{ background: 'rgba(243,198,83,0.06)', border: '1.5px solid rgba(243,198,83,0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>Saldo Tersedia</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#f3c653' }}>{fmt(availableBalance)}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>Mengendap min: {fmt(MIN_BALANCE)}</div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: 900, color: '#cca334', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nominal Penarikan</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', fontSize: '22px', fontWeight: 900, color: '#fca5a5' }}>Rp</span>
            <input type="text" value={displayAmount} onChange={e => handleAmountChange(e.target.value)} placeholder="0"
              style={{
                width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)',
                borderRadius: '14px', padding: '20px 20px 20px 60px', color: 'var(--text-primary)',
                fontSize: '36px', fontWeight: 900, outline: 'none'
              }}
              onFocus={e => { e.target.style.borderColor = '#fca5a5'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-primary)'; }}
            />
          </div>
          {amount > supervisorLimit && (
            <div style={{ marginTop: '10px', padding: '14px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', fontSize: '15px', color: '#fca5a5', fontWeight: 700 }}>
              Penarikan melebihi {fmt(supervisorLimit)} — memerlukan otorisasi supervisor.
            </div>
          )}
        </div>

        {/* Verifikasi KTP / Kartu Anggota */}
        <div style={{ background: 'rgba(243,198,83,0.03)', border: '1.5px solid rgba(243,198,83,0.2)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>
            SOP Protokol Verifikasi Penarikan Tunai
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span>1. Teller wajib meminta KTP asli dan Kartu Anggota fisik dari pihak penarik.</span>
            <span>2. Teller mencocokkan nama dan foto KTP dengan data profil di sistem.</span>
            <span>3. Masukkan nomor kartu anggota di bawah ini sebagai konfirmasi verifikasi fisik sukses.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginTop: '6px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '15px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nomor Kartu Anggota (Fisik)</label>
              <input type="text" value={cardNo} onChange={e => setCardNo(e.target.value)} placeholder="INPUT NOMOR KARTU ANGGOTA..."
                style={{
                  width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)',
                  borderRadius: '12px', padding: '14px 18px', color: 'var(--text-primary)', fontSize: '16px',
                  fontWeight: 800, outline: 'none'
                }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '15px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Catatan Tambahan (Opsional)</label>
              <input type="text" value={authNote} onChange={e => setAuthNote(e.target.value)} placeholder="Misal: KTP &amp; Wajah cocok..."
                style={{
                  width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)',
                  borderRadius: '12px', padding: '14px 18px', color: 'var(--text-primary)', fontSize: '15px',
                  fontWeight: 600, outline: 'none'
                }} />
            </div>
          </div>
        </div>

        {/* Total Withdrawal Breakdown Canvas */}
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: '16px', padding: '22px 26px' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#fca5a5', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Rincian Penarikan Tunai
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Nominal Tarik Tunai Pokok</span>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Biaya Admin Penarikan</span>
              <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>Rp 0</span>
            </div>
            <div style={{ height: '1px', background: 'rgba(239,68,68,0.2)', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: 900 }}>
              <span>Total Uang Diserahkan</span>
              <span style={{ color: '#ef4444' }}>{fmt(amount)}</span>
            </div>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>
          <input type="checkbox" checked={printSlip} onChange={e => setPrintSlip(e.target.checked)} style={{ width: '22px', height: '22px', accentColor: '#f3c653' }} />
          Cetak Struk Penarikan
        </label>

        {message && (
          <div style={{
            padding: '16px 22px', borderRadius: '12px', fontWeight: 700, fontSize: '16px',
            background: message.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1.5px solid ${message.type === 'success' ? '#4ade80' : '#ef4444'}`,
            color: message.type === 'success' ? '#4ade80' : '#fca5a5'
          }}>{message.text}</div>
        )}

        <button type="submit" disabled={loading} style={{
          background: loading ? 'rgba(252,165,165,0.3)' : 'linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)',
          border: 'none', borderRadius: '16px', padding: '22px', color: loading ? 'var(--text-secondary)' : '#fff',
          fontSize: '20px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.3s'
        }}>
          {loading ? 'MEMPROSES...' : 'PROSES PENARIKAN'}
        </button>
      </form>
    </>
  );
}

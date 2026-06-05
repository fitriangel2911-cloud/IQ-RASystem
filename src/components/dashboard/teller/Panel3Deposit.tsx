'use client';

import React, { useState, useEffect } from 'react';
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

interface ReceiptData {
  type: string;
  memberName: string;
  nik: string;
  accountNumber: string;
  amount: number;
  refNo: string;
  teller: string;
  date: string;
}

interface Panel3Props {
  selectedMember: Member | null;
  tellerName: string;
  onSuccess: () => void;
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

function printReceipt(data: ReceiptData) {
  const win = window.open('', '_blank', 'width=380,height=600');
  if (!win) return;
  win.document.write(`
    <html><head><title>Struk Setoran</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 13px; padding: 16px; max-width: 300px; margin: 0 auto; }
      .center { text-align: center; } .bold { font-weight: bold; }
      .line { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; margin: 4px 0; }
      .title { font-size: 18px; font-weight: bold; text-align: center; margin: 8px 0; }
    </style></head><body>
    <div class="title">KOPERASI SYARIAH IQ-RA</div>
    <div class="center">Struk ${data.type}</div>
    <div class="line"></div>
    <div class="row"><span>Tanggal</span><span>${data.date}</span></div>
    <div class="row"><span>No. Ref</span><span>${data.refNo}</span></div>
    <div class="row"><span>Petugas</span><span>${data.teller}</span></div>
    <div class="line"></div>
    <div class="row"><span>Nama</span><span>${data.memberName}</span></div>
    <div class="row"><span>NIK</span><span>${data.nik}</span></div>
    <div class="row"><span>No. Rek</span><span>${data.accountNumber}</span></div>
    <div class="line"></div>
    <div class="row bold"><span>${data.type.toUpperCase()}</span><span>${fmt(data.amount)}</span></div>
    <div class="line"></div>
    <div class="center">Terima kasih telah menabung.</div>
    <div class="center">Barakallahu fiikum.</div>
    <script>window.print(); window.close();</script>
    </body></html>
  `);
  win.document.close();
}

const DENOMINATIONS = [
  { value: 100000, label: 'Rp 100.000' },
  { value: 50000, label: 'Rp 50.000' },
  { value: 20000, label: 'Rp 20.000' },
  { value: 10000, label: 'Rp 10.000' },
  { value: 5000, label: 'Rp 5.000' },
  { value: 2000, label: 'Rp 2.000' },
  { value: 1000, label: 'Rp 1.000' },
  { value: 500, label: 'Rp 500' },
  { value: 200, label: 'Rp 200' },
  { value: 100, label: 'Rp 100' },
];

export default function Panel3Deposit({ selectedMember, tellerName, onSuccess }: Panel3Props) {
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [selectedAccId, setSelectedAccId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [description, setDescription] = useState('');
  const [printSlip, setPrintSlip] = useState(true);

  // New features: Transaction Method (Tunai vs Transfer), Admin Fee, and Infaq
  const [transactionMethod, setTransactionMethod] = useState<'tunai' | 'transfer'>('tunai');
  const [adminFee, setAdminFee] = useState(15000);
  const [infaq, setInfaq] = useState(10000);
  const [selectedCategory, setSelectedCategory] = useState<'pokok' | 'wajib' | 'wadiah' | 'mudharabah'>('wadiah');

  // System parameters state
  const [sysParams, setSysParams] = useState<Record<string, string>>({});

  // Denomination calculator state
  const [showCalc, setShowCalc] = useState(false);
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({});

  // Automatically select the account that matches the selected category
  useEffect(() => {
    if (selectedMember && selectedMember.savings_accounts) {
      const match = selectedMember.savings_accounts.find(a => a.account_type === selectedCategory);
      if (match) {
        setSelectedAccId(match.id);
      } else {
        setSelectedAccId('');
      }
    }
  }, [selectedCategory, selectedMember]);

  // Load dynamic parameter values from API
  useEffect(() => {
    const fetchParams = async () => {
      try {
        const res = await fetch('/api/admin/parameters');
        if (res.ok) {
          const data = await res.json();
          const mapped: Record<string, string> = {};
          const paramsList = data.success && Array.isArray(data.parameters) ? data.parameters : (Array.isArray(data) ? data : []);
          paramsList.forEach((p: any) => { mapped[p.key] = p.value; });
          setSysParams(mapped);
        }
      } catch (err) {
        console.error('Failed to load system parameters:', err);
      }
    };
    fetchParams();
  }, []);

  // Update dynamic values based on selected category when params load
  useEffect(() => {
    if (sysParams['biaya_infaq']) {
      setInfaq(Number(sysParams['biaya_infaq']) || 10000);
    }
    if (selectedCategory === 'pokok' && sysParams['simpanan_pokok']) {
      const val = Number(sysParams['simpanan_pokok']);
      setAmount(val); setDisplayAmount(val.toLocaleString('id-ID'));
      setAdminFee(Number(sysParams['biaya_adm']) || 15000);
    } else if (selectedCategory === 'wajib' && sysParams['simpanan_wajib']) {
      const val = Number(sysParams['simpanan_wajib']);
      setAmount(val); setDisplayAmount(val.toLocaleString('id-ID'));
      setAdminFee(0);
    } else {
      setAmount(0); setDisplayAmount('');
      setAdminFee(0);
    }
  }, [selectedCategory, sysParams]);

  const handleDenomChange = (val: number, countStr: string) => {
    const counts = Number(countStr.replace(/\D/g, ''));
    setDenomCounts(prev => ({ ...prev, [val]: counts }));
  };

  const calculatedSum = DENOMINATIONS.reduce((sum, d) => sum + (denomCounts[d.value] || 0) * d.value, 0);

  const applyCalcToAmount = () => {
    setAmount(calculatedSum);
    setDisplayAmount(calculatedSum.toLocaleString('id-ID'));
    setShowCalc(false);
  };

  const handleManualAmount = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    setAmount(Number(numeric));
    setDisplayAmount(numeric ? Number(numeric).toLocaleString('id-ID') : '');
  };

  const getUniqueCode = () => {
    if (transactionMethod !== 'transfer' || !selectedMember) return 0;
    const src = selectedMember.phone_number || selectedMember.nik || '';
    const digits = src.replace(/\D/g, '');
    return Number(digits.slice(-3)) || 0;
  };

  const uniqueCode = getUniqueCode();
  const totalAmountToPay = amount + adminFee + infaq + uniqueCode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) { setMessage({ type: 'error', text: 'Pilih anggota terlebih dahulu di Panel [2].' }); return; }
    if (amount <= 0) { setMessage({ type: 'error', text: 'Masukkan nominal setoran yang valid.' }); return; }
    if (infaq < 10000) { setMessage({ type: 'error', text: 'Minimal infaq/sedekah adalah Rp 10.000.' }); return; }

    setLoading(true); setMessage(null);
    try {
      const supabase = createClient();
      const memberName = selectedMember.users?.full_name || 'Anggota';
      const refNo = `TLR-DEP-${Date.now()}`;
      const methodLabel = transactionMethod === 'tunai' ? 'TUNAI' : 'TRANSFER BANK';

      let targetAccId = selectedAccId;
      let targetAccNumber = selectedMember.savings_accounts?.find(a => a.id === selectedAccId)?.account_number || '';

      // Auto-create account if it does not exist yet (On-the-fly Account Creator)
      if (!targetAccId) {
        const randNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const { data: newAcc, error: createErr } = await supabase
          .from('savings_accounts')
          .insert({
            member_id: selectedMember.user_id,
            account_number: randNum,
            account_type: selectedCategory,
            balance: 0,
          })
          .select()
          .single();

        if (createErr) throw createErr;
        targetAccId = newAcc.id;
        targetAccNumber = newAcc.account_number;
      }

      // 1. Post double-entry journal book entries via v2 API
      const debitAccount = transactionMethod === 'transfer' ? COA.CASH_IN_BANK : COA.CASH_ON_HAND;
      let creditAccount = COA.SAVINGS_WADIAH; // 201.01
      if (selectedCategory === 'pokok') creditAccount = COA.MEMBER_CAPITAL_PRINCIPAL; // 301.01
      else if (selectedCategory === 'wajib') creditAccount = COA.MEMBER_CAPITAL_MANDATORY; // 301.02
      else if (selectedCategory === 'mudharabah') creditAccount = COA.SAVINGS_MUDHARABAH; // 201.02

      const entries = [
        { account_code: debitAccount, debit: totalAmountToPay, credit: 0 },
        { account_code: creditAccount, debit: 0, credit: amount }
      ];

      if (adminFee > 0) {
        entries.push({ account_code: COA.INCOME_SERVICE_FEE, debit: 0, credit: adminFee });
      }
      if (infaq + uniqueCode > 0) {
        entries.push({ account_code: COA.RETAINED_EARNINGS, debit: 0, credit: infaq + uniqueCode });
      }

      const res = await fetch('/api/accounting/record-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          description: `[TELLER: ${tellerName}] SETORAN ${methodLabel} - ${memberName} (${selectedCategory.toUpperCase()} | Pokok: ${fmt(amount)}, ADM: ${fmt(adminFee)}, Infaq+Kode: ${fmt(infaq + uniqueCode)})`,
          entries,
          reference_no: refNo,
          member_id: selectedMember.user_id,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat jurnal transaksi');

      // 2. Perform direct update to savings accounts balance
      const currentBalance = Number(selectedMember.savings_accounts?.find(a => a.id === targetAccId)?.balance || 0);
      const newBalance = currentBalance + amount;

      const { error: balanceErr } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', targetAccId);
      if (balanceErr) throw balanceErr;

      // 3. Log mutation in savings_transactions
      const { error: txErr } = await supabase
        .from('savings_transactions')
        .insert([{
          account_id: targetAccId,
          transaction_type: 'deposit',
          amount: amount,
          reference_no: refNo
        }]);
      if (txErr) throw txErr;

      // 4. Notify the member
      await supabase.from('notifications').insert({
        user_id: selectedMember.user_id,
        title: 'Setoran Tunai Berhasil',
        message: `Setoran tunai sebesar ${fmt(totalAmountToPay)} berhasil diproses oleh teller. Saldo Anda telah diperbarui. No Ref: ${refNo}`,
        type: 'success',
        is_read: false
      });

      if (printSlip) {
        if (typeof window !== 'undefined') {
          const win = window.open('', '_blank', 'width=380,height=600');
          if (win) {
            win.document.write(`
              <html><head><title>Struk Setoran</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 13px; padding: 16px; max-width: 300px; margin: 0 auto; }
                .center { text-align: center; } .bold { font-weight: bold; }
                .line { border-top: 1px dashed #000; margin: 8px 0; }
                .row { display: flex; justify-content: space-between; margin: 4px 0; }
                .title { font-size: 18px; font-weight: bold; text-align: center; margin: 8px 0; }
              </style></head><body>
              <div class="title">KOPERASI SYARIAH IQ-RA</div>
              <div class="center">Struk Setoran (${methodLabel})</div>
              <div class="line"></div>
              <div class="row"><span>Tanggal</span><span>${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
              <div class="row"><span>No. Ref</span><span>${refNo}</span></div>
              <div class="row"><span>Petugas</span><span>${tellerName}</span></div>
              <div class="line"></div>
              <div class="row"><span>Nama</span><span>${memberName}</span></div>
              <div class="row"><span>NIK</span><span>${selectedMember.nik}</span></div>
              <div class="row"><span>No. Rek</span><span>${targetAccNumber}</span></div>
              <div class="line"></div>
              <div class="row"><span>Setoran Pokok</span><span>${fmt(amount)}</span></div>
              ${adminFee > 0 ? `<div class="row"><span>Biaya Admin</span><span>${fmt(adminFee)}</span></div>` : ''}
              ${infaq > 0 ? `<div class="row"><span>Infaq/Sedekah</span><span>${fmt(infaq)}</span></div>` : ''}
              ${uniqueCode > 0 ? `<div class="row"><span>Kode Unik</span><span>${fmt(uniqueCode)}</span></div>` : ''}
              <div class="line"></div>
              <div class="row bold"><span>TOTAL SETOR</span><span>${fmt(totalAmountToPay)}</span></div>
              <div class="line"></div>
              <div class="center">Terima kasih telah menabung.</div>
              <div class="center">Barakallahu fiikum.</div>
              <script>window.print(); window.close();</script>
              </body></html>
            `);
            win.document.close();
          }
        }
      }

      setMessage({ type: 'success', text: `Setoran ${fmt(totalAmountToPay)} berhasil! Ref: ${refNo}` });
      setAmount(0); setDisplayAmount(''); setDescription(''); setAdminFee(0); setInfaq(0); setDenomCounts({});
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: `ERROR: ${err.message}` });
    } finally { setLoading(false); }
  };

  if (!selectedMember) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '2px dashed rgba(243,198,83,0.3)', borderRadius: '20px', padding: '80px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '16px' }}>Pilih anggota di Panel [2] Cari Anggota terlebih dahulu.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Member Header */}
      <div style={{ background: 'rgba(74,222,128,0.06)', border: '1.5px solid rgba(74,222,128,0.3)', borderRadius: '16px', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#4ade80', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Anggota Terpilih</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>{selectedMember.users?.full_name}</div>
          <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '2px' }}>NIK: {selectedMember.nik}</div>
        </div>
        <span style={{ fontSize: '15px', fontWeight: 900, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '8px 16px', borderRadius: '6px' }}>SETORAN</span>
      </div>

      {/* Transaction Method */}
      <div>
        <label style={{ display: 'block', fontSize: '16px', fontWeight: 900, color: '#cca334', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Metode Transaksi</label>
        <div style={{ display: 'flex', gap: '14px' }}>
          {([
            { value: 'tunai', label: 'Tunai (Kas / Laci Teller)', color: '#4ade80' },
            { value: 'transfer', label: 'Transfer Bank (Virtual Account)', color: '#60a5fa' },
          ] as const).map(opt => (
            <button key={opt.value} type="button" onClick={() => {
              setTransactionMethod(opt.value);
            }} style={{
              flex: 1, padding: '18px 14px', borderRadius: '12px', fontWeight: 800, fontSize: '16px', cursor: 'pointer',
              background: transactionMethod === opt.value ? `${opt.color}18` : 'var(--border-primary)',
              border: `2px solid ${transactionMethod === opt.value ? opt.color : 'transparent'}`,
              color: transactionMethod === opt.value ? opt.color : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Kategori Simpanan Syariah Buttons */}
      <div>
        <label style={{ display: 'block', fontSize: '16px', fontWeight: 900, color: '#cca334', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Kategori Simpanan (Akad Syariah)</label>
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
                  <span style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 900, marginTop: '4px', background: 'rgba(96,165,250,0.1)', padding: '4px 10px', borderRadius: '6px' }}>Rekening Baru</span>
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
            <span>Dana titipan nasabah yang dapat dimanfaatkan oleh koperasi dan dijamin keutuhannya, dapat diambil sewaktu-waktu oleh anggota tanpa pengurangan nilai nominal pokok.</span>
          </div>
        )}
        {selectedCategory === 'pokok' && (
          <div>
            <div style={{ fontWeight: 900, color: '#f3c653', marginBottom: '8px', fontSize: '17px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AKAD SYIRKAH / PENYERTAAN MODAL POKOK
            </div>
            <span>Kontribusi modal awal keanggotaan koperasi yang menjadi bukti keikutsertaan kepemilikan dan hak suara anggota, tunduk pada ketentuan bagi hasil tahunan (SHU).</span>
          </div>
        )}
        {selectedCategory === 'wajib' && (
          <div>
            <div style={{ fontWeight: 900, color: '#f3c653', marginBottom: '8px', fontSize: '17px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AKAD SYIRKAH / IURAN MODAL WAJIB
            </div>
            <span>Kontribusi bulanan rutin anggota yang berfungsi memperkuat struktur permodalan koperasi untuk kegiatan usaha pembiayaan syariah secara berkelanjutan.</span>
          </div>
        )}
        {selectedCategory === 'mudharabah' && (
          <div>
            <div style={{ fontWeight: 900, color: '#f3c653', marginBottom: '8px', fontSize: '17px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AKAD MUDHARABAH MUTLAQAH (Investasi Bagi Hasil)
            </div>
            <span>Investasi modal produktif di mana anggota mempercayakan pengelolaan dana sepenuhnya kepada koperasi untuk disalurkan dalam pembiayaan komersial, dengan nisbah bagi hasil yang disepakati.</span>
          </div>
        )}
      </div>

      {/* Denomination Calculator Collapsible */}
      {transactionMethod === 'tunai' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '16px', overflow: 'hidden' }}>
          <button type="button" onClick={() => setShowCalc(!showCalc)} style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '18px 22px', background: 'rgba(255,255,255,0.02)', border: 'none', borderBottom: showCalc ? '1px solid var(--border-primary)' : 'none',
            color: '#f3c653', fontWeight: 800, fontSize: '16px', cursor: 'pointer'
          }}>
            <span>KALKULATOR DENOMINASI UANG FISIK</span>
            <span style={{ fontSize: '13px', background: 'rgba(243,198,83,0.1)', color: '#f3c653', padding: '4px 10px', borderRadius: '6px' }}>
              {showCalc ? 'SEMBUNYIKAN' : 'TAMPILKAN'}
            </span>
          </button>
          {showCalc && (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {DENOMINATIONS.map(d => (
                  <div key={d.value} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', width: '90px' }}>{d.label}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>x</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={denomCounts[d.value] || ''}
                      onChange={e => handleDenomChange(d.value, e.target.value)}
                      style={{
                        flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
                        borderRadius: '6px', padding: '10px 12px', color: 'var(--text-primary)',
                        fontSize: '15px', fontWeight: 700, outline: 'none', textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#4ade80', width: '110px', textAlign: 'right' }}>
                      {fmt((denomCounts[d.value] || 0) * d.value)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '16px', background: 'var(--bg-page)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Fisik Terhitung</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#4ade80', marginTop: '2px' }}>{fmt(calculatedSum)}</div>
                </div>
                <button type="button" onClick={applyCalcToAmount} disabled={calculatedSum === 0} style={{
                  padding: '12px 24px', background: '#4ade80', border: 'none', borderRadius: '10px',
                  color: '#02130e', fontWeight: 900, fontSize: '14px', cursor: 'pointer', opacity: calculatedSum === 0 ? 0.5 : 1
                }}>
                  TERAPKAN KE NOMINAL SETORAN
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Amount Input */}
      <div>
        <label style={{ display: 'block', fontSize: '16px', fontWeight: 900, color: '#cca334', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nominal Setoran</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', fontSize: '22px', fontWeight: 900, color: '#f3c653' }}>Rp</span>
          <input type="text" value={displayAmount} onChange={e => handleManualAmount(e.target.value)} placeholder="0"
            style={{
              width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)',
              borderRadius: '14px', padding: '20px 20px 20px 60px', color: 'var(--text-primary)',
              fontSize: '36px', fontWeight: 900, outline: 'none'
            }}
            onFocus={e => { e.target.style.borderColor = '#f3c653'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-primary)'; }}
          />
        </div>
      </div>

      {/* Optional Fees (Admin & Infaq) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Biaya Admin Setoran (Opsional)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', fontWeight: 800, color: 'var(--text-secondary)' }}>Rp</span>
            <input type="number" min="0" value={adminFee || ''} onChange={e => setAdminFee(Number(e.target.value))} placeholder="0"
              style={{
                width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
                borderRadius: '8px', padding: '14px 14px 14px 38px', color: 'var(--text-primary)',
                fontSize: '16px', fontWeight: 700, outline: 'none'
              }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Infaq & Sedekah (Opsional)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', fontWeight: 800, color: 'var(--text-secondary)' }}>Rp</span>
            <input type="number" min="0" value={infaq || ''} onChange={e => setInfaq(Number(e.target.value))} placeholder="0"
              style={{
                width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
                borderRadius: '8px', padding: '14px 14px 14px 38px', color: 'var(--text-primary)',
                fontSize: '16px', fontWeight: 700, outline: 'none'
              }} />
          </div>
        </div>
      </div>

      {/* Total Deposit Breakdown Canvas */}
      <div style={{ background: transactionMethod === 'transfer' ? 'rgba(96,165,250,0.06)' : 'rgba(74,222,128,0.05)', border: `1.5px solid ${transactionMethod === 'transfer' ? 'rgba(96,165,250,0.3)' : 'rgba(74,222,128,0.2)'}`, borderRadius: '16px', padding: '22px 26px' }}>
        <div style={{ fontSize: '14px', fontWeight: 900, color: transactionMethod === 'transfer' ? '#60a5fa' : '#4ade80', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {transactionMethod === 'transfer' ? 'Rincian Setoran Transfer Bank' : 'Rincian Setoran Tunai'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Nominal Pokok Tabungan</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(amount)}</span>
          </div>
          {adminFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Biaya Administrasi</span>
              <span style={{ fontWeight: 800, color: '#cca334' }}>{fmt(adminFee)}</span>
            </div>
          )}
          {infaq > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Infaq & Sedekah</span>
              <span style={{ fontWeight: 800, color: '#4ade80' }}>{fmt(infaq)}</span>
            </div>
          )}
          {transactionMethod === 'transfer' && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#60a5fa', fontWeight: 700 }}>Kode Unik Verifikasi Transfer</span>
              <span style={{ fontWeight: 900, color: '#f3c653' }}>+{uniqueCode}</span>
            </div>
          )}
          <div style={{ height: '1px', background: transactionMethod === 'transfer' ? 'rgba(96,165,250,0.2)' : 'rgba(74,222,128,0.2)', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: 900 }}>
            <span>Total Setoran Wajib Bayar</span>
            <span style={{ color: transactionMethod === 'transfer' ? '#60a5fa' : '#4ade80' }}>{fmt(totalAmountToPay)}</span>
          </div>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}>
        <input type="checkbox" checked={printSlip} onChange={e => setPrintSlip(e.target.checked)} style={{ width: '22px', height: '22px', accentColor: '#f3c653' }} />
        Cetak Struk Setoran
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
        background: loading ? 'rgba(243,198,83,0.3)' : 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
        border: 'none', borderRadius: '16px', padding: '22px', color: loading ? 'var(--text-secondary)' : '#02130e',
        fontSize: '20px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
        letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.3s'
      }}>
        {loading ? 'MEMPROSES...' : 'PROSES SETORAN'}
      </button>
    </form>
  );
}

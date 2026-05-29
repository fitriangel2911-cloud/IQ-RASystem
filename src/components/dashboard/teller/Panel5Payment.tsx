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
}

interface Contract {
  id: string;
  type: string;
  amount: number;
  tenor_months: number;
  margin_ratio: number;
  status: string;
}

interface Panel5Props {
  selectedMember: Member | null;
  tellerName: string;
  onSuccess: () => void;
}

type PaymentMode = 'full' | 'partial' | 'advance';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function Panel5Payment({ selectedMember, tellerName, onSuccess }: Panel5Props) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
  const [partialAmount, setPartialAmount] = useState(0);
  const [displayPartial, setDisplayPartial] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [printSlip, setPrintSlip] = useState(true);

  // Transaction Method, Admin Fee, and voluntary infaq
  const [transactionMethod, setTransactionMethod] = useState<'tunai' | 'transfer'>('tunai');
  const adminFee = 15000;
  const [includeInfaq, setIncludeInfaq] = useState(true);
  const infaqVal = includeInfaq ? 10000 : 0;

  // Unique 3-digit code from phone/NIK if transfer
  const getUniqueCode = () => {
    if (transactionMethod !== 'transfer' || !selectedMember) return 0;
    const src = selectedMember.phone_number || selectedMember.nik || '';
    const digits = src.replace(/\D/g, '');
    return Number(digits.slice(-3)) || 0;
  };

  const uniqueCode = getUniqueCode();
  const selectedContract = contracts.find(c => c.id === selectedContractId);

  // Monthly installment simulation
  const monthlyInstallment = selectedContract
    ? Math.round((selectedContract.amount * (1 + selectedContract.margin_ratio)) / selectedContract.tenor_months)
    : 0;

  const baseAmount = paymentMode === 'full' ? monthlyInstallment : paymentMode === 'partial' ? partialAmount : monthlyInstallment * 2;
  const totalAmount = baseAmount + adminFee + infaqVal + uniqueCode;

  useEffect(() => {
    if (!selectedMember) return;
    setLoadingContracts(true);
    const fetchContracts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('financing_contracts')
        .select('*')
        .eq('member_id', selectedMember.user_id)
        .eq('status', 'active');
      setContracts(data || []);
      setLoadingContracts(false);
    };
    fetchContracts();
  }, [selectedMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) { setMessage({ type: 'error', text: 'Pilih anggota di Panel [2].' }); return; }
    if (baseAmount <= 0) { setMessage({ type: 'error', text: 'Masukkan nominal angsuran yang valid.' }); return; }

    setLoading(true); setMessage(null);
    try {
      const memberName = selectedMember.users?.full_name || 'Anggota';
      const refNo = `TLR-ANG-${Date.now()}`;
      const modeLabel = paymentMode === 'full' ? 'Sesuai Tagihan' : paymentMode === 'partial' ? 'Bayar Sebagian' : 'Uang Muka';
      const methodLabel = transactionMethod === 'tunai' ? 'TUNAI' : 'TRANSFER BANK';

      const debitAccount = transactionMethod === 'transfer' ? COA.CASH_IN_BANK : COA.CASH_ON_HAND;
      
      const entries = [
        { account_code: debitAccount, debit: totalAmount, credit: 0 },
        { account_code: COA.RECEIVABLE_MURABAHAH, debit: 0, credit: baseAmount },
        { account_code: COA.INCOME_SERVICE_FEE, debit: 0, credit: adminFee }
      ];

      if (infaqVal + uniqueCode > 0) {
        entries.push({ account_code: COA.RETAINED_EARNINGS, debit: 0, credit: infaqVal + uniqueCode });
      }

      const res = await fetch('/api/accounting/record-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          description: `[TELLER: ${tellerName}] ANGSURAN ${methodLabel} - ${memberName} (${modeLabel} | Pokok: ${fmt(baseAmount)}, ADM: ${fmt(adminFee)}, Infaq+Kode: ${fmt(infaqVal + uniqueCode)})`,
          entries,
          reference_no: refNo,
          member_id: selectedMember.user_id,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat transaksi');

      if (printSlip) {
        const win = window.open('', '_blank', 'width=380,height=700');
        if (win) {
          win.document.write(`
            <html><head><title>Struk Angsuran</title>
            <style>body{font-family:'Courier New',monospace;font-size:13px;padding:16px;max-width:300px;margin:0 auto;}.center{text-align:center;}.bold{font-weight:bold;}.line{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;margin:4px 0;}.title{font-size:18px;font-weight:bold;text-align:center;margin:8px 0;}</style>
            </head><body>
            <div class="title">KOPERASI SYARIAH IQ-RA</div>
            <div class="center">Struk Pembayaran Angsuran</div>
            <div class="line"></div>
            <div class="row"><span>Tanggal</span><span>${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
            <div class="row"><span>No. Ref</span><span>${refNo}</span></div>
            <div class="row"><span>Petugas</span><span>${tellerName}</span></div>
            <div class="line"></div>
            <div class="row"><span>Nama</span><span>${memberName}</span></div>
            <div class="row"><span>NIK</span><span>${selectedMember.nik}</span></div>
            <div class="row"><span>Mode Bayar</span><span>${modeLabel} (${methodLabel})</span></div>
            <div class="line"></div>
            <div class="row"><span>Angsuran Pokok</span><span>${fmt(baseAmount)}</span></div>
            <div class="row"><span>Biaya Admin</span><span>${fmt(adminFee)}</span></div>
            <div class="row"><span>Infaq &amp; Sedekah</span><span>${fmt(infaqVal)}</span></div>
            <div class="row"><span>Kode Unik</span><span>${fmt(uniqueCode)}</span></div>
            <div class="line"></div>
            <div class="row bold"><span>TOTAL SETOR</span><span>${fmt(totalAmount)}</span></div>
            <div class="line"></div>
            <div class="center">Terima kasih.</div>
            <div class="center">Barakallahu fiikum.</div>
            <script>window.print();window.close();</script>
            </body></html>
          `);
          win.document.close();
        }
      }

      setMessage({ type: 'success', text: `Angsuran ${fmt(totalAmount)} berhasil! Ref: ${refNo}` });
      setPartialAmount(0); setDisplayPartial('');
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: `ERROR: ${err.message}` });
    } finally { setLoading(false); }
  };

  if (!selectedMember) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '2px dashed rgba(243,198,83,0.3)', borderRadius: '20px', padding: '80px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '15px' }}>Pilih anggota di Panel [2] Cari Anggota terlebih dahulu.</div>
      </div>
    );
  }

  const CONTRACT_TYPE_LABELS: Record<string, string> = {
    murabahah: 'Murabahah', mudharabah: 'Mudharabah', musyarakah: 'Musyarakah',
    ijarah: 'Ijarah', istishna: "Istishna'", qardhul_hasan: 'Qardhul Hasan',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Transaction Method */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Metode Transaksi</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {([
            { value: 'tunai', label: 'Tunai (Kas / Laci Teller)', color: '#4ade80' },
            { value: 'transfer', label: 'Transfer Bank (Virtual Account)', color: '#60a5fa' },
          ] as const).map(opt => (
            <button key={opt.value} type="button" onClick={() => setTransactionMethod(opt.value)} style={{
              flex: 1, padding: '16px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
              background: transactionMethod === opt.value ? `${opt.color}18` : 'var(--border-primary)',
              border: `2px solid ${transactionMethod === opt.value ? opt.color : 'transparent'}`,
              color: transactionMethod === opt.value ? opt.color : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Contract Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Kontrak Aktif</label>
        {loadingContracts ? (
          <div style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '15px' }}>Memuat kontrak...</div>
        ) : contracts.length === 0 ? (
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed var(--border-primary)', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '15px' }}>
            Anggota ini tidak memiliki kontrak pembiayaan aktif.
          </div>
        ) : (
          <select value={selectedContractId} onChange={e => setSelectedContractId(e.target.value)} style={{
            width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)',
            borderRadius: '12px', padding: '14px 18px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, outline: 'none'
          }}>
            <option value="">-- Pilih Kontrak --</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id} style={{ color: '#000' }}>
                {CONTRACT_TYPE_LABELS[c.type] || c.type} — {fmt(c.amount)} / {c.tenor_months} bulan
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Contract Detail */}
      {selectedContract && (
        <div style={{ background: 'rgba(243,198,83,0.05)', border: '1px solid rgba(243,198,83,0.2)', borderRadius: '14px', padding: '18px 22px' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#f3c653', marginBottom: '12px', textTransform: 'uppercase' }}>Rincian Tagihan Bulan Ini</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '15px' }}>
            {[
              ['Angsuran Pokok + Margin', fmt(monthlyInstallment)],
              ['Tenor', `${selectedContract.tenor_months} bulan`],
              ['Margin', `${(selectedContract.margin_ratio * 100).toFixed(1)}%`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{k}</span>
                <span style={{ fontWeight: 800 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Mode */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Mode Pembayaran</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {([
            { value: 'full', label: 'Sesuai Tagihan', color: '#4ade80' },
            { value: 'partial', label: 'Bayar Sebagian', color: '#f3c653' },
            { value: 'advance', label: 'Uang Muka (2x)', color: '#a78bfa' },
          ] as { value: PaymentMode; label: string; color: string }[]).map(opt => (
            <button key={opt.value} type="button" onClick={() => setPaymentMode(opt.value)} style={{
              flex: 1, padding: '14px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
              background: paymentMode === opt.value ? `${opt.color}18` : 'var(--border-primary)',
              border: `2px solid ${paymentMode === opt.value ? opt.color : 'transparent'}`,
              color: paymentMode === opt.value ? opt.color : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Partial Amount Input */}
      {paymentMode === 'partial' && (
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nominal Sebagian</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', fontWeight: 900, color: '#f3c653' }}>Rp</span>
            <input type="text" value={displayPartial} onChange={e => {
              const numeric = e.target.value.replace(/\D/g, '');
              setPartialAmount(Number(numeric));
              setDisplayPartial(numeric ? Number(numeric).toLocaleString('id-ID') : '');
            }} placeholder="0"
              style={{
                width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)',
                borderRadius: '14px', padding: '18px 18px 18px 56px', color: 'var(--text-primary)',
                fontSize: '28px', fontWeight: 900, outline: 'none'
              }}
              onFocus={e => { e.target.style.borderColor = '#f3c653'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-primary)'; }}
            />
          </div>
        </div>
      )}

      {/* Optional Customizable Fees */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#cca334', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Biaya Admin (Wajib)</label>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', padding: '10px 0' }}>
            {fmt(adminFee)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#cca334', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Infaq & Sedekah (Sukarela)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#4ade80' }}>
            <input type="checkbox" checked={includeInfaq} onChange={e => setIncludeInfaq(e.target.checked)} style={{ width: '22px', height: '22px', accentColor: '#4ade80' }} />
            Sertakan Infaq {fmt(10000)}
          </label>
        </div>
      </div>

      {/* Total Billing Canvas */}
      <div style={{ background: transactionMethod === 'transfer' ? 'rgba(96,165,250,0.06)' : 'rgba(74,222,128,0.05)', border: `1.5px solid ${transactionMethod === 'transfer' ? 'rgba(96,165,250,0.3)' : 'rgba(74,222,128,0.2)'}`, borderRadius: '16px', padding: '20px 24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 900, color: transactionMethod === 'transfer' ? '#60a5fa' : '#4ade80', marginBottom: '14px', textTransform: 'uppercase' }}>
          {transactionMethod === 'transfer' ? 'Rincian Angsuran Transfer Bank' : 'Rincian Angsuran Tunai'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '15px' }}>
          {[
            ['Angsuran Pokok', fmt(baseAmount), 'var(--text-primary)'],
            ['Biaya Administrasi (Wajib)', fmt(adminFee), '#cca334'],
            ['Infaq & Sedekah (Sukarela)', fmt(infaqVal), includeInfaq ? '#4ade80' : 'var(--text-secondary)'],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{k}</span>
              <span style={{ fontWeight: 800, color: c }}>{v}</span>
            </div>
          ))}
          {transactionMethod === 'transfer' && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#60a5fa', fontWeight: 700 }}>Kode Unik Verifikasi Transfer</span>
              <span style={{ fontWeight: 900, color: '#f3c653' }}>+{uniqueCode}</span>
            </div>
          )}
          <div style={{ height: '1px', background: transactionMethod === 'transfer' ? 'rgba(96,165,250,0.2)' : 'rgba(74,222,128,0.2)', margin: '6px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 900 }}>
            <span>Total Wajib Bayar</span>
            <span style={{ color: transactionMethod === 'transfer' ? '#60a5fa' : '#4ade80' }}>{fmt(totalAmount)}</span>
          </div>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
        <input type="checkbox" checked={printSlip} onChange={e => setPrintSlip(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#f3c653' }} />
        Cetak Struk Angsuran
      </label>

      {message && (
        <div style={{
          padding: '14px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
          background: message.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1.5px solid ${message.type === 'success' ? '#4ade80' : '#ef4444'}`,
          color: message.type === 'success' ? '#4ade80' : '#fca5a5'
        }}>{message.text}</div>
      )}

      <button type="submit" disabled={loading} style={{
        background: loading ? 'rgba(243,198,83,0.3)' : (transactionMethod === 'transfer' ? 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)' : 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)'),
        border: 'none', borderRadius: '16px', padding: '20px', color: '#fff',
        fontSize: '18px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
        letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.3s'
      }}>
        {loading ? 'MEMPROSES...' : `PROSES ANGSURAN ${fmt(totalAmount)}`}
      </button>
    </form>
  );
}

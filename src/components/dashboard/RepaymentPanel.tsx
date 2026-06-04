'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RepaymentPanelProps {
  profile: any;
  accounts: any[];
  contracts: any[];
  onPaymentSuccess: () => void;
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function RepaymentPanel({ profile, accounts, contracts, onPaymentSuccess }: RepaymentPanelProps) {
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Transfer payment logic
  const adminFee = 10000;
  const [uniqueCode, setUniqueCode] = useState(0);

  useEffect(() => {
    const active = contracts.filter(c => c.status === 'active');
    setActiveContracts(active);
    if (active.length > 0) {
      setSelectedContractId(active[0].id);
    }
  }, [contracts]);

  useEffect(() => {
    if (!selectedContractId) return;
    const fetchSchedules = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('financing_schedules')
        .select('*')
        .eq('contract_id', selectedContractId)
        .order('installment_number', { ascending: true });
      
      setSchedules(data || []);
      setUniqueCode(Math.floor(100 + Math.random() * 900));
    };
    fetchSchedules();
  }, [selectedContractId]);

  const selectedContract = activeContracts.find(c => c.id === selectedContractId);
  const pendingSchedules = schedules.filter(s => s.status === 'pending');
  const nextSchedule = pendingSchedules.length > 0 ? pendingSchedules[0] : null;

  const handleConfirmPayment = async () => {
    if (!nextSchedule) return;

    setLoading(true);
    setMessage(null);

    const totalToPay = nextSchedule.total_installment + adminFee + uniqueCode;

    try {
      const res = await fetch('/api/members/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'installment',
          amount: nextSchedule.total_installment,
          adminFee,
          infaq: 0,
          uniqueCode,
          totalPaid: totalToPay,
          targetAccountType: 'angsuran',
          metadata: {
            contract_id: selectedContractId,
            schedule_id: nextSchedule.id,
            installment_number: nextSchedule.installment_number
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses pembayaran angsuran.');
      }

      setReceiptData({
        refNo: data.referenceNo,
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        contractType: selectedContract?.type,
        installmentNumber: nextSchedule.installment_number,
        amount: nextSchedule.total_installment,
        adminFee,
        uniqueCode,
        totalPaid: totalToPay
      });

      setMessage({
        type: 'success',
        text: 'Pengajuan pembayaran angsuran Anda sedang diproses (PENDING). Silakan transfer ke rekening Koperasi dan konfirmasi via WA.'
      });

      onPaymentSuccess();

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (activeContracts.length === 0) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '24px', padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0' }}>Tidak Ada Pembiayaan Aktif</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Anda saat ini tidak memiliki tanggungan pembiayaan yang perlu diangsur.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', animation: 'fadeIn 0.5s ease-out' }}>
      {message && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ 
            padding: '30px', borderRadius: '24px', maxWidth: '400px', width: '90%',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: `2px solid ${message.type === 'error' ? '#ef4444' : 'var(--gold-intense)'}`,
            fontWeight: 700, textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            transform: 'scale(1)',
            transition: 'all 0.2s ease-out'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {message.type === 'error' ? '❌' : '✅'}
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-primary)' }}>
              {message.type === 'error' ? 'Terjadi Kesalahan' : 'Berhasil'}
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {message.text}
            </p>
            <button
              onClick={() => setMessage(null)}
              style={{
                width: '100%', padding: '14px', background: message.type === 'error' ? '#ef4444' : 'var(--gold-gradient)',
                color: message.type === 'error' ? '#fff' : '#02130e',
                border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer',
                boxShadow: '0 4px 12px var(--shadow-color)'
              }}
            >
              MENGERTI & TUTUP
            </button>
          </div>
        </div>
      )}

      {/* Col 1: Schedule & Contracts */}
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
          Jadwal Angsuran Anda
        </h3>

        <select 
          value={selectedContractId} 
          onChange={(e) => setSelectedContractId(e.target.value)}
          style={{
            padding: '16px', borderRadius: '14px', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)',
            color: 'var(--text-primary)', fontSize: '15px', fontWeight: 800, outline: 'none'
          }}
        >
          {activeContracts.map(c => (
            <option key={c.id} value={c.id}>Akad {c.type.toUpperCase()} - Plafon {fmt(c.amount)}</option>
          ))}
        </select>

        {schedules.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Jadwal belum tersedia atau sedang dibuat.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
            {schedules.map(s => {
              const isPaid = s.status === 'paid';
              const isNext = nextSchedule?.id === s.id;
              
              return (
                <div key={s.id} style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '16px', alignItems: 'center',
                  background: isNext ? 'rgba(52, 211, 153, 0.1)' : 'var(--bg-page)',
                  border: `1.5px solid ${isNext ? '#34d399' : 'var(--border-primary)'}`,
                  padding: '16px', borderRadius: '16px',
                  opacity: isPaid ? 0.6 : 1
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: isPaid ? '#10b981' : 'var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: isPaid ? '#fff' : 'var(--text-primary)',
                    border: `2px solid ${isPaid ? '#10b981' : 'var(--border-primary)'}`
                  }}>
                    {isPaid ? '✓' : s.installment_number}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>Jatuh Tempo: {new Date(s.due_date).toLocaleDateString('id-ID')}</div>
                    <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 900 }}>{fmt(s.total_installment)}</div>
                  </div>
                  <div>
                    {isPaid ? (
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>LUNAS</span>
                    ) : isNext ? (
                      <span style={{ fontSize: '12px', background: '#34d399', color: '#02130e', padding: '4px 10px', borderRadius: '8px', fontWeight: 800 }}>TAGIHAN AKTIF</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800 }}>PENDING</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Col 2: Payment Action */}
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
          Pembayaran Tagihan
        </h3>

        {!nextSchedule ? (
          <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-primary)', borderRadius: '16px' }}>
            <span style={{ fontSize: '40px' }}>🎉</span>
            <div style={{ color: '#34d399', fontWeight: 900, fontSize: '18px', marginTop: '10px' }}>PEMBIAYAAN LUNAS!</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '5px' }}>Semua tagihan untuk pembiayaan ini telah dibayar lunas.</div>
          </div>
        ) : receiptData ? (
          <div style={{
            background: 'rgba(74, 222, 128, 0.05)', border: '2px solid #4ade80', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeInUp 0.4s ease-out'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '1.5px dashed var(--border-primary)', paddingBottom: '16px' }}>
              <h4 style={{ color: '#4ade80', margin: '0', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Menunggu Verifikasi Pembayaran
              </h4>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ref: {receiptData.refNo}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Angsuran Ke:</span>
                <span style={{ fontWeight: 700 }}>{receiptData.installmentNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Nominal Tagihan:</span>
                <span style={{ fontWeight: 700 }}>{fmt(receiptData.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Biaya Admin:</span>
                <span style={{ fontWeight: 700 }}>{fmt(receiptData.adminFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Kode Unik:</span>
                <span style={{ fontWeight: 700 }}>+{receiptData.uniqueCode}</span>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
                <span>Total Transfer:</span>
                <span style={{ color: '#4ade80' }}>{fmt(receiptData.totalPaid)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <a
                href={`https://wa.me/6285713473576?text=${encodeURIComponent(`Halo CS IQ-RA, saya ${profile?.users?.full_name} ingin konfirmasi pembayaran Angsuran ke-${receiptData.installmentNumber} (${receiptData.contractType}) sebesar ${fmt(receiptData.totalPaid)}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366', color: '#ffffff', border: 'none', textDecoration: 'none',
                  padding: '14px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >💬 Konfirmasi WA Ke CS</a>
              <button
                onClick={() => { setReceiptData(null); onPaymentSuccess(); }}
                style={{ background: 'transparent', border: '1px solid var(--border-primary)', padding: '12px', borderRadius: '10px', color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer' }}
              >Selesai</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>REKENING KOPERASI</span>
                <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>BSI - 7711-2299-11</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>TOTAL TRANSFER (PERSIS)</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#60a5fa' }}>{fmt(nextSchedule.total_installment + adminFee + uniqueCode)}</span>
                  <button
                    onClick={() => copyToClipboard((nextSchedule.total_installment + adminFee + uniqueCode).toString())}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid var(--border-primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer' }}
                  >Salin</button>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)', borderRadius: '16px', padding: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              💡 <b>INFO:</b> Transfer tepat sesuai nominal yang tercantum (termasuk kode unik di belakang) agar sistem dapat melunasi tagihan Anda secara instan.
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              style={{
                width: '100%', padding: '18px', borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(243, 198, 83, 0.3)' : 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                color: loading ? 'var(--text-secondary)' : '#02130e', border: 'none',
                fontWeight: 900, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 'auto'
              }}
            >
              {loading ? 'MEMPROSES...' : 'SAYA SUDAH TRANSFER'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

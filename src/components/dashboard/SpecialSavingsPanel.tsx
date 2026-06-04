'use client';

import React, { useState, useEffect } from 'react';

interface SpecialSavingsPanelProps {
  profile: any;
  accounts: any[];
  onPaymentSuccess: () => void;
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function SpecialSavingsPanel({ profile, accounts, onPaymentSuccess }: SpecialSavingsPanelProps) {
  const [savingsType, setSavingsType] = useState<'haji' | 'umrah'>('haji');
  const [amount, setAmount] = useState(500000);
  const [displayAmount, setDisplayAmount] = useState('500.000');
  const [adminFee, setAdminFee] = useState(10000); // Admin fee for special savings might be lower or same
  const [infaq, setInfaq] = useState(10000);
  const [uniqueCode, setUniqueCode] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<'acc' | 'amount' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    const code = Math.floor(100 + Math.random() * 900);
    setUniqueCode(code);
  }, [savingsType]);

  const handleManualAmount = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    const numValue = Number(numeric);
    setAmount(numValue);
    setDisplayAmount(numeric ? numValue.toLocaleString('id-ID') : '');
  };

  const copyToClipboard = (text: string, type: 'acc' | 'amount') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const totalAmountToPay = amount + adminFee + infaq + uniqueCode;

  const handleConfirmPayment = async () => {
    if (amount < 100000) {
      setMessage({ type: 'error', text: 'Minimal setoran awal/lanjutan Tabungan Bertujuan adalah Rp 100.000.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/members/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: `special_savings`,
          amount,
          adminFee,
          infaq,
          uniqueCode,
          totalPaid: totalAmountToPay,
          targetAccountType: savingsType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses pendaftaran tabungan.');
      }

      setReceiptData({
        refNo: data.referenceNo,
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        accountNumber: data.accountNumber,
        paymentType: 'special_savings',
        targetAccountType: savingsType,
        amount,
        adminFee,
        infaq,
        uniqueCode,
        totalPaid: totalAmountToPay
      });

      setMessage({
        type: 'success',
        text: 'Pengajuan pembukaan/setoran Tabungan Bertujuan Anda sedang diproses (PENDING). Silakan transfer dan konfirmasi via WA.'
      });

      onPaymentSuccess();

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!receiptData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bukti Tabungan Bertujuan - IQ-RA</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 13px; padding: 20px; color: #000; background: #fff; max-width: 350px; margin: 0 auto; }
            .center { text-align: center; } .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .title { font-size: 18px; font-weight: bold; text-align: center; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="title">KOPERASI SYARIAH IQ-RA</div>
          <div class="center">Bukti Tabungan Bertujuan</div>
          <div class="line"></div>
          <div class="row"><span>Tanggal</span><span>${receiptData.date}</span></div>
          <div class="row"><span>No. Ref</span><span>${receiptData.refNo}</span></div>
          <div class="row"><span>Anggota</span><span>${profile?.users?.full_name || 'Anggota'}</span></div>
          <div class="line"></div>
          <div class="row"><span>Program</span><span>Tabungan ${receiptData.targetAccountType.toUpperCase()}</span></div>
          <div class="row"><span>Setoran</span><span>${fmt(receiptData.amount)}</span></div>
          <div class="row"><span>Biaya Admin</span><span>${fmt(receiptData.adminFee)}</span></div>
          <div class="row"><span>Infaq</span><span>${fmt(receiptData.infaq)}</span></div>
          <div class="row"><span>Kode Unik</span><span>+${receiptData.uniqueCode}</span></div>
          <div class="line"></div>
          <div class="row bold"><span>TOTAL SETOR</span><span>${fmt(receiptData.totalPaid)}</span></div>
          <div class="line"></div>
          <div class="center">Menunggu Verifikasi Pembayaran.</div>
          <div class="center">Silakan transfer sesuai Total Setor.</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const hasHaji = accounts.some(a => a.account_type === 'haji');
  const hasUmrah = accounts.some(a => a.account_type === 'umrah');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', animation: 'fadeIn 0.5s ease-out' }}>
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

      {/* Col 1: Form & Selection */}
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
          Formulir Tabungan Bertujuan
        </h3>

        {/* Existing Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{
            background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
            borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>REKENING HAJI</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: hasHaji ? '#10b981' : 'var(--text-secondary)' }}>
              {hasHaji ? 'AKTIF' : 'BELUM BUKA'}
            </span>
          </div>

          <div style={{
            background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
            borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>REKENING UMRAH</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: hasUmrah ? '#10b981' : 'var(--text-secondary)' }}>
              {hasUmrah ? 'AKTIF' : 'BELUM BUKA'}
            </span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
            Pilih Program Simpanan
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { setSavingsType('haji'); setAmount(hasHaji ? 100000 : 500000); setDisplayAmount(hasHaji ? '100.000' : '500.000'); }}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                background: savingsType === 'haji' ? 'rgba(243, 198, 83, 0.12)' : 'var(--bg-page)',
                border: `2px solid ${savingsType === 'haji' ? 'var(--gold-bright)' : 'var(--border-primary)'}`,
                color: savingsType === 'haji' ? 'var(--gold-bright)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              Tabungan Haji
            </button>

            <button
              onClick={() => { setSavingsType('umrah'); setAmount(hasUmrah ? 100000 : 500000); setDisplayAmount(hasUmrah ? '100.000' : '500.000'); }}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                background: savingsType === 'umrah' ? 'rgba(243, 198, 83, 0.12)' : 'var(--bg-page)',
                border: `2px solid ${savingsType === 'umrah' ? 'var(--gold-bright)' : 'var(--border-primary)'}`,
                color: savingsType === 'umrah' ? 'var(--gold-bright)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              Tabungan Umrah
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
            Nominal Setoran (Min: Rp 100.000)
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
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Biaya Admin Transaksi
            </label>
            <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', fontWeight: 700 }}>
              {fmt(adminFee)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Infaq / Sedekah (Opsional)
            </label>
            <input
              type="number"
              value={infaq}
              onChange={(e) => setInfaq(Number(e.target.value))}
              style={{
                width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
                borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', fontWeight: 700, outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Col 2: Preview & Payment Details */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-primary)',
        borderRadius: '24px',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '24px'
      }}>
        {receiptData ? (
          <div style={{
            background: 'rgba(74, 222, 128, 0.05)',
            border: '2px solid #4ade80',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeInUp 0.4s ease-out'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '1.5px dashed var(--border-primary)', paddingBottom: '16px' }}>
              <span style={{ fontSize: '40px' }}>📜</span>
              <h4 style={{ color: '#4ade80', margin: '8px 0 0 0', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Pengajuan Berhasil (Pending)
              </h4>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ref: {receiptData.refNo}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Program Simpanan:</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{receiptData.targetAccountType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Nominal Setoran:</span>
                <span style={{ fontWeight: 700 }}>{fmt(receiptData.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Biaya Admin:</span>
                <span style={{ fontWeight: 700 }}>{fmt(receiptData.adminFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Infaq & Kode Unik:</span>
                <span style={{ fontWeight: 700 }}>{fmt(receiptData.infaq + receiptData.uniqueCode)}</span>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
                <span>Total Transfer:</span>
                <span style={{ color: '#4ade80' }}>{fmt(receiptData.totalPaid)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <a
                href={`https://wa.me/6285713473576?text=${encodeURIComponent(`Halo Admin KSPPS IQ-RA, saya ${profile?.users?.full_name || 'Anggota'} telah mengajukan Tabungan ${receiptData.targetAccountType.toUpperCase()} sebesar Rp ${receiptData.totalPaid.toLocaleString('id-ID')} dengan No. Ref: ${receiptData.refNo}. Mohon verifikasinya.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366', color: '#ffffff', border: 'none', textDecoration: 'none',
                  padding: '14px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
                }}
              >
                💬 Konfirmasi WA Ke CS Koperasi
              </a>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={handlePrintReceipt}
                  style={{
                    background: '#4ade80', color: '#02130e', border: 'none',
                    padding: '12px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  🖨️ Cetak Bukti
                </button>
                <button
                  onClick={() => { setReceiptData(null); onPaymentSuccess(); }}
                  style={{
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)', padding: '12px', borderRadius: '10px',
                    fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--gold-bright)', margin: 0, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Instruksi Transfer Dana
            </h4>

            <div style={{
              background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
              borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>REKENING KOPERASI</span>
                <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                  BSI - 7711-2299-11
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>a.n KSPPS IQ-RA SEJAHTERA</span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>NOMINAL PERSIS (TERMASUK KODE UNIK)</span>
                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#60a5fa' }}>
                    {fmt(totalAmountToPay)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(totalAmountToPay.toString(), 'amount')}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1.5px solid var(--border-primary)',
                      padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: 'var(--text-primary)',
                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {copiedText === 'amount' ? 'Tersalin ✓' : 'Salin'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)',
              borderRadius: '16px', padding: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5
            }}>
              💡 <b>PENTING:</b> Jika rekening belum pernah dibuat, sistem akan membuatkan rekening baru (Haji/Umrah) secara otomatis setelah dana diverifikasi oleh Admin.
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              style={{
                width: '100%', padding: '18px', borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(243, 198, 83, 0.3)' : 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                color: loading ? 'var(--text-secondary)' : '#02130e', border: 'none',
                fontWeight: 900, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px',
                boxShadow: '0 10px 25px var(--shadow-color)', transition: 'all 0.2s', marginTop: 'auto'
              }}
            >
              {loading ? 'MEMPROSES...' : 'SAYA SUDAH TRANSFER PANA'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

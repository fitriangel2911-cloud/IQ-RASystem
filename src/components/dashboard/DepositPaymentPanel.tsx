'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DepositPaymentPanelProps {
  profile: any;
  accounts: any[];
  onPaymentSuccess: () => void;
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

export default function DepositPaymentPanel({ profile, accounts, onPaymentSuccess }: DepositPaymentPanelProps) {
  const [paymentType, setPaymentType] = useState<'principal' | 'mandatory' | 'voluntary'>('principal');
  const [amount, setAmount] = useState(300000);
  const [displayAmount, setDisplayAmount] = useState('300.000');
  const [adminFee, setAdminFee] = useState(2500);
  const [infaq, setInfaq] = useState(1500);
  const [uniqueCode, setUniqueCode] = useState(0);
  const [voluntaryAccount, setVoluntaryAccount] = useState<'wadiah' | 'mudharabah'>('wadiah');
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<'acc' | 'amount' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Generate unique code once on mount or when type changes
  useEffect(() => {
    const code = Math.floor(100 + Math.random() * 900);
    setUniqueCode(code);
  }, [paymentType]);

  // Handle template selections
  useEffect(() => {
    if (paymentType === 'principal') {
      setAmount(300000);
      setDisplayAmount('300.000');
      setAdminFee(2500);
    } else if (paymentType === 'mandatory') {
      setAmount(50000);
      setDisplayAmount('50.000');
      setAdminFee(2500);
    } else {
      setAmount(100000);
      setDisplayAmount('100.000');
      setAdminFee(2500);
    }
  }, [paymentType]);

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
    if (paymentType === 'voluntary' && amount < 10000) {
      setMessage({ type: 'error', text: 'Minimal setoran sukarela adalah Rp 10.000.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const targetAccountType = 
      paymentType === 'principal' 
        ? 'pokok' 
        : paymentType === 'mandatory' 
          ? 'wajib' 
          : voluntaryAccount;

    try {
      const res = await fetch('/api/members/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType,
          amount,
          adminFee,
          infaq,
          uniqueCode,
          totalPaid: totalAmountToPay,
          targetAccountType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses pembayaran.');
      }

      // Record successful receipt details
      setReceiptData({
        refNo: data.referenceNo,
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        accountNumber: data.accountNumber,
        paymentType,
        targetAccountType,
        amount,
        adminFee,
        infaq,
        uniqueCode,
        totalPaid: totalAmountToPay
      });

      setMessage({
        type: 'success',
        text: 'Pembayaran simpanan berhasil dikonfirmasi! Keanggotaan Anda telah terupdate secara otomatis.'
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

    const labelMap: Record<string, string> = {
      principal: 'Simpanan Pokok (Awal)',
      mandatory: 'Simpanan Wajib (Bulanan)',
      voluntary: 'Setoran Sukarela'
    };

    printWindow.document.write(`
      <html>
        <head>
          <title>Bukti Pembayaran Simpanan Online - IQ-RA</title>
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
          <div class="center">Bukti Setoran Online</div>
          <div class="line"></div>
          <div class="row"><span>Tanggal</span><span>${receiptData.date}</span></div>
          <div class="row"><span>No. Ref</span><span>${receiptData.refNo}</span></div>
          <div class="row"><span>Anggota</span><span>${profile?.users?.full_name || 'Anggota'}</span></div>
          <div class="row"><span>No. Rek</span><span>${receiptData.accountNumber}</span></div>
          <div class="line"></div>
          <div class="row"><span>Jenis Setoran</span><span>${labelMap[receiptData.paymentType]}</span></div>
          <div class="row"><span>Akad</span><span>${receiptData.targetAccountType.toUpperCase()}</span></div>
          <div class="row"><span>Nominal Setoran</span><span>${fmt(receiptData.amount)}</span></div>
          <div class="row"><span>Biaya Admin</span><span>${fmt(receiptData.adminFee)}</span></div>
          <div class="row"><span>Infaq/Sedekah</span><span>${fmt(receiptData.infaq)}</span></div>
          <div class="row"><span>Kode Unik</span><span>+${receiptData.uniqueCode}</span></div>
          <div class="line"></div>
          <div class="row bold"><span>TOTAL SETOR</span><span>${fmt(receiptData.totalPaid)}</span></div>
          <div class="line"></div>
          <div class="center">Setoran Online Mandiri Sukses.</div>
          <div class="center">Terima kasih atas partisipasi Anda.</div>
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Col 1: Deposit Status & Form */}
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
          Status Keanggotaan & Simpanan
        </h3>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{
            background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
            borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>SIMPANAN POKOK</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: profile?.paid_principal_deposit ? '#10b981' : '#ef4444' }}>
              {profile?.paid_principal_deposit ? 'LUNAS (Aktif)' : 'BELUM DIBAYAR'}
            </span>
          </div>

          <div style={{
            background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
            borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>SIMPANAN WAJIB</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: profile?.paid_mandatory_deposit ? '#10b981' : '#ef4444' }}>
              {profile?.paid_mandatory_deposit ? 'LUNAS (Bulan Ini)' : 'BELUM DIBAYAR'}
            </span>
          </div>
        </div>

        {/* Tabs for Payment Options */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
            Pilih Jenis Pembayaran
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setPaymentType('principal')}
              disabled={profile?.paid_principal_deposit}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                background: paymentType === 'principal' ? 'rgba(243, 198, 83, 0.12)' : 'var(--bg-page)',
                border: `2px solid ${paymentType === 'principal' ? 'var(--gold-bright)' : 'var(--border-primary)'}`,
                color: paymentType === 'principal' ? 'var(--gold-bright)' : 'var(--text-secondary)',
                opacity: profile?.paid_principal_deposit ? 0.4 : 1,
                transition: 'all 0.2s'
              }}
            >
              Pokok (Awal)
            </button>

            <button
              onClick={() => setPaymentType('mandatory')}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                background: paymentType === 'mandatory' ? 'rgba(243, 198, 83, 0.12)' : 'var(--bg-page)',
                border: `2px solid ${paymentType === 'mandatory' ? 'var(--gold-bright)' : 'var(--border-primary)'}`,
                color: paymentType === 'mandatory' ? 'var(--gold-bright)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              Wajib (Bulanan)
            </button>

            <button
              onClick={() => setPaymentType('voluntary')}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                background: paymentType === 'voluntary' ? 'rgba(243, 198, 83, 0.12)' : 'var(--bg-page)',
                border: `2px solid ${paymentType === 'voluntary' ? 'var(--gold-bright)' : 'var(--border-primary)'}`,
                color: paymentType === 'voluntary' ? 'var(--gold-bright)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              Setoran Sukarela
            </button>
          </div>
        </div>

        {/* Custom Input for voluntary or disabled amount view */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
            Nominal Pembayaran
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>Rp</span>
            <input
              type="text"
              value={displayAmount}
              onChange={(e) => handleManualAmount(e.target.value)}
              disabled={paymentType !== 'voluntary'}
              style={{
                width: '100%', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)',
                borderRadius: '14px', padding: '16px 16px 16px 45px', color: 'var(--text-primary)',
                fontSize: '20px', fontWeight: 900, outline: 'none',
                opacity: paymentType !== 'voluntary' ? 0.7 : 1
              }}
            />
          </div>
        </div>

        {/* If voluntary, choose account type */}
        {paymentType === 'voluntary' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
              Pilih Rekening Tujuan
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setVoluntaryAccount('wadiah')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  background: voluntaryAccount === 'wadiah' ? 'rgba(74, 222, 128, 0.1)' : 'var(--bg-page)',
                  border: `1.5px solid ${voluntaryAccount === 'wadiah' ? '#4ade80' : 'var(--border-primary)'}`,
                  color: voluntaryAccount === 'wadiah' ? '#4ade80' : 'var(--text-secondary)',
                }}
              >
                Tabungan Wadiah (Titipan)
              </button>
              <button
                type="button"
                onClick={() => setVoluntaryAccount('mudharabah')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  background: voluntaryAccount === 'mudharabah' ? 'rgba(96, 165, 250, 0.1)' : 'var(--bg-page)',
                  border: `1.5px solid ${voluntaryAccount === 'mudharabah' ? '#60a5fa' : 'var(--border-primary)'}`,
                  color: voluntaryAccount === 'mudharabah' ? '#60a5fa' : 'var(--text-secondary)',
                }}
              >
                Tabungan Mudharabah (Bagi Hasil)
              </button>
            </div>
          </div>
        )}

        {/* Fees configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Biaya Admin Transfer
            </label>
            <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', fontWeight: 700 }}>
              {fmt(adminFee)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
              Infaq & Sedekah
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

      {/* Col 2: Simulated Transfer Instructions & Action */}
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
          /* Receipt Card when payment succeeds */
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
                Setoran Terkonfirmasi
              </h4>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ref: {receiptData.refNo}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Rekening Tujuan:</span>
                <span style={{ fontWeight: 700 }}>{receiptData.accountNumber}</span>
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
                <span>Total Dana Diterima:</span>
                <span style={{ color: '#4ade80' }}>{fmt(receiptData.totalPaid)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={handlePrintReceipt}
                style={{
                  background: '#4ade80', color: '#02130e', border: 'none',
                  padding: '12px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                🖨️ Cetak Struk
              </button>
              <button
                onClick={() => setReceiptData(null)}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)', padding: '12px', borderRadius: '10px',
                  fontWeight: 800, cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          /* Transfer Details view */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--gold-bright)', margin: 0, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Petunjuk Transfer Bank
            </h4>

            <div style={{
              background: 'var(--bg-page)', border: '1px solid var(--border-primary)',
              borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>BANK TUJUAN</span>
                <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                  BANK SYARIAH INDONESIA (BSI)
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>NOMOR REKENING</span>
                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--gold-bright)', fontFamily: 'monospace' }}>
                    7711-2299-11
                  </span>
                  <button
                    onClick={() => copyToClipboard('7711229911', 'acc')}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1.5px solid var(--border-primary)',
                      padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: 'var(--text-primary)',
                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {copiedText === 'acc' ? 'Tersalin ✓' : 'Salin'}
                  </button>
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
                <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 700, marginTop: '4px' }}>
                  (Nominal pokok {fmt(amount)} + Admin {fmt(adminFee)} + Infaq {fmt(infaq)} + Kode Unik +{uniqueCode})
                </div>
              </div>
            </div>

            {/* Sharia compliance notice */}
            <div style={{
              background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)',
              borderRadius: '16px', padding: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5
            }}>
              💡 <b>PENTING:</b> Kode unik 3 digit terakhir (+{uniqueCode}) dimasukkan sebagai infaq sukarela dan berfungsi agar sistem otomatis mendeteksi transfer Anda secara instant tanpa perlu verifikasi manual di kantor.
            </div>
          </div>
        )}

        {/* System & Confirmation Status Messaging */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {message && !receiptData && (
            <div style={{
              padding: '12px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '13px',
              background: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1.5px solid ${message.type === 'success' ? '#4ade80' : '#ef4444'}`,
              color: message.type === 'success' ? '#4ade80' : '#fca5a5'
            }}>{message.text}</div>
          )}

          {!receiptData && (
            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              style={{
                width: '100%', padding: '18px', borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(243, 198, 83, 0.3)' : 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                color: loading ? 'var(--text-secondary)' : '#02130e', border: 'none',
                fontWeight: 900, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px',
                boxShadow: '0 10px 25px var(--shadow-color)', transition: 'all 0.2s'
              }}
            >
              {loading ? 'MEMVERIFIKASI...' : 'SAYA SUDAH TRANSFER (VERIFIKASI INSTANT)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

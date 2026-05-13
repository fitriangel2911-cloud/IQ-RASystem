'use client';
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FinancingPanelProps {
  contracts: any[];
  profile: any;
  onUpdateSuccess: () => void;
  navigateToProfile: () => void;
}

export default function FinancingPanel({ contracts, profile, onUpdateSuccess, navigateToProfile }: FinancingPanelProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [amount, setAmount] = useState<number>(5000000);
  const [contractType, setContractType] = useState<string>('murabahah');
  
  // Validation: Profile must have core docs
  const isProfileComplete = !!(profile?.nik && profile?.kk_number && profile?.mother_name && profile?.phone_number);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isProfileComplete) {
      alert('⚠️ Mohon maaf, dokumen Anda belum lengkap. Sesuai aturan, silakan lengkapi profil sebelum mengajukan.');
      return;
    }

    if (amount <= 0) {
      alert('❌ Jumlah pengajuan tidak valid.');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('financing_contracts')
        .insert({
          member_id: profile.user_id, // References users(id) in the schema
          type: contractType,
          amount: amount,
          status: 'pending'
        });

      if (error) throw error;

      alert('🎉 Alhamdulillah! Pengajuan Pembiayaan Syariah Anda Telah Dikirim.\nPetugas Account Officer kami akan meninjau permohonan Anda dalam waktu maksimal 3x24 jam.');
      setIsApplying(false);
      setAmount(5000000);
      onUpdateSuccess();
    } catch (err: any) {
      console.error('Apply Financing Error:', err);
      alert('❌ Terjadi kesalahan saat mengirim pengajuan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { label: '⏳ DALAM TINJAUAN', color: '#f3c653' };
      case 'approved': return { label: '✅ DISETUJUI', color: '#34d399' };
      case 'active': return { label: '💼 AKTIF (BERJALAN)', color: '#60a5fa' };
      case 'rejected': return { label: '❌ DITOLAK', color: '#ef4444' };
      case 'completed': return { label: '🏁 SELESAI (LUNAS)', color: '#ffffff' };
      default: return { label: status?.toUpperCase() || 'MENUNGGU', color: '#ffffff' };
    }
  };

  const getContractLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'murabahah': return 'Murabahah (Jual Beli)';
      case 'mudharabah': return 'Mudharabah (Bagi Hasil Usaha)';
      case 'musyarakah': return 'Musyarakah (Kerjasama Proyek)';
      case 'ijarah': return 'Ijarah (Sewa Jasa/Barang)';
      case 'istishna': return 'Istishna (Pemesanan Konstruksi)';
      case 'qardhul_hasan': return 'Qardhul Hasan (Pinjaman Kebajikan)';
      default: return type;
    }
  };

  const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#043121', marginBottom: '6px' }}>Kemitraan Pembiayaan Syariah</h2>
          <p style={{ color: '#4b5563', fontSize: '15px', fontWeight: 600, margin: 0 }}>Kelola dan pantau seluruh akad pembiayaan syariah yang Anda ajukan di IQ-RA.</p>
        </div>

        {!isApplying && (
          <button
            onClick={() => setIsApplying(true)}
            style={{
              background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
              color: '#02130e',
              border: 'none',
              padding: '16px 30px',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(204, 163, 52, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🤝 Ajukan Pembiayaan Baru
          </button>
        )}
      </div>

      {/* NEW APPLICATION FORM SECTION */}
      {isApplying && (
        <div style={{
          background: '#032419',
          border: '3px solid #cca334',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '2px solid rgba(204, 163, 52, 0.2)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#f3c653', margin: 0 }}>Formulir Permohonan Pembiayaan</h3>
            <button onClick={() => setIsApplying(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          </div>

          {!isProfileComplete ? (
            /* BLOCKER STATE FOR MISSING DOCUMENTS */
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🛡️</div>
              <h4 style={{ color: '#fca5a5', fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Akses Pengajuan Terkunci</h4>
              <p style={{ color: '#ffffff', fontSize: '15px', maxWidth: '500px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                Mohon maaf, demi kepatuhan regulasi KYC Perbankan Syariah dan penilaian kelayakan akad, Anda <strong>WAJIB</strong> melengkapi berkas profil & identitas fisik Anda terlebih dahulu.
              </p>
              <button
                onClick={navigateToProfile}
                style={{
                  background: '#f3c653', color: '#02130e',
                  border: 'none', padding: '14px 36px', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(243, 198, 83, 0.3)'
                }}
              >
                ✍️ Lengkapi Dokumen Sekarang
              </button>
            </div>
          ) : (
            /* INPUT FORM */
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Product Select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#cca334' }}>Akad Pembiayaan Syariah</label>
                  <select 
                    value={contractType}
                    onChange={e => setContractType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="murabahah">Murabahah (Jual Beli Barang)</option>
                    <option value="mudharabah">Mudharabah (Penyertaan Modal Kerja)</option>
                    <option value="musyarakah">Musyarakah (Bagi Hasil Syirkah Proyek)</option>
                    <option value="ijarah">Ijarah (Pembiayaan Sewa / Multi Jasa)</option>
                    <option value="istishna">Istishna (Konstruksi Bertahap)</option>
                    <option value="qardhul_hasan">Qardhul Hasan (Pinjaman Sosial Tanpa Tambahan)</option>
                  </select>
                </div>

                {/* Amount Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#cca334' }}>Jumlah Pengajuan Pembiayaan (Rp)</label>
                  <input 
                    type="number" required min={100000} step={100000}
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    style={inputStyle}
                    placeholder="Contoh: 10000000"
                  />
                </div>
              </div>

              {/* Sharia Disclaimer */}
              <div style={{
                background: 'rgba(243, 198, 83, 0.05)',
                border: '1px solid rgba(243, 198, 83, 0.2)',
                borderRadius: '14px',
                padding: '20px',
                fontSize: '13px',
                color: '#ffffff',
                lineHeight: 1.6
              }}>
                ℹ️ <strong>Catatan Penting Fatwa DSN-MUI:</strong> Melalui penyerahan formulir ini, Anda menyatakan kesediaan untuk tunduk pada ketentuan akad hukum Syariah terkait produk pilihan Anda, bebas dari unsur Riba, Gharar, dan Maisir. Persetujuan final tunduk pada analisis tim audit internal.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button
                  type="button" onClick={() => setIsApplying(false)}
                  style={{
                    background: 'transparent', border: '2px solid rgba(255,255,255,0.2)',
                    color: '#ffffff', padding: '14px 24px', borderRadius: '12px',
                    fontSize: '15px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Batalkan
                </button>
                <button
                  type="submit" disabled={submitting}
                  style={{
                    background: '#34d399', border: 'none',
                    color: '#02130e', padding: '14px 40px', borderRadius: '12px',
                    fontSize: '15px', fontWeight: 900, cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(52, 211, 153, 0.3)'
                  }}
                >
                  {submitting ? '⏳ Mengirim Pengajuan...' : '🚀 Ajukan Berkas Sekarang'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* LIST OF EXISTING CONTRACTS */}
      <div style={{
        background: '#032419',
        border: '3px solid #cca334',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
      }}>
        <div style={{ padding: '24px 30px', borderBottom: '2px solid rgba(204, 163, 52, 0.2)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#f3c653', margin: 0 }}>Status Seluruh Pengajuan Anda</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#021c13', borderBottom: '2px solid #cca334' }}>
                <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px' }}>Tanggal Pengajuan</th>
                <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px' }}>Produk Akad</th>
                <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px' }}>Jumlah Diajukan</th>
                <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Status Audit</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '16px', fontWeight: 600 }}>
                    Belum ada riwayat permohonan pembiayaan.<br/>
                    <span style={{ fontSize: '13px', color: '#cca334', display: 'inline-block', marginTop: '8px' }}>Ajukan kemitraan Syariah Anda dengan mengeklik tombol di sudut kanan atas.</span>
                  </td>
                </tr>
              ) : (
                contracts.map((con, idx) => {
                  const st = formatStatus(con.status);
                  const dateObj = new Date(con.created_at);
                  return (
                    <tr 
                      key={con.id}
                      style={{
                        borderBottom: '1px solid rgba(204, 163, 52, 0.1)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: '20px', color: '#ffffff', fontSize: '15px', fontWeight: 700 }}>
                        {dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>

                      {/* Product Type */}
                      <td style={{ padding: '20px', color: '#ffffff', fontSize: '15px', fontWeight: 800 }}>
                        {getContractLabel(con.type)}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '20px', color: '#ffffff', fontSize: '16px', fontWeight: 900 }}>
                        {currencyFormatter.format(con.amount)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '20px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 900,
                          letterSpacing: '0.5px',
                          border: `1.5px solid ${st.color}`,
                          color: st.color,
                          background: 'rgba(0,0,0,0.2)'
                        }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

const inputStyle = {
  background: '#ffffff',
  border: '2px solid #cca334',
  borderRadius: '12px',
  padding: '14px 16px',
  color: '#02130e',
  fontSize: '15px',
  fontWeight: 700,
  outline: 'none',
  width: '100%'
};

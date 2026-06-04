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
  const [purpose, setPurpose] = useState<string>('');
  
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
      case 'pending': return { label: '⏳ DALAM TINJAUAN', color: 'var(--text-primary)' };
      case 'approved': return { label: '✅ DISETUJUI', color: '#10b981' };
      case 'active': return { label: '💼 AKTIF (BERJALAN)', color: '#3b82f6' };
      case 'rejected': return { label: '❌ DITOLAK', color: '#ef4444' };
      case 'completed': return { label: '🏁 SELESAI (LUNAS)', color: 'var(--text-primary)' };
      default: return { label: status?.toUpperCase() || 'MENUNGGU', color: 'var(--text-primary)' };
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
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '6px' }}>Kemitraan Pembiayaan Syariah</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600, margin: 0 }}>Kelola dan pantau seluruh akad pembiayaan syariah yang Anda ajukan di iQ-RA.</p>
        </div>
        <button 
          onClick={() => setIsApplying(!isApplying)}
          style={{
            background: isApplying ? 'rgba(239, 68, 68, 0.1)' : 'var(--text-primary)',
            color: isApplying ? '#ef4444' : 'var(--bg-page)',
            border: isApplying ? '2px solid #ef4444' : 'none',
            padding: '16px 28px',
            borderRadius: '16px',
            fontWeight: 900,
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 10px 25px var(--shadow-color)',
            transition: 'all 0.3s'
          }}
        >
          {isApplying ? '✕ Batalkan' : '🤝 Ajukan Pembiayaan Baru'}
        </button>
      </div>

      {/* Application Form */}
      {isApplying && (
        <div style={{ 
          background: 'var(--bg-card)', 
          backdropFilter: 'blur(32px)', 
          borderRadius: '32px', 
          padding: '44px',
          border: '1px solid var(--border-primary)',
          boxShadow: '0 30px 70px var(--shadow-color)',
          animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {!isProfileComplete && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1.5px solid #ef4444', 
              borderRadius: '16px', 
              padding: '20px', 
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
              <div>
                <div style={{ color: '#ef4444', fontWeight: 900, fontSize: '16px' }}>Lengkapi Profil Anda Terlebih Dahulu</div>
                <button 
                  onClick={navigateToProfile}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: 0, fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', fontSize: '14px', marginTop: '4px' }}
                >
                  Ke Halaman Profil & Dokumen ↗
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleApply}>
            {/* Formulir Data Pribadi & Pembiayaan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>Jumlah Pembiayaan (Rp)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Contoh: 5000000" 
                    style={inputStyle}
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>Tujuan Penggunaan Dana (FPP)</label>
                  <input 
                    type="text" 
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Contoh: Modal usaha warung sembako..." 
                    style={inputStyle}
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>Detail Usaha / Pekerjaan Saat Ini (FPP)</label>
                  <input type="text" style={inputStyle} placeholder="Contoh: Berjualan sembako di pasar..." required />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>Pilih Akad Syariah</label>
                  <select 
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="murabahah">Murabahah (Jual Beli)</option>
                    <option value="ijarah">Ijarah (Sewa/Multijasa)</option>
                    <option value="mudharabah">Mudharabah (Bagi Hasil / Modal Kerja)</option>
                    <option value="qardhul_hasan">Qardhul Hasan (Pinjaman Kebajikan)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>Spesifikasi Objek Akad</label>
                  <input type="text" style={inputStyle} placeholder="Barang yang dibeli / Proyek yang dijalankan..." required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>Daftar Inventaris Aset & Jaminan</label>
                  <input type="text" style={inputStyle} placeholder="Contoh: BPKB Motor Vario 2020 an. Budi..." required />
                </div>
              </div>
            </div>

            {/* Dokumen Upload Section */}
            <div style={{ marginTop: '32px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px 0', borderBottom: '2px solid var(--border-primary)', paddingBottom: '8px', textTransform: 'uppercase' }}>
                Dokumen Persyaratan Wajib
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <FileInputBox label="1. Fotokopi KTP (Pemohon & Pasangan)" />
                  <FileInputBox label="2. Kartu Keluarga (KK)" />
                  <FileInputBox label="3. Buku Nikah / Akta Cerai" />
                  <FileInputBox label="4. NPWP Pribadi/Badan" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <FileInputBox label="5. Bukti Pendapatan (Slip Gaji/Nota)" />
                  <FileInputBox label="6. Legalitas Usaha (SKU/NIB)" />
                  <FileInputBox label="7. Bukti Jaminan (SHM/BPKB dll)" />
                  <FileInputBox label="8. Form Persetujuan Pasangan (Ttd Asli)" isSpecial />
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(218, 165, 32, 0.05)', border: '1.5px solid var(--gold-intense)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--gold-intense)', margin: 0, fontSize: '14px', fontWeight: 900 }}>Otorisasi BI Checking / SLIK OJK</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="checkbox" id="slik_ojk" style={{ width: '20px', height: '20px', accentColor: 'var(--gold-intense)', cursor: 'pointer' }} required />
                  <label htmlFor="slik_ojk" style={{ color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}>
                    Saya memberikan kuasa penuh kepada KSPPS iQ-RA untuk melakukan pengecekan riwayat kredit (SLIK OJK) atas nama saya.
                  </label>
                </div>
                <input type="text" style={{ ...inputStyle, maxWidth: '300px', padding: '10px 14px', fontSize: '13px' }} placeholder="Ketik Nama Terang (Tanda Tangan Digital)..." required />
              </div>


            <div style={{ gridColumn: 'span 2', background: 'var(--border-primary)', padding: '24px', borderRadius: '16px', display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong>Deklarasi Syariah:</strong> Dengan mengirimkan pengajuan ini, saya bersedia mengikuti prinsip-prinsip syariah yang berlaku di iQ-RA Banking System dan bersedia memberikan data yang jujur untuk proses <em>Assesment</em> kelayakan pembiayaan.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={submitting || !isProfileComplete}
              style={{
                gridColumn: 'span 2',
                background: submitting || !isProfileComplete ? 'var(--border-primary)' : 'var(--text-primary)',
                color: submitting || !isProfileComplete ? 'var(--text-secondary)' : 'var(--bg-page)',
                padding: '22px',
                borderRadius: '18px',
                border: 'none',
                fontWeight: 900,
                fontSize: '18px',
                cursor: submitting || !isProfileComplete ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 15px 40px var(--shadow-color)',
                transition: 'all 0.3s'
              }}
            >
              {submitting ? '⏳ Sedang Mengirim Pengajuan...' : '🚀 KIRIM PERMOHONAN AKAD SEKARANG'}
            </button>
          </form>
        </div>
      )}

      {/* History Table */}
      <div style={{ 
        background: 'var(--bg-card)', 
        backdropFilter: 'blur(16px)', 
        borderRadius: '28px', 
        overflow: 'hidden', 
        border: '1px solid var(--border-primary)',
        boxShadow: '0 20px 50px var(--shadow-color)'
      }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Status Seluruh Pengajuan Anda</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--border-primary)', borderBottom: '2px solid var(--border-primary)' }}>
                <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Tanggal Pengajuan</th>
                <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Produk Akad</th>
                <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Jumlah Diajukan</th>
                <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Status Audit</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>
                    Belum ada riwayat permohonan pembiayaan.<br/>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', opacity: 0.6, display: 'inline-block', marginTop: '8px' }}>Ajukan kemitraan Syariah Anda dengan mengeklik tombol di sudut kanan atas.</span>
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
                        borderBottom: '1px solid var(--border-primary)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: '20px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700 }}>
                        {dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>

                      {/* Product Type */}
                      <td style={{ padding: '20px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 800 }}>
                        {getContractLabel(con.type)}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '20px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 900 }}>
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
                          background: 'rgba(0,0,0,0.02)'
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
  background: 'var(--bg-page)',
  border: '2px solid var(--border-primary)',
  borderRadius: '12px',
  padding: '14px 16px',
  color: 'var(--text-primary)',
  fontSize: '15px',
  fontWeight: 700,
  outline: 'none',
  width: '100%'
};

function FileInputBox({ label, isSpecial = false }: { label: string, isSpecial?: boolean }) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div style={{
      background: 'var(--bg-page)',
      border: `2px dashed ${isSpecial ? 'var(--gold-intense)' : 'var(--border-primary)'}`,
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s',
      backgroundColor: file ? (isSpecial ? 'rgba(218, 165, 32, 0.05)' : 'rgba(255,255,255,0.02)') : 'var(--bg-page)'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: isSpecial ? 'var(--gold-intense)' : 'var(--text-secondary)' }}>
        {label}
      </div>
      
      {file ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
            📄 {file.name}
          </div>
          <button 
            type="button" 
            onClick={() => setFile(null)} 
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 900, fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <label style={{
            background: 'var(--border-primary)',
            color: 'var(--text-primary)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            textAlign: 'center',
            display: 'inline-block',
            textTransform: 'uppercase'
          }}>
            Pilih File
            <input 
              type="file" 
              accept=".jpg,.jpeg,.png,.pdf" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFile(e.target.files[0]);
                }
              }}
              style={{ display: 'none' }} 
            />
          </label>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', opacity: 0.6 }}>PDF / JPG / PNG Max 5MB</div>
        </>
      )}
    </div>
  );
}

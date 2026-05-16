'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProfileFormProps {
  profile: any;
  onUpdateSuccess: () => void;
}

export default function ProfileForm({ profile, onUpdateSuccess }: ProfileFormProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    nik: '',
    kk_number: '',
    mother_name: '',
    religion: 'Islam',
    occupation: '',
    monthly_income: 0,
    phone_number: '',
    ktp_address: '',
    domicile_address: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nik: profile.nik || '',
        kk_number: profile.kk_number || '',
        mother_name: profile.mother_name || '',
        religion: profile.religion || 'Islam',
        occupation: profile.occupation || '',
        monthly_income: profile.monthly_income || 0,
        phone_number: profile.phone_number || profile.users?.phone_number || '',
        ktp_address: profile.ktp_address || '',
        domicile_address: profile.domicile_address || ''
      });
    }
  }, [profile]);

  const isProfileComplete = 
    formData.nik && 
    formData.kk_number && 
    formData.mother_name && 
    formData.occupation && 
    formData.monthly_income > 0 && 
    formData.phone_number && 
    formData.ktp_address && 
    formData.domicile_address;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    
    try {
      // Format monthly income to number
      const submissionData = {
        ...formData,
        monthly_income: Number(formData.monthly_income),
        user_id: profile.user_id,
        status: 'active'
      };

      let error;
      
      if (profile.id) {
        // Update existing
        const { error: updateErr } = await supabase
          .from('members')
          .update(submissionData)
          .eq('id', profile.id);
        error = updateErr;
      } else {
        // Insert new member physical file
        const { error: insertErr } = await supabase
          .from('members')
          .insert(submissionData);
        error = insertErr;
      }

      if (error) throw error;

      alert('✅ Profil & Dokumen Berhasil Diperbarui!');
      setEditing(false);
      onUpdateSuccess();
    } catch (err: any) {
      console.error('Save Profile Error:', err);
      alert('❌ Gagal memperbarui profil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Status Badge Box */}
      <div style={{
        background: isProfileComplete ? '#065f46' : '#991b1b', 
        border: `2px solid ${isProfileComplete ? '#34d399' : '#fca5a5'}`,
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 15px 35px var(--shadow-color)'
      }}>
        <div style={{ fontSize: '48px' }}>{isProfileComplete ? '✅' : '⚠️'}</div>
        <div>
          <h4 style={{ 
            fontSize: '18px', 
            fontWeight: 900, 
            color: '#ffffff',
            margin: '0 0 4px 0'
          }}>
            {isProfileComplete ? 'Dokumen Profil Anda Sudah Lengkap!' : 'Perhatian: Dokumen Belum Lengkap'}
          </h4>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
            {isProfileComplete 
              ? 'Semua berkas KYC (Know Your Customer) telah tervalidasi. Anda berhak mengajukan pembiayaan produk syariah kapan saja.'
              : 'Sesuai regulasi Dewan Pengawas Syariah, Anda WAJIB melengkapi data NIK, KK, Nama Ibu Kandung, dan Slip Gaji sebelum dapat memohon pengajuan pembiayaan.'}
          </p>
        </div>
      </div>

      {/* Main Form / Data Container */}
      <div style={{
        background: 'var(--bg-card)', 
        backdropFilter: 'blur(24px)', 
        border: '3px solid var(--border-primary)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 25px 50px var(--shadow-color)',
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '20px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>🗂️ Berkas Dokumen & KYC Fisik</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'var(--text-primary)', color: 'var(--bg-page)',
                border: 'none', padding: '10px 24px', borderRadius: '12px',
                fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 15px var(--shadow-color)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ✏️ Sunting Profil
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Col */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nomor Induk Kependudukan (NIK KTP)</label>
                  <input 
                    type="text" maxLength={16} required
                    value={formData.nik}
                    onChange={e => setFormData({...formData, nik: e.target.value})}
                    style={inputStyle}
                    placeholder="Masukkan 16 digit NIK..."
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nomor Kartu Keluarga (KK)</label>
                  <input 
                    type="text" maxLength={16} required
                    value={formData.kk_number}
                    onChange={e => setFormData({...formData, kk_number: e.target.value})}
                    style={inputStyle}
                    placeholder="Masukkan 16 digit KK..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nama Kandung Ibu (Untuk Verifikasi Bank)</label>
                  <input 
                    type="text" required
                    value={formData.mother_name}
                    onChange={e => setFormData({...formData, mother_name: e.target.value})}
                    style={inputStyle}
                    placeholder="Nama lengkap ibu kandung..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Agama / Kepercayaan</label>
                  <select
                    value={formData.religion}
                    onChange={e => setFormData({...formData, religion: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>

              {/* Right Col */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nomor Kontak Aktif (WhatsApp)</label>
                  <input 
                    type="tel" required
                    value={formData.phone_number}
                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                    style={inputStyle}
                    placeholder="Contoh: 0812xxxxxx"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Profesi / Pekerjaan Utama</label>
                  <input 
                    type="text" required
                    value={formData.occupation}
                    onChange={e => setFormData({...formData, occupation: e.target.value})}
                    style={inputStyle}
                    placeholder="Pekerjaan saat ini..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Penghasilan Rata-rata Per Bulan (Rp)</label>
                  <input 
                    type="number" min={0} required
                    value={formData.monthly_income}
                    onChange={e => setFormData({...formData, monthly_income: Number(e.target.value)})}
                    style={inputStyle}
                    placeholder="Nominal penghasilan..."
                  />
                </div>
              </div>
            </div>

            {/* Full width addresses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Alamat KTP Asli</label>
                <textarea 
                  required rows={2}
                  value={formData.ktp_address}
                  onChange={e => setFormData({...formData, ktp_address: e.target.value})}
                  style={{ ...inputStyle, resize: 'vertical' } as any}
                  placeholder="Alamat lengkap sesuai KTP..."
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Alamat Domisili Tinggal (Sekarang)</label>
                <textarea 
                  required rows={2}
                  value={formData.domicile_address}
                  onChange={e => setFormData({...formData, domicile_address: e.target.value})}
                  style={{ ...inputStyle, resize: 'vertical' } as any}
                  placeholder="Alamat tempat tinggal aktif saat ini..."
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" onClick={() => setEditing(false)} disabled={saving}
                style={{
                  background: 'transparent', border: '2px solid var(--border-primary)',
                  color: 'var(--text-primary)', padding: '14px 30px', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 800, cursor: 'pointer'
                }}
              >
                Batalkan
              </button>
              <button 
                type="submit" disabled={saving}
                style={{
                  background: '#10b981', border: 'none',
                  color: 'var(--bg-page)', padding: '14px 40px', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 4px 15px var(--shadow-color)'
                }}
              >
                {saving ? '🔄 Mengunggah...' : '💾 Simpan Dokumen'}
              </button>
            </div>
          </form>
        ) : (
          /* READ-ONLY DISPLAY */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              
              {/* Group 1 */}
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                  1. Identitas Kewarganegaraan
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                  <div>
                    <div style={labelStyle}>NOMOR KTP (NIK)</div>
                    <div style={valueStyle}>{profile?.nik || '— Belum Diisi —'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>KARTU KELUARGA (KK)</div>
                    <div style={valueStyle}>{profile?.kk_number || '— Belum Diisi —'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>NAMA IBU KANDUNG</div>
                    <div style={valueStyle}>{profile?.mother_name || '— Belum Diisi —'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>AGAMA</div>
                    <div style={valueStyle}>{profile?.religion || 'Islam'}</div>
                  </div>
                </div>
              </div>

              {/* Group 2 */}
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                  2. Kontak & Finansial
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                  <div>
                    <div style={labelStyle}>NOMOR WHATSAPP</div>
                    <div style={valueStyle}>{profile?.phone_number || profile?.users?.phone_number || '— Belum Diisi —'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>PEKERJAAN</div>
                    <div style={valueStyle}>{profile?.occupation || '— Belum Diisi —'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>PENDAPATAN BULANAN</div>
                    <div style={{ ...valueStyle, color: '#10b981', fontSize: '18px' }}>{profile?.monthly_income ? formatCurrency(profile.monthly_income) : '— Belum Diisi —'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Group 3 */}
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                3. Geografis & Domisili
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                <div>
                  <div style={labelStyle}>ALAMAT KTP</div>
                  <div style={{ ...valueStyle, fontFamily: 'inherit', lineHeight: 1.5 }}>{profile?.ktp_address || '— Belum Diisi —'}</div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <div style={labelStyle}>ALAMAT TINGGAL SEKARANG</div>
                  <div style={{ ...valueStyle, fontFamily: 'inherit', lineHeight: 1.5 }}>{profile?.domicile_address || '— Belum Diisi —'}</div>
                </div>
              </div>
            </div>

          </div>
        )}
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

const labelStyle = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  fontWeight: 700,
  marginBottom: '4px'
};

const valueStyle = {
  fontSize: '16px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  fontFamily: 'monospace'
};

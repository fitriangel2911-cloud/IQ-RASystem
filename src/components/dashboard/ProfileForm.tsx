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
    mother_name: '',
    religion: 'Islam',
    occupation: '',
    monthly_income: 0,
    phone_number: '',
    ktp_address: '',
    domicile_address: '',
    birth_place_date: '',
    gender: 'Laki-laki',
    marital_status: 'Belum Kawin',
    citizenship: 'WNI',
    company_name: '',
    funding_source: 'Gaji',
    heir_name: '',
    heir_relationship: '',
    heir_phone: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nik: profile.nik || '',
        mother_name: profile.mother_name || '',
        religion: profile.religion || 'Islam',
        occupation: profile.occupation || '',
        monthly_income: profile.monthly_income || 0,
        phone_number: profile.phone_number || profile.users?.phone_number || '',
        ktp_address: profile.ktp_address || '',
        domicile_address: profile.domicile_address || '',
        birth_place_date: profile.birth_place_date || '',
        gender: profile.gender || 'Laki-laki',
        marital_status: profile.marital_status || 'Belum Kawin',
        citizenship: profile.citizenship || 'WNI',
        company_name: profile.company_name || '',
        funding_source: profile.funding_source || 'Gaji',
        heir_name: profile.heir_name || '',
        heir_relationship: profile.heir_relationship || '',
        heir_phone: profile.heir_phone || ''
      });
    }
  }, [profile]);

  const isProfileComplete = 
    formData.nik && 
    formData.mother_name && 
    formData.occupation && 
    formData.monthly_income > 0 && 
    formData.phone_number && 
    formData.ktp_address && 
    formData.domicile_address &&
    formData.birth_place_date &&
    formData.gender &&
    formData.marital_status &&
    formData.citizenship &&
    formData.company_name &&
    formData.funding_source &&
    formData.heir_name &&
    formData.heir_relationship &&
    formData.heir_phone;

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

      alert('Profil & Dokumen Berhasil Diperbarui!');
      setEditing(false);
      onUpdateSuccess();
    } catch (err: any) {
      console.error('Save Profile Error:', err);
      alert('Gagal memperbarui profil: ' + err.message);
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
        <div style={{ flexShrink: 0 }}>
          {isProfileComplete ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          )}
        </div>
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
          <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Berkas Dokumen & KYC Fisik</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'var(--text-primary)', color: 'var(--bg-page)',
                border: 'none', padding: '10px 24px', borderRadius: '12px',
                fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 15px var(--shadow-color)',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Sunting Profil
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* A. DATA PRIBADI */}
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                A. DATA PRIBADI (SESUAI KTP)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nomor Induk Kependudukan (NIK)</label>
                  <input 
                    type="text" maxLength={16} required
                    value={formData.nik}
                    onChange={e => setFormData({...formData, nik: e.target.value})}
                    style={inputStyle}
                    placeholder="16 digit NIK..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Tempat & Tanggal Lahir</label>
                  <input 
                    type="text" required
                    value={formData.birth_place_date}
                    onChange={e => setFormData({...formData, birth_place_date: e.target.value})}
                    style={inputStyle}
                    placeholder="Contoh: Jakarta, 17 Agustus 1990..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Status Pernikahan</label>
                  <select
                    value={formData.marital_status}
                    onChange={e => setFormData({...formData, marital_status: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nama Ibu Kandung</label>
                  <input 
                    type="text" required
                    value={formData.mother_name}
                    onChange={e => setFormData({...formData, mother_name: e.target.value})}
                    style={inputStyle}
                    placeholder="Nama lengkap ibu kandung..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Agama</label>
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
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Kewarganegaraan</label>
                  <select
                    value={formData.citizenship}
                    onChange={e => setFormData({...formData, citizenship: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="WNI">WNI (Warga Negara Indonesia)</option>
                    <option value="WNA">WNA (Warga Negara Asing)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* B. DATA KONTAK & ALAMAT */}
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                B. DATA KONTAK & ALAMAT DOMISILI
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nomor WhatsApp Aktif</label>
                  <input 
                    type="tel" required
                    value={formData.phone_number}
                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                    style={inputStyle}
                    placeholder="Contoh: 0812xxxxxx..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Alamat Sesuai KTP</label>
                  <textarea 
                    required rows={2}
                    value={formData.ktp_address}
                    onChange={e => setFormData({...formData, ktp_address: e.target.value})}
                    style={{ ...inputStyle, resize: 'vertical' } as any}
                    placeholder="Alamat lengkap sesuai KTP..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Alamat Domisili Sekarang</label>
                  <textarea 
                    required rows={2}
                    value={formData.domicile_address}
                    onChange={e => setFormData({...formData, domicile_address: e.target.value})}
                    style={{ ...inputStyle, resize: 'vertical' } as any}
                    placeholder="Alamat tinggal saat ini..."
                  />
                </div>
              </div>
            </div>

            {/* C. DATA PEKERJAAN & KEUANGAN */}
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                C. DATA PEKERJAAN & KEUANGAN
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Profesi / Pekerjaan</label>
                  <input 
                    type="text" required
                    value={formData.occupation}
                    onChange={e => setFormData({...formData, occupation: e.target.value})}
                    style={inputStyle}
                    placeholder="Pekerjaan saat ini..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nama Perusahaan / Bidang Usaha</label>
                  <input 
                    type="text" required
                    value={formData.company_name}
                    onChange={e => setFormData({...formData, company_name: e.target.value})}
                    style={inputStyle}
                    placeholder="Nama instansi/bidang usaha..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Estimasi Pendapatan Rata-rata (Rp)</label>
                  <input 
                    type="number" min={0} required
                    value={formData.monthly_income}
                    onChange={e => setFormData({...formData, monthly_income: Number(e.target.value)})}
                    style={inputStyle}
                    placeholder="Nominal pendapatan bulanan..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Sumber Dana (APU-PPT)</label>
                  <select
                    value={formData.funding_source}
                    onChange={e => setFormData({...formData, funding_source: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="Gaji">Gaji</option>
                    <option value="Hasil Usaha">Hasil Usaha</option>
                    <option value="Warisan">Warisan</option>
                    <option value="Orang Tua/Suami">Orang Tua / Suami</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
            </div>

            {/* D. DATA AHLI WARIS */}
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                D. DATA AHLI WARIS (KHAS KOPERASI)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nama Lengkap Ahli Waris</label>
                  <input 
                    type="text" required
                    value={formData.heir_name}
                    onChange={e => setFormData({...formData, heir_name: e.target.value})}
                    style={inputStyle}
                    placeholder="Sesuai KTP ahli waris..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Hubungan Keluarga</label>
                  <input 
                    type="text" required
                    value={formData.heir_relationship}
                    onChange={e => setFormData({...formData, heir_relationship: e.target.value})}
                    style={inputStyle}
                    placeholder="Contoh: Istri, Anak, Orang Tua..."
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Nomor Kontak Ahli Waris</label>
                  <input 
                    type="tel" required
                    value={formData.heir_phone}
                    onChange={e => setFormData({...formData, heir_phone: e.target.value})}
                    style={inputStyle}
                    placeholder="Nomor telepon/WhatsApp aktif..."
                  />
                </div>
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
                  boxShadow: '0 4px 15px var(--shadow-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {saving ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)"></circle>
                      <path d="M12 2v20M2 12h20"></path>
                    </svg>
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Simpan Dokumen
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* READ-ONLY DISPLAY */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              
              {/* Group A: Data Pribadi */}
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                  A. Identitas Pribadi (KYC)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                  <div>
                    <div style={labelStyle}>NOMOR KTP (NIK)</div>
                    <div style={valueStyle}>{profile?.nik || '— Belum Diisi —'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>TEMPAT & TANGGAL LAHIR</div>
                    <div style={valueStyle}>{profile?.birth_place_date || '— Belum Diisi —'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>JENIS KELAMIN & STATUS PERNIKAHAN</div>
                    <div style={valueStyle}>{profile?.gender || 'Laki-laki'} ({profile?.marital_status || 'Belum Kawin'})</div>
                  </div>
                  <div>
                    <div style={labelStyle}>NAMA IBU KANDUNG</div>
                    <div style={valueStyle}>{profile?.mother_name || '— Belum Diisi —'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>AGAMA & KEWARGANEGARAAN</div>
                    <div style={valueStyle}>{profile?.religion || 'Islam'} ({profile?.citizenship || 'WNI'})</div>
                  </div>
                </div>
              </div>

              {/* Group B & C: Kontak & Finansial */}
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                  B & C. Kontak & Finansial
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                  <div>
                    <div style={labelStyle}>NOMOR WHATSAPP</div>
                    <div style={valueStyle}>{profile?.phone_number || profile?.users?.phone_number || '— Belum Diisi —'}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>PEKERJAAN & PERUSAHAAN</div>
                    <div style={valueStyle}>{profile?.occupation || '— Belum Diisi —'} {profile?.company_name ? `di ${profile?.company_name}` : ''}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>ESTIMASI PENDAPATAN & SUMBER DANA</div>
                    <div style={{ ...valueStyle, color: '#10b981', fontSize: '18px' }}>
                      {profile?.monthly_income ? formatCurrency(profile.monthly_income) : '— Belum Diisi —'} 
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '10px' }}>({profile?.funding_source || 'Gaji'})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Group D: Ahli Waris */}
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                D. Informasi Ahli Waris
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', background: 'var(--bg-page)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                <div>
                  <div style={labelStyle}>NAMA AHLI WARIS</div>
                  <div style={valueStyle}>{profile?.heir_name || '— Belum Diisi —'}</div>
                </div>
                <div>
                  <div style={labelStyle}>HUBUNGAN KELUARGA</div>
                  <div style={valueStyle}>{profile?.heir_relationship || '— Belum Diisi —'}</div>
                </div>
                <div>
                  <div style={labelStyle}>KONTAK AHLI WARIS</div>
                  <div style={valueStyle}>{profile?.heir_phone || '— Belum Diisi —'}</div>
                </div>
              </div>
            </div>

            {/* Group E: Geografis & Domisili */}
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '3px solid var(--text-primary)', paddingLeft: '10px' }}>
                E. Geografis & Domisili
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

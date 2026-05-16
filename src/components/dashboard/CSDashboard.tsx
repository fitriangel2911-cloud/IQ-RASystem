'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CSDashboardProps {
  activeMenu: string;
  profile: any;
}

export default function CSDashboard({ activeMenu, profile }: CSDashboardProps) {
  const [stats, setStats] = useState({ totalMembers: 0, pendingKYC: 0, activeHelp: 0 });
  const [kycList, setKycList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    nik: '',
    email: '',
    phone: '',
    motherName: '',
    kkNumber: '',
    ktpAddress: '',
    domicileAddress: '',
    occupation: '',
    monthlyIncome: '',
    religion: 'Islam'
  });

  const fetchStats = async () => {
    const supabase = createClient();
    const { count: memberCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    setStats({
      totalMembers: memberCount || 0,
      pendingKYC: pendingCount || 0,
      activeHelp: 12
    });

    const { data } = await supabase
      .from('members')
      .select('*, users(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setKycList(data);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    
    const { error } = await supabase.from('members').insert([{
      nik: formData.nik,
      mother_name: formData.motherName,
      kk_number: formData.kkNumber,
      phone_number: formData.phone,
      ktp_address: formData.ktpAddress,
      domicile_address: formData.domicileAddress,
      occupation: formData.occupation,
      monthly_income: parseInt(formData.monthlyIncome) || 0,
      religion: formData.religion,
      status: 'pending'
    }]);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal mendaftarkan anggota: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Data CIF Anggota berhasil didaftarkan! Silakan lanjutkan ke verifikasi dokumen.' });
      setFormData({
        fullName: '', nik: '', email: '', phone: '',
        motherName: '', kkNumber: '', ktpAddress: '', domicileAddress: '',
        occupation: '', monthlyIncome: '', religion: 'Islam'
      });
      fetchStats();
    }
    setLoading(false);
  };

  const handleApprove = async (memberId: string) => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('members')
      .update({ status: 'active' })
      .eq('id', memberId);

    if (!error) {
      setMessage({ type: 'success', text: 'Dokumen KYC berhasil disetujui!' });
      fetchStats();
    }
    setLoading(false);
  };

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {message && (
        <div style={{ 
          padding: '20px', borderRadius: '16px', marginBottom: '30px',
          background: message.type === 'success' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: message.type === 'success' ? '#10b981' : '#fca5a5',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#fca5a5'}`,
          fontWeight: 700, textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Shared Stats Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '40px' }}>
        <StatCard label="Total Anggota" value={stats.totalMembers} icon="👥" color="var(--text-primary)" />
        <StatCard label="Antrian KYC" value={stats.pendingKYC} icon="📂" color="#4ade80" />
        <StatCard label="Bantuan Aktif" value={stats.activeHelp} icon="💬" color="#60a5fa" />
      </div>

      {/* 2. ONBOARDING TAB: COMPREHENSIVE CIF FORM */}
      {activeMenu === 'onboarding' && (
        <div style={{ 
          background: 'var(--bg-card)', 
          backdropFilter: 'blur(16px)', 
          borderRadius: '32px', 
          overflow: 'hidden', 
          border: '1px solid var(--border-primary)',
          boxShadow: '0 40px 80px var(--shadow-color)'
        }}>
          <div style={{ background: 'var(--bg-header)', padding: '30px 40px', borderBottom: '2px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '1px' }}>📝 PENDAFTARAN CIF (DOKUMEN FISIK)</h2>
            <span style={{ background: 'var(--border-primary)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 900, border: '1px solid var(--border-primary)' }}>TAHAP: DATA DEMOGRAFI</span>
          </div>
          
          <form onSubmit={handleRegister} style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <CSInputField label="Nama Lengkap Anggota" placeholder="Sesuai KTP..." value={formData.fullName} onChange={(val: string) => setFormData({...formData, fullName: val})} />
            <CSInputField label="Nomor Induk Kependudukan (NIK)" placeholder="16 Digit..." value={formData.nik} onChange={(val: string) => setFormData({...formData, nik: val})} />
            
            <CSInputField label="Nomor Kartu Keluarga (KK)" placeholder="16 Digit..." value={formData.kkNumber} onChange={(val: string) => setFormData({...formData, kkNumber: val})} />
            <CSInputField label="Nama Ibu Kandung" placeholder="Untuk verifikasi keamanan..." value={formData.motherName} onChange={(val: string) => setFormData({...formData, motherName: val})} />

            <div style={{ gridColumn: 'span 2' }}>
              <CSInputField label="Alamat Sesuai KTP" placeholder="Jalan, No Rumah, RT/RW, Desa/Kelurahan..." value={formData.ktpAddress} onChange={(val: string) => setFormData({...formData, ktpAddress: val})} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <CSInputField label="Alamat Domisili Aktif" placeholder="Biarkan kosong jika sama dengan KTP..." value={formData.domicileAddress} onChange={(val: string) => setFormData({...formData, domicileAddress: val})} />
            </div>

            <CSInputField label="Pekerjaan / Profesi" placeholder="Contoh: Wiraswasta, PNS, Petani..." value={formData.occupation} onChange={(val: string) => setFormData({...formData, occupation: val})} />
            <CSInputField label="Estimasi Pendapatan Per Bulan" placeholder="Dalam Rupiah..." value={formData.monthlyIncome} onChange={(val: string) => setFormData({...formData, monthlyIncome: val})} />

            <CSInputField label="Nomor WhatsApp/HP" placeholder="08xxxx..." value={formData.phone} onChange={(val: string) => setFormData({...formData, phone: val})} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 800 }}>Keyakinan / Agama</label>
              <select 
                value={formData.religion} 
                onChange={(e) => setFormData({...formData, religion: e.target.value})}
                style={{ padding: '16px 20px', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', borderRadius: '14px', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="Islam">Islam</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            
            <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
              <button 
                type="submit"
                disabled={loading}
                style={{ 
                  width: '100%', padding: '22px', background: 'var(--text-primary)',
                  color: 'var(--bg-page)', border: 'none', borderRadius: '18px', fontWeight: 900, fontSize: '18px',
                  cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px var(--shadow-color)', transition: 'all 0.2s'
                }}
              >
                {loading ? '⏳ MENYIMPAN CIF...' : 'DAFTARKAN CIF ANGGOTA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. MEMBERS DATABASE TAB */}
      {activeMenu === 'members' && (
        <div style={{ 
          background: 'var(--bg-card)', 
          backdropFilter: 'blur(16px)', 
          borderRadius: '32px', 
          overflow: 'hidden', 
          border: '1px solid var(--border-primary)',
          boxShadow: '0 40px 80px var(--shadow-color)'
        }}>
          <div style={{ background: 'var(--bg-header)', padding: '30px 40px', borderBottom: '2px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 900, fontSize: '22px' }}>📊 DATABASE ANGGOTA TERVERIFIKASI</h3>
            <div style={{ color: 'var(--text-primary)', opacity: 0.8, fontSize: '14px', fontWeight: 700 }}>Total: {stats.totalMembers} Anggota</div>
          </div>
          <div style={{ padding: '20px 40px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-primary)' }}>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>IDENTITAS NASABAH</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>NIK / KK</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>PEKERJAAN / PENDAPATAN</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {kycList.length > 0 ? kycList.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-primary)', background: 'rgba(0,0,0,0.02)' }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '16px' }}>{item.users?.full_name || 'Anggota Tanpa Akun'}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{item.phone_number}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }}>{item.nik}</div>
                      <div style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: '12px' }}>KK: {item.kk_number}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: '#10b981', fontWeight: 800 }}>{item.occupation}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Rp {item.monthly_income?.toLocaleString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'right' }}>
                      <span style={{ 
                        padding: '6px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: 900,
                        background: item.status === 'active' ? '#10b981' : 'var(--text-primary)',
                        color: 'var(--bg-page)'
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.4, fontWeight: 800 }}>
                      Tidak ada data anggota untuk ditampilkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. AI HELP TAB */}
      {activeMenu === 'ai-help' && (
        <div style={{ height: '70vh', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '32px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-primary)' }}>
          <div style={{ padding: '24px 40px', background: 'var(--bg-header)', borderBottom: '1px solid var(--border-primary)' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 900 }}>💬 iQ-RA AI Sharia Assistant</h3>
          </div>
          <div style={{ flexGrow: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ alignSelf: 'flex-start', background: 'var(--border-primary)', padding: '20px', borderRadius: '0 24px 24px 24px', maxWidth: '70%', color: 'var(--text-primary)', fontSize: '15px', boxShadow: '0 4px 15px var(--shadow-color)' }}>
              Halo {profile?.full_name}! Saya asisten AI iQ-RA. Ada yang bisa saya bantu terkait produk simpanan atau pembiayaan syariah hari ini?
            </div>
          </div>
          <div style={{ padding: '30px 40px', background: 'rgba(0,0,0,0.02)' }}>
            <input 
              type="text" 
              placeholder="Tanyakan sesuatu pada AI..." 
              style={{ width: '100%', padding: '18px 24px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '20px', color: 'var(--text-primary)', outline: 'none' }} 
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div style={{ 
      background: 'var(--bg-card)', 
      backdropFilter: 'blur(16px)', 
      padding: '30px', 
      borderRadius: '24px', 
      border: '1px solid var(--border-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    }}>
      <div style={{ fontSize: '40px' }}>{icon}</div>
      <div>
        <div style={{ color: 'var(--text-primary)', opacity: 0.7, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
        <div style={{ color: 'var(--text-primary)', fontSize: '32px', fontWeight: 900 }}>{value}</div>
      </div>
    </div>
  );
}

function CSInputField({ label, placeholder, value, onChange }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 800 }}>{label}</label>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          padding: '16px 20px', background: 'var(--bg-page)', 
          border: '1.5px solid var(--border-primary)', borderRadius: '14px', 
          color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' 
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--text-primary)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
      />
    </div>
  );
}

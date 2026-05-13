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
    phone: ''
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
    
    // Logic: In a real app, CS would create an auth user. 
    // For this demo, we'll record the member application.
    const { error } = await supabase.from('members').insert([{
      nik: formData.nik,
      status: 'pending',
      // Store other info in metadata or associated tables if available
    }]);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal mendaftarkan anggota: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Anggota baru berhasil didaftarkan ke antrian KYC!' });
      setFormData({ fullName: '', nik: '', email: '', phone: '' });
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
          color: message.type === 'success' ? '#4ade80' : '#fca5a5',
          border: `1px solid ${message.type === 'success' ? '#4ade80' : '#fca5a5'}`,
          fontWeight: 700, textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Shared Stats Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '40px' }}>
        <StatCard label="Total Anggota" value={stats.totalMembers} icon="👥" color="#f3c653" />
        <StatCard label="Antrian KYC" value={stats.pendingKYC} icon="📂" color="#4ade80" />
        <StatCard label="Bantuan Aktif" value={stats.activeHelp} icon="💬" color="#60a5fa" />
      </div>

      {/* 2. ONBOARDING TAB */}
      {activeMenu === 'onboarding' && (
        <div style={{ 
          background: 'rgba(4, 49, 33, 0.85)', 
          backdropFilter: 'blur(20px)', 
          borderRadius: '32px', 
          overflow: 'hidden', 
          border: '1px solid rgba(243, 198, 83, 0.2)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)'
        }}>
          <div style={{ background: '#043121', padding: '30px 40px', borderBottom: '2px solid #f3c653' }}>
            <h2 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '1px' }}>📝 PENDAFTARAN ANGGOTA BARU</h2>
          </div>
          
          <form onSubmit={handleRegister} style={{ padding: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <CSInputField label="Nama Lengkap Sesuai KTP" placeholder="Contoh: Ahmad Hidayat" value={formData.fullName} onChange={(val: string) => setFormData({...formData, fullName: val})} />
            <CSInputField label="Nomor Induk Kependudukan (NIK)" placeholder="16 Digit NIK..." value={formData.nik} onChange={(val: string) => setFormData({...formData, nik: val})} />
            <CSInputField label="Alamat Email Aktif" placeholder="nama@email.com" value={formData.email} onChange={(val: string) => setFormData({...formData, email: val})} />
            <CSInputField label="Nomor WhatsApp" placeholder="08xxxx..." value={formData.phone} onChange={(val: string) => setFormData({...formData, phone: val})} />
            
            <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
              <button 
                type="submit"
                disabled={loading}
                style={{ 
                  width: '100%', padding: '22px', background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                  color: '#02130e', border: 'none', borderRadius: '18px', fontWeight: 900, fontSize: '18px',
                  cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px rgba(204, 163, 52, 0.4)', transition: 'all 0.2s',
                  letterSpacing: '1px'
                }}
              >
                {loading ? '⏳ MEMPROSES DATA...' : 'DAFTARKAN ANGGOTA & AJUKAN KYC'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. KYC TAB */}
      {activeMenu === 'kyc' && (
        <div style={{ 
          background: 'rgba(4, 49, 33, 0.9)', 
          backdropFilter: 'blur(20px)', 
          borderRadius: '32px', 
          overflow: 'hidden', 
          border: '1px solid rgba(243, 198, 83, 0.2)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)'
        }}>
          <div style={{ background: '#043121', padding: '30px 40px', borderBottom: '2px solid #f3c653' }}>
            <h3 style={{ color: '#ffffff', margin: 0, fontWeight: 900, fontSize: '22px' }}>📂 VERIFIKASI DOKUMEN (KYC)</h3>
          </div>
          <div style={{ padding: '20px 40px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(243, 198, 83, 0.2)' }}>
                  <th style={{ padding: '20px', color: '#f3c653', fontWeight: 800 }}>CALON ANGGOTA</th>
                  <th style={{ padding: '20px', color: '#f3c653', fontWeight: 800 }}>NIK</th>
                  <th style={{ padding: '20px', color: '#f3c653', fontWeight: 800 }}>TANGGAL DAFTAR</th>
                  <th style={{ padding: '20px', color: '#f3c653', fontWeight: 800, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {kycList.length > 0 ? kycList.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '16px' }}>{item.users?.full_name || 'Anggota Baru'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{item.users?.email || 'Email belum tertaut'}</div>
                    </td>
                    <td style={{ padding: '20px', color: '#4ade80', fontWeight: 800 }}>{item.nik}</td>
                    <td style={{ padding: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td style={{ padding: '20px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleApprove(item.id)}
                        disabled={loading}
                        style={{ padding: '12px 28px', borderRadius: '12px', background: '#4ade80', color: '#043121', border: 'none', fontWeight: 900, fontSize: '13px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(74, 222, 128, 0.3)' }}
                      >
                        SETUJUI KYC
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '80px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>
                      <div style={{ fontSize: '50px', marginBottom: '20px' }}>✅</div>
                      Hore! Semua berkas KYC sudah selesai diproses.
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
        <div style={{ height: '70vh', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', borderRadius: '32px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '24px 40px', background: 'rgba(4, 49, 33, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: '#f3c653', margin: 0, fontWeight: 900 }}>💬 iQ-RA AI Sharia Assistant</h3>
          </div>
          <div style={{ flexGrow: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '0 24px 24px 24px', maxWidth: '70%', color: '#ffffff', fontSize: '15px' }}>
              Halo {profile?.full_name}! Saya asisten AI iQ-RA. Ada yang bisa saya bantu terkait produk simpanan atau pembiayaan syariah hari ini?
            </div>
          </div>
          <div style={{ padding: '30px 40px', background: 'rgba(0,0,0,0.2)' }}>
            <input 
              type="text" 
              placeholder="Tanyakan sesuatu pada AI..." 
              style={{ width: '100%', padding: '18px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#ffffff', outline: 'none' }} 
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
      background: 'rgba(255, 255, 255, 0.05)', 
      backdropFilter: 'blur(10px)', 
      padding: '30px', 
      borderRadius: '24px', 
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    }}>
      <div style={{ fontSize: '40px' }}>{icon}</div>
      <div>
        <div style={{ color: '#f3c653', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
        <div style={{ color: '#ffffff', fontSize: '32px', fontWeight: 900 }}>{value}</div>
      </div>
    </div>
  );
}

function CSInputField({ label, placeholder, value, onChange }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 800 }}>{label}</label>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          padding: '16px 20px', background: 'rgba(255,255,255,0.03)', 
          border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '14px', 
          color: '#ffffff', outline: 'none', transition: 'all 0.2s' 
        }}
        onFocus={e => e.currentTarget.style.borderColor = '#f3c653'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
    </div>
  );
}

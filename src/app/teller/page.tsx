'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';

import TellerTerminal from '@/components/dashboard/TellerTerminal';

export default function TellerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('terminal');
  const [journalHistory, setJournalHistory] = useState<any[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);

  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      setUser(currentUser);

      const { data: dbProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (dbProfile) {
        setProfile(dbProfile);
        if (dbProfile.role !== 'teller' && dbProfile.role !== 'super_user') {
          router.push('/dashboard');
          return;
        }
      }
      setLoading(false);
    };
    fetchSession();
  }, [router]);

  // Fetch Tab Data
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      if (activeMenu === 'history') {
        const { data } = await supabase
          .from('journal_entries')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setJournalHistory(data);
      } else if (activeMenu === 'members') {
        const { data } = await supabase
          .from('members')
          .select('*, users(full_name, email)')
          .order('created_at', { ascending: false });
        if (data) setMembersList(data);
      }
    };
    if (!loading) fetchData();
  }, [activeMenu, loading]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#02130e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h3 style={{ color: '#f3c653', fontWeight: 800 }}>Membuka Layanan Teller...</h3>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <GlobalSiteBackground />
      
      {/* 🟢 SIDEBAR EMERALD */}
      <aside style={{
        width: '280px',
        background: 'rgba(4, 49, 33, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 20px',
        zIndex: 100,
        boxShadow: '20px 0 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ marginBottom: '50px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#f3c653', letterSpacing: '2px' }}>
            IQ-RA <span style={{ color: '#ffffff', fontSize: '14px', display: 'block', fontWeight: 600 }}>CORE BANKING</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
          <MenuButton 
            active={activeMenu === 'terminal'} 
            onClick={() => setActiveMenu('terminal')} 
            icon="🏪" label="Layanan Transaksi" 
          />
          <MenuButton 
            active={activeMenu === 'history'} 
            onClick={() => setActiveMenu('history')} 
            icon="📜" label="Riwayat Kas" 
          />
          <MenuButton 
            active={activeMenu === 'members'} 
            onClick={() => setActiveMenu('members')} 
            icon="👥" label="Daftar Anggota" 
          />
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          padding: '20px', 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Petugas Aktif</div>
          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>{profile?.full_name}</div>
          <button 
            onClick={handleLogout}
            style={{ 
              marginTop: '16px', width: '100%', background: '#ef4444', color: 'white', 
              border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' 
            }}
          >
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ⚪ MAIN CONTENT AREA */}
      <main style={{ 
        flexGrow: 1, 
        padding: '40px 60px', 
        zIndex: 20, 
        overflowY: 'auto',
        height: '100vh'
      }}>
        {/* Header Content */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px',
          background: 'rgba(255,255,255,0.02)',
          padding: '20px 30px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <h2 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: 900 }}>
            {activeMenu === 'terminal' && '🏪 Terminal Kasir Utama'}
            {activeMenu === 'history' && '📜 Log Mutasi Jurnal Harian'}
            {activeMenu === 'members' && '👥 Direktori Anggota Koperasi'}
          </h2>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600 }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
          {activeMenu === 'terminal' && <TellerTerminal userId={user?.id} />}
          
          {activeMenu === 'history' && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '32px',
              padding: '0',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)'
            }}>
              {/* Solid Emerald Header for History Table */}
              <div style={{ background: '#043121', padding: '24px 40px', borderBottom: '2px solid #f3c653' }}>
                <h3 style={{ color: '#ffffff', margin: 0, fontSize: '20px', fontWeight: 900 }}>
                  📜 LOG JURNAL KASIR REAL-TIME
                </h3>
              </div>
              <div style={{ padding: '20px 40px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '15px', color: '#f3c653', fontWeight: 800 }}>TANGGAL</th>
                      <th style={{ padding: '15px', color: '#f3c653', fontWeight: 800 }}>REF NO</th>
                      <th style={{ padding: '15px', color: '#f3c653', fontWeight: 800 }}>KETERANGAN</th>
                      <th style={{ padding: '15px', color: '#f3c653', fontWeight: 800, textAlign: 'right' }}>DEBIT</th>
                      <th style={{ padding: '15px', color: '#f3c653', fontWeight: 800, textAlign: 'right' }}>KREDIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalHistory.length > 0 ? journalHistory.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '15px', fontSize: '14px', fontWeight: 600 }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                        <td style={{ padding: '15px', fontSize: '12px', color: '#4ade80', fontWeight: 800 }}>{item.reference_no}</td>
                        <td style={{ padding: '15px', fontSize: '14px', color: '#ffffff' }}>{item.description}</td>
                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: 900, color: '#4ade80' }}>
                          {item.debit > 0 ? `Rp ${item.debit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: 900, color: '#fca5a5' }}>
                          {item.credit > 0 ? `Rp ${item.credit.toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                          Tidak ada data mutasi jurnal untuk ditampilkan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === 'members' && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '32px',
              padding: '0',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)'
            }}>
              {/* Solid Emerald Header for Member List */}
              <div style={{ background: '#043121', padding: '24px 40px', borderBottom: '2px solid #f3c653', marginBottom: '30px' }}>
                <h3 style={{ color: '#ffffff', margin: 0, fontSize: '20px', fontWeight: 900 }}>
                  👥 DIREKTORI ANGGOTA KOPERASI
                </h3>
              </div>
              
              <div style={{ padding: '0 40px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {membersList.length > 0 ? membersList.map(member => (
                  <div key={member.id} style={{
                    background: '#043121', // Solid Emerald Card for better contrast
                    borderRadius: '24px',
                    padding: '28px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '64px', height: '64px', borderRadius: '18px', 
                        background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '28px', boxShadow: '0 5px 15px rgba(204, 163, 52, 0.4)' 
                      }}>👤</div>
                      <div>
                        <h4 style={{ color: '#ffffff', margin: 0, fontSize: '19px', fontWeight: 900, letterSpacing: '0.5px' }}>
                          {member.users?.full_name || 'Anggota iQ-RA'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }} />
                          <p style={{ color: '#f3c653', margin: 0, fontSize: '13px', fontWeight: 800 }}>{member.nik || 'No NIK'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginTop: '24px', padding: '16px', 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '1px' }}>
                        ID Akun / Email
                      </div>
                      <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600, wordBreak: 'break-all' }}>
                        {member.users?.email}
                      </div>
                    </div>

                    <button style={{
                      marginTop: '20px', width: '100%', 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1.5px solid rgba(255,255,255,0.1)', 
                      color: '#ffffff', padding: '12px', 
                      borderRadius: '12px', fontSize: '13px', fontWeight: 800, 
                      cursor: 'pointer', transition: 'all 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                      Lihat Profil Lengkap
                    </button>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
                    Belum ada data anggota yang terdaftar.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function MenuButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        background: active ? '#cca334' : 'transparent',
        color: active ? '#043121' : 'rgba(255,255,255,0.6)',
        border: 'none',
        borderRadius: '16px',
        fontSize: '15px',
        fontWeight: 800,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      {label}
    </button>
  );
}

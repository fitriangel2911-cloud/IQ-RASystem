'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import TellerTerminal from '@/components/dashboard/TellerTerminal';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export default function TellerPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('terminal');
  const [journalHistory, setJournalHistory] = useState<any[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        if (dbProfile.role !== 'teller' && dbProfile.role !== 'super_admin') {
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
      
      {/* 🟢 SIDEBAR EMERALD */}
      <aside style={{
        width: isSidebarOpen ? '300px' : '0px',
        opacity: isSidebarOpen ? 1 : 0,
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(20px)',
        borderRight: isSidebarOpen ? '2px solid var(--gold-bright)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: isSidebarOpen ? '36px 24px' : '0px',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100,
        boxShadow: isSidebarOpen ? '8px 0 25px var(--shadow-color)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}>
        {/* Close Button Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'absolute',
            right: '15px',
            top: '15px',
            background: theme === 'light' ? '#ffffff' : 'var(--bg-page)',
            border: theme === 'light' ? '2.5px solid #000000' : '2px solid #ffffff',
            borderRadius: '8px',
            color: theme === 'light' ? '#000000' : '#ffffff',
            cursor: 'pointer',
            padding: '5px 10px',
            fontWeight: 900,
            transition: 'all 0.3s'
          }}
        >
          ✕
        </button>
        <div style={{ 
          marginBottom: '40px', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '16px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <BrandLogo size={42} fontSize="22px" textColor="var(--text-primary)" />
            <div style={{ marginRight: '45px' }}>
              <ThemeToggle />
            </div>
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: 'var(--text-primary)', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '1.5px', 
            marginLeft: '56px',
            opacity: 0.9
          }}>
            Layanan Kasir
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
          padding: '18px', 
          background: 'var(--border-primary)', 
          borderRadius: '18px',
          border: '1px solid var(--gold-bright)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '38px', height: '38px', borderRadius: '10px', 
              background: 'var(--gold-intense)', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#02130e' 
            }}>
              {profile?.full_name?.charAt(0) || 'T'}
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Petugas Aktif</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px' }}>{profile?.full_name}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--text-primary)', 
              border: '2px solid #fca5a5', padding: '10px', borderRadius: '12px', 
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontSize: '12px'
            }}
          >
            🔌 Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ⚪ MAIN CONTENT AREA */}
      <main style={{ 
        flexGrow: 1, 
        padding: '40px 60px', 
        marginLeft: isSidebarOpen ? '300px' : '0px',
        zIndex: 20, 
        overflowY: 'auto',
        height: '100vh',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header Content */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '44px',
          background: 'var(--bg-header)',
          backdropFilter: 'blur(16px)',
          padding: '24px 36px',
          borderRadius: '24px',
          border: '1px solid var(--border-primary)',
          borderLeft: '6px solid var(--gold-intense)',
          boxShadow: '0 20px 40px var(--shadow-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  background: theme === 'light' ? '#ffffff' : 'var(--bg-sidebar)',
                  border: theme === 'light' ? '2.5px solid #000000' : '2px solid #ffffff',
                  borderRadius: '12px',
                  color: theme === 'light' ? '#000000' : '#ffffff',
                  padding: '12px 18px',
                  cursor: 'pointer',
                  fontWeight: 900,
                  boxShadow: '0 4px 15px var(--shadow-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s'
                }}
              >
                ☰ <span style={{ fontSize: '12px' }}>MENU</span>
              </button>
            )}
            <div>
              <div style={{ background: 'var(--border-primary)', color: 'var(--gold-intense)', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 900, letterSpacing: '1px', display: 'inline-block', marginBottom: '8px', textTransform: 'uppercase' }}>Terminal Operasional Kas</div>
              <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                {activeMenu === 'terminal' && '🏪 Terminal Kasir Utama'}
                {activeMenu === 'history' && '📜 Log Mutasi Jurnal Harian'}
                {activeMenu === 'members' && '👥 Direktori Anggota Koperasi'}
              </h2>
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>
            <div style={{ color: '#34d399', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>🟢 KONEKSI LIVE</div>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
          {activeMenu === 'terminal' && <TellerTerminal userId={user?.id} />}
          
          {activeMenu === 'history' && (
            <div style={{
              background: 'var(--bg-card)',
              backdropFilter: 'blur(20px)',
              borderRadius: '32px',
              padding: '0',
              overflow: 'hidden',
              border: '1px solid var(--border-primary)',
              boxShadow: '0 30px 60px var(--shadow-color)'
            }}>
              {/* Solid Emerald Header for History Table */}
              <div style={{ background: 'var(--bg-header)', padding: '24px 40px', borderBottom: '1px solid var(--border-primary)' }}>
                <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px', fontWeight: 900 }}>
                  📜 LOG JURNAL KASIR REAL-TIME
                </h3>
              </div>
              <div style={{ padding: '20px 40px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(243, 198, 83, 0.3)', background: 'rgba(255,255,255,0.03)' }}>
                      <th style={{ padding: '20px', color: '#f3c653', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}>TANGGAL</th>
                      <th style={{ padding: '20px', color: '#f3c653', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}>REF NO</th>
                      <th style={{ padding: '20px', color: '#f3c653', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}>KETERANGAN</th>
                      <th style={{ padding: '20px', color: '#f3c653', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', textAlign: 'right' }}>DEBIT</th>
                      <th style={{ padding: '20px', color: '#f3c653', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', textAlign: 'right' }}>KREDIT</th>
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
              background: 'var(--bg-card)',
              backdropFilter: 'blur(20px)',
              borderRadius: '32px',
              padding: '0',
              overflow: 'hidden',
              border: '1px solid var(--border-primary)',
              boxShadow: '0 30px 60px var(--shadow-color)'
            }}>
              {/* Solid Emerald Header for Member List */}
              <div style={{ background: 'var(--bg-header)', padding: '24px 40px', borderBottom: '1px solid var(--border-primary)', marginBottom: '30px' }}>
                <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px', fontWeight: 900 }}>
                  👥 DIREKTORI ANGGOTA KOPERASI
                </h3>
              </div>
              
              <div style={{ padding: '0 40px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {membersList.length > 0 ? membersList.map(member => (
                  <div key={member.id} style={{
                    background: 'var(--bg-card)',
                    borderRadius: '24px',
                    padding: '28px',
                    border: '1px solid var(--gold-bright)',
                    boxShadow: '0 15px 35px var(--shadow-color)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Decorative background logo */}
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05, transform: 'rotate(-15deg) scale(1.5)' }}>
                      <BrandLogo size={60} showText={false} />
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '64px', height: '64px', borderRadius: '18px', 
                        background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '28px', boxShadow: '0 5px 15px rgba(204, 163, 52, 0.4)' 
                      }}>👤</div>
                      <div>
                        <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '0.5px' }}>
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
                      background: 'var(--shadow-color)', 
                      borderRadius: '16px',
                      border: '1px solid var(--border-primary)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '1px' }}>
                        ID Akun / Email
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, wordBreak: 'break-all' }}>
                        {member.users?.email}
                      </div>
                    </div>

                    <button style={{
                      marginTop: '20px', width: '100%', 
                      background: 'rgba(243, 198, 83, 0.1)', 
                      border: '1.5px solid rgba(243, 198, 83, 0.3)', 
                      color: '#f3c653', padding: '12px', 
                      borderRadius: '12px', fontSize: '13px', fontWeight: 800, 
                      cursor: 'pointer', transition: 'all 0.2s',
                      position: 'relative', zIndex: 5
                    }} onMouseOver={e => e.currentTarget.style.background = 'rgba(243, 198, 83, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(243, 198, 83, 0.1)'}>
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
        padding: '15px 18px',
        background: active ? 'var(--text-primary)' : 'transparent',
        color: active ? 'var(--bg-page)' : 'var(--text-primary)',
        border: 'none',
        borderRadius: '14px',
        fontSize: '16px',
        fontWeight: 900,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: active ? '0 10px 20px var(--shadow-color)' : 'none',
        width: '100%'
      }}
    >
      <span style={{ fontSize: '22px', opacity: active ? 1 : 0.8 }}>{icon}</span>
      <span style={{ opacity: active ? 1 : 0.9 }}>{label}</span>
    </button>
  );
}

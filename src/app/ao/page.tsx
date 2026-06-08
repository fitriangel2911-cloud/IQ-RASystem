'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import AODashboard from '@/components/dashboard/AODashboard';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import NotificationBell from '@/components/dashboard/NotificationBell';
import { useTheme } from '@/context/ThemeContext';
import AIChatbot from '@/components/dashboard/AIChatbot';

export default function AOPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        if (error || !currentUser) {
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
          
          // Allowed roles for this page (Added 'ao' as alias)
          const allowedRoles = ['account_officer', 'ao', 'super_admin', 'manager'];
          if (!allowedRoles.includes(dbProfile.role)) {
            console.warn('Unauthorized role access to AO page:', dbProfile.role);
            router.push('/dashboard');
            return;
          }
        } else {
          console.error('Profile not found in public.users for AO page');
          router.push('/dashboard');
          return;
        }
      } catch (err) {
        console.error('AO Page session check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10b981', borderRadius: '50%' }}></div>
        <h3 style={{ color: '#10b981', fontWeight: 900, fontSize: '18px', letterSpacing: '1px' }}>MENYIAPKAN WORKSPACE ACCOUNT OFFICER...</h3>
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
      
      {/* 1. SIDEBAR: Solid, Bold, Premium Dark Emerald */}
      {isSidebarOpen && (
        <aside style={{
          width: '280px',
          background: 'var(--bg-sidebar)',
          borderRight: '2px solid #cca334',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 30,
          boxShadow: '8px 0 25px var(--shadow-color)'
        }}>
          {/* Sidebar Brand */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ marginTop: '0px' }}>
                <BrandLogo size={42} fontSize="20px" textColor="var(--sidebar-heading)" />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px', marginLeft: '52px' }}>Account Officer</div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>✖</button>
          </div>

          {/* Sidebar Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px', marginTop: '10px' }}>MENU UTAMA</div>
            
            <AOMenuButton active={activeMenu === 'overview'} onClick={() => setActiveMenu('overview')} icon="📊" label="Pipeline AO" />
            <AOMenuButton active={activeMenu === 'prospects'} onClick={() => setActiveMenu('prospects')} icon="🤖" label="Analisis AI" />
            <AOMenuButton active={activeMenu === 'survey'} onClick={() => setActiveMenu('survey')} icon="🗺️" label="Survei Lapangan" />
            <AOMenuButton active={activeMenu === 'portfolio'} onClick={() => setActiveMenu('portfolio')} icon="📂" label="Portofolio Anggota" />
            <AOMenuButton active={activeMenu === 'history'} onClick={() => setActiveMenu('history')} icon="📜" label="Riwayat Proses" />
          </nav>
        </aside>
      )}

      {/* 2. MAIN CONTENT AREA: Crystal Clear High Contrast */}
      <main style={{ 
        flexGrow: 1, 
        padding: '24px 40px', 
        zIndex: 20, 
        overflowY: 'auto',
        height: '100vh',
        position: 'relative',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'sticky', top: '-24px', paddingTop: '24px', paddingBottom: '16px', background: 'var(--bg-card)', zIndex: 20, borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--gold-intense)', fontSize: '28px', cursor: 'pointer', marginTop: '-2px' }}>
                ☰
              </button>
            )}
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '6px', textShadow: '0 2px 10px var(--shadow-color)' }}>
                {activeMenu === 'overview' && '📊 Dashboard Operasional AO'}
                {activeMenu === 'prospects' && '🤖 Analisis Akad Berbasis AI'}
                {activeMenu === 'survey' && '🗺️ Modul Verifikasi Lapangan'}
                {activeMenu === 'portfolio' && '📂 Monitoring Portofolio Aktif'}
                {activeMenu === 'history' && '📜 Riwayat Proses Pembiayaan'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
                Kelola ekosistem pembiayaan syariah secara produktif dan amanah.
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'var(--bg-card)', border: '2px solid #34d399', borderRadius: '30px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 800, color: 'var(--text-success)', boxShadow: '0 4px 15px rgba(52, 211, 153, 0.2)' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--text-success)', borderRadius: '50%', boxShadow: '0 0 10px #34d399' }} />
              DATABASE SEHAT (LIVE)
            </div>
            
            <button 
              onClick={toggleTheme} 
              style={{ background: 'transparent', border: 'none', color: 'var(--gold-intense)', fontSize: '24px', cursor: 'pointer' }}
              title="Ganti Tema"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                style={{
                  background: 'var(--bg-dark-box)', border: '1px solid rgba(243, 198, 83, 0.2)',
                  borderRadius: '30px', padding: '8px 16px 8px 8px', display: 'flex', alignItems: 'center', gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-intense)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#02130e' }}>
                  {profile?.full_name ? profile.full_name.charAt(0) : 'A'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{profile?.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Account Officer</div>
                </div>
              </div>

              {isProfileMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: 'var(--bg-card)', border: '1px solid rgba(243, 198, 83, 0.3)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 15px 35px var(--shadow-color)', zIndex: 100, minWidth: '180px' }}>
                  <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '14px 20px', color: 'var(--text-danger)', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>🔌 Keluar</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <AODashboard activeMenu={activeMenu} setActiveMenu={setActiveMenu} profile={profile} />
      </main>

      {/* Immersive Global AI Chatbot */}
      <AIChatbot role="ao" />
    </div>
  );
}

function AOMenuButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
        border: 'none',
        textAlign: 'left',
        padding: '10px 14px',
        borderRadius: '14px',
        color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
        fontWeight: 800,
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s',
        boxShadow: active ? '0 4px 15px var(--shadow-color)' : 'none',
        width: '100%'
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      {label}
    </button>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import AccountingDashboard from '@/components/dashboard/AccountingDashboard';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import NotificationBell from '@/components/dashboard/NotificationBell';
import { useTheme } from '@/context/ThemeContext';
import AIChatbot from '@/components/dashboard/AIChatbot';

export default function AccountingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createClient();
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error || !currentUser) {
        router.push('/login');
        return;
      }
      
      setUser(currentUser);

      // Retrieve extended role details
      const { data: dbProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (dbProfile) {
        setProfile(dbProfile);
        
        // Route Security Validation: Authorize only 'accounting' or 'super_admin' admins
        const allowedRoles = ['accounting', 'super_admin'];
        if (!allowedRoles.includes(dbProfile.role)) {
          router.push('/dashboard');
          return;
        }
      } else {
        // In case profile wasn't found, drop back to safety
        router.push('/dashboard');
        return;
      }
      
      setLoading(false);
    };
    
    fetchSession();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid rgba(243, 198, 83, 0.2)', borderTopColor: '#f3c653', borderRadius: '50%' }}></div>
        <h3 style={{ color: 'var(--gold-bright)', fontWeight: 900, fontSize: '18px', letterSpacing: '1px' }}>MEMBUKA SISTEM PEMBUKUAN SAK EP...</h3>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'transparent',
      color: 'var(--text-primary)',
      display: 'flex',
      position: 'relative'
    }}>
      <GlobalSiteBackground />
      
      {/* 1. SIDEBAR: Matching Super Admin Style */}
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
              <div style={{ fontSize: '10px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px', marginLeft: '52px' }}>
                Accounting Div
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>✖</button>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px', marginTop: '10px' }}>ACCOUNTING & PEMBUKUAN</div>
            
            <AccountingMenuButton 
              active={activeMenu === 'overview'} 
              onClick={() => setActiveMenu('overview')} 
              icon="⊞" 
              label="Ikhtisar Keuangan" 
            />
            <AccountingMenuButton 
              active={activeMenu === 'journal'} 
              onClick={() => setActiveMenu('journal')} 
              icon="☷" 
              label="Manajemen Jurnal" 
            />
            <AccountingMenuButton 
              active={activeMenu === 'reports'} 
              onClick={() => setActiveMenu('reports')} 
              icon="▤" 
              label="Laporan SAK EP" 
            />
            <AccountingMenuButton 
              active={activeMenu === 'provisioning'} 
              onClick={() => setActiveMenu('provisioning')} 
              icon="⛨" 
              label="Pencadangan CKPN" 
            />
            <AccountingMenuButton 
              active={activeMenu === 'assets'} 
              onClick={() => setActiveMenu('assets')} 
              icon="🏢" 
              label="Aset Tetap & Depresiasi" 
            />
            <AccountingMenuButton 
              active={activeMenu === 'eom'} 
              onClick={() => setActiveMenu('eom')} 
              icon="◒" 
              label="Bagi Hasil (EOM)" 
            />
            <AccountingMenuButton 
              active={activeMenu === 'eod'} 
              onClick={() => setActiveMenu('eod')} 
              icon="✖" 
              label="Tutup Buku (EOD)" 
            />
          </nav>
        </aside>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <main style={{ 
        flexGrow: 1, 
        padding: '24px 40px', 
        overflowY: 'auto',
        height: '100vh',
        position: 'relative',
        zIndex: 10
      }}>
        
        {/* Header matching Super Admin */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'sticky', top: '-24px', paddingTop: '24px', paddingBottom: '16px', background: 'var(--bg-card)', zIndex: 20, borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--gold-intense)', fontSize: '28px', cursor: 'pointer', marginTop: '-2px' }}>
                ☰
              </button>
            )}
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '6px', textShadow: '0 2px 10px var(--shadow-color)' }}>
                {activeMenu === 'overview' && 'Ikhtisar Keuangan Syariah'}
                {activeMenu === 'journal' && 'Sistem Pembukuan & Buku Besar'}
                {activeMenu === 'reports' && 'Laporan Keuangan SAK EP'}
                {activeMenu === 'provisioning' && 'Manajemen Risiko CKPN'}
                {activeMenu === 'assets' && 'Manajemen Aset Tetap'}
                {activeMenu === 'eom' && 'Distribusi Bagi Hasil (EOM)'}
                {activeMenu === 'eod' && 'Tutup Buku Harian (End of Day)'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
                {activeMenu === 'overview' && 'Statistik operasi keuangan real-time IQ-RA System.'}
                {activeMenu === 'journal' && 'Pencatatan jurnal otomatis dan manajemen buku besar koperasi.'}
                {activeMenu === 'reports' && 'Audit kesesuaian laporan keuangan berstandar SAK EP.'}
                {activeMenu === 'provisioning' && 'Validasi cadangan kerugian penurunan nilai (NPL).'}
                {activeMenu === 'assets' && 'Buku besar inventaris, kendaraan, dan kalkulasi depresiasi massal.'}
                {activeMenu === 'eom' && 'Proses kalkulasi dan pembagian margin/bagi hasil ke anggota.'}
                {activeMenu === 'eod' && 'Otorisasi kunci mutasi kas harian dan validasi teller.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'var(--bg-card)', border: '2px solid #34d399', borderRadius: '30px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 800, color: 'var(--text-success)', boxShadow: '0 4px 15px rgba(52, 211, 153, 0.2)' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--text-success)', borderRadius: '50%', boxShadow: '0 0 10px #34d399' }} />
              DATABASE SEHAT (LIVE)
            </div>
            
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
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{profile?.role}</div>
                </div>
              </div>

              {isProfileMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: 'var(--bg-card)', border: '1px solid rgba(243, 198, 83, 0.3)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 15px 35px var(--shadow-color)', zIndex: 100, minWidth: '180px' }}>
                  <button onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '14px 20px', color: 'var(--text-danger)', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>🔌 Keluar</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <AccountingDashboard activeMenu={activeMenu} profile={profile} />
      </main>

      <AIChatbot role="accounting" />
    </div>
  );
}

function AccountingMenuButton({ active, onClick, icon, label }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        background: active 
          ? 'var(--gold-intense)' 
          : (isHovered ? 'var(--bg-dark-box)' : 'transparent'),
        color: active ? '#02130e' : 'var(--sidebar-heading)',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 800,
        textAlign: 'left',
        cursor: 'pointer',
        transform: !active && isHovered ? 'translateX(6px)' : 'scale(1)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 8px 20px var(--shadow-color)' : 'none',
        width: '100%'
      }}
    >
      <span style={{ 
        fontSize: '18px',
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.2s ease'
      }}>{icon}</span>
      {label}
    </button>
  );
}

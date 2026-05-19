'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import CSDashboard from '../../components/dashboard/CSDashboard';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export default function CustomerServicePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('onboarding');
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
        // Security check: Only allow customer_service and super_admin
        if (dbProfile.role !== 'customer_service' && dbProfile.role !== 'super_admin') {
          router.push('/dashboard');
          return;
        }
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
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
        <h3 style={{ color: 'var(--gold-bright)', fontWeight: 800 }}>Membuka Layanan CS...</h3>
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
      
      {/* 🟡 CS SIDEBAR */}
      <aside style={{
        width: isSidebarOpen ? '300px' : '0px',
        opacity: isSidebarOpen ? 1 : 0,
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(20px)',
        borderRight: isSidebarOpen ? '2px solid var(--border-primary)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        padding: isSidebarOpen ? '40px 24px' : '0px',
        zIndex: 100,
        boxShadow: isSidebarOpen ? '20px 0 50px var(--shadow-color)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        height: '100vh'
      }}>
        {/* Close Button Toggle */}
        {isSidebarOpen && (
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
              transition: 'all 0.3s',
              zIndex: 110
            }}
          >
            ✕
          </button>
        )}

        <div style={{ marginBottom: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <BrandLogo size={42} fontSize="22px" textColor="var(--text-primary)" />
            <div style={{ marginRight: '45px' }}>
              <ThemeToggle />
            </div>
          </div>
          <span style={{ color: 'var(--text-primary)', fontSize: '12px', display: 'block', opacity: 0.6, marginTop: '12px', fontWeight: 800, letterSpacing: '1px' }}>CUSTOMER SERVICE</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
          <CSMenuButton active={activeMenu === 'onboarding'} onClick={() => setActiveMenu('onboarding')} icon="📝" label="Registrasi Anggota" />
          <CSMenuButton active={activeMenu === 'kyc'} onClick={() => setActiveMenu('kyc')} icon="📂" label="Verifikasi KYC" />
          <CSMenuButton active={activeMenu === 'ai-help'} onClick={() => setActiveMenu('ai-help')} icon="💬" label="AI Sharia Assistant" />
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          padding: '24px', 
          background: 'var(--border-primary)', 
          borderRadius: '20px',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Staff CS On-Duty</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>{profile?.full_name}</div>
          <button 
            onClick={handleLogout}
            style={{ 
              marginTop: '20px', width: '100%', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--text-primary)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '12px', 
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
          >
            Keluar Sesi
          </button>
        </div>
      </aside>

      {/* ⚪ MAIN CONTENT */}
      <main style={{ 
        flexGrow: 1, 
        padding: '40px 60px', 
        zIndex: 20, 
        overflowY: 'auto',
        height: '100vh',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {!isSidebarOpen && (
          <div style={{ marginBottom: '24px' }}>
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
          </div>
        )}
        <CSDashboard activeMenu={activeMenu} profile={profile} />
      </main>
    </div>
  );
}

function CSMenuButton({ active, onClick, icon, label }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        background: active 
          ? 'var(--text-primary)' 
          : (isHovered ? 'var(--border-primary)' : 'transparent'),
        color: active ? 'var(--bg-page)' : 'var(--text-primary)',
        border: 'none',
        borderRadius: '14px',
        fontSize: '16px',
        fontWeight: 900,
        textAlign: 'left',
        cursor: 'pointer',
        transform: !active && isHovered ? 'translateX(6px)' : 'translateX(0)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 10px 20px var(--shadow-color)' : 'none',
        width: '100%'
      }}
    >
      <span style={{ 
        fontSize: '22px',
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        opacity: active ? 1 : 0.8
      }}>{icon}</span>
      <span style={{ opacity: active ? 1 : 0.9 }}>{label}</span>
    </button>
  );
}

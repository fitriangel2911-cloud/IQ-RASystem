'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export default function ManagerPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();

      if (error || !currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // Retrieve Extended User Profile metadata (role access)
      const { data: dbProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (dbProfile) {
        setProfile(dbProfile);
        
        // Safety enforcement: Allow strictly 'manager' or IT Administrator 'super_admin'
        const allowedRoles = ['manager', 'super_admin'];
        if (!allowedRoles.includes(dbProfile.role)) {
          router.push('/dashboard');
          return;
        }
      } else {
        router.push('/dashboard');
        return;
      }

      setLoading(false);
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
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid rgba(243, 198, 83, 0.2)', borderTopColor: '#f3c653', borderRadius: '50%' }}></div>
        <h3 style={{ color: 'var(--gold-bright)', fontWeight: 900, fontSize: '18px', letterSpacing: '1px' }}>MENGINISIALISASI POS KOMANDO MANAGER...</h3>
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
      {/* 🖼️ Apply White Animated Sharia Geometric Backdrop */}
      <GlobalSiteBackground />
      
      {/* 🏛️ MANAGER EXCLUSIVE PRESTIGE SIDEBAR */}
      <aside style={{
        width: isSidebarOpen ? '320px' : '0px',
        opacity: isSidebarOpen ? 1 : 0,
        background: 'var(--bg-sidebar)', 
        borderRight: isSidebarOpen ? '3.5px solid var(--border-primary)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        padding: isSidebarOpen ? '40px 24px' : '0px',
        zIndex: 100,
        boxShadow: isSidebarOpen ? '25px 0 70px var(--shadow-color)' : 'none',
        backdropFilter: 'blur(20px)',
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

        {/* Command Header */}
        <div style={{ marginBottom: '50px', paddingLeft: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <BrandLogo size={40} fontSize="22px" textColor="var(--text-primary)" />
            <div style={{ marginRight: '35px' }}>
              <ThemeToggle />
            </div>
          </div>
          <span style={{ fontSize: '11px', display: 'block', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', marginTop: '12px', background: '#cca334', color: '#02130e', padding: '4px 12px', borderRadius: '6px', width: 'max-content' }}>
            🏢 GENERAL MANAGER
          </span>
        </div>

        {/* Manager Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
          <ManagerMenuButton 
            active={activeMenu === 'overview'} 
            onClick={() => setActiveMenu('overview')} 
            icon="📊" 
            label="Analitik Eksekutif" 
          />
          <ManagerMenuButton 
            active={activeMenu === 'approvals'} 
            onClick={() => setActiveMenu('approvals')} 
            icon="⚖️" 
            label="Persetujuan Akad" 
          />
          <ManagerMenuButton 
            active={activeMenu === 'contracts'} 
            onClick={() => setActiveMenu('contracts')} 
            icon="📋" 
            label="Riwayat Otorisasi" 
          />
          <ManagerMenuButton 
            active={activeMenu === 'rag'} 
            onClick={() => setActiveMenu('rag')} 
            icon="🤖" 
            label="RAG Pipeline" 
          />
        </nav>

        {/* Active Executive Profile Section */}
        <div style={{ 
          marginTop: 'auto', 
          padding: '24px', 
          background: 'var(--border-primary)', 
          borderRadius: '24px',
          border: '2.5px solid var(--border-primary)',
          boxShadow: '0 10px 25px var(--shadow-color)'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Otorisator Aktif</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '18px', textShadow: '0 2px 4px var(--shadow-color)' }}>{profile?.full_name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', opacity: 0.7, fontWeight: 600, marginTop: '4px' }}>Otoritas Eksekutif Utama</div>
          
          <button 
            onClick={handleLogout}
            style={{ 
              marginTop: '24px', width: '100%', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--text-primary)', 
              border: '2px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '14px', 
              fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' 
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
          >
            🚪 Tutup Konsol / Log Out
          </button>
        </div>
      </aside>

      {/* ⚪ DYNAMIC VISUAL CONTENT AREA */}
      <main style={{ 
        flexGrow: 1, 
        padding: '50px 70px', 
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
        
        {/* Header Dashboard Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '28px', margin: 0 }}>
              {activeMenu === 'overview' && '📊 Pusat Kontrol Eksekutif'}
              {activeMenu === 'approvals' && '⚖️ Otorisasi Akad Syariah'}
              {activeMenu === 'contracts' && '📋 Arsip Otorisasi Pembiayaan'}
              {activeMenu === 'rag' && '🤖 Saluran Ingesti Data RAG'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', opacity: 0.7, fontSize: '14px', fontWeight: 600, marginTop: '6px' }}>
              Keputusan final eksekutif didukung dengan Rekomendasi Pintar AI RAG.
            </p>
          </div>
          
          {/* Time Frame Indicator */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', padding: '12px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: 900, boxShadow: '0 10px 25px var(--shadow-color)' }}>
            📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <ManagerDashboard activeMenu={activeMenu} profile={profile} />
      </main>
    </div>
  );
}

function ManagerMenuButton({ active, onClick, icon, label }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '18px 24px',
        background: active 
          ? 'var(--text-primary)' 
          : (isHovered ? 'var(--border-primary)' : 'transparent'),
        color: active ? 'var(--bg-page)' : 'var(--text-primary)',
        border: active ? 'none' : '1.5px solid var(--border-primary)',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: 900,
        textAlign: 'left',
        cursor: 'pointer',
        transform: !active && isHovered ? 'translateX(6px)' : 'scale(1)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 15px 35px rgba(243, 198, 83, 0.35)' : 'none',
        width: '100%'
      }}
    >
      <span style={{ 
        fontSize: '22px',
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.2s ease'
      }}>{icon}</span>
      {label}
    </button>
  );
}

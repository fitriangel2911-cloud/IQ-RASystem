'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');

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
        
        // Safety enforcement: Allow strictly 'manager' or IT Administrator 'super_user'
        const allowedRoles = ['manager', 'super_user'];
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
      <div style={{ minHeight: '100vh', background: '#02130e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid rgba(243, 198, 83, 0.2)', borderTopColor: '#f3c653', borderRadius: '50%' }}></div>
        <h3 style={{ color: '#f3c653', fontWeight: 900, fontSize: '18px', letterSpacing: '1px' }}>MENGINISIALISASI POS KOMANDO MANAGER...</h3>
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
        width: '320px',
        background: 'rgba(4, 49, 33, 0.96)', 
        borderRight: '3px solid #cca334',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 24px',
        zIndex: 100,
        boxShadow: '25px 0 70px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)'
      }}>
        
        {/* Command Header */}
        <div style={{ marginBottom: '50px', paddingLeft: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#f3c653', margin: 0, letterSpacing: '1.5px' }}>
            iQ-RA System
            <span style={{ fontSize: '11px', display: 'block', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', marginTop: '6px', background: '#cca334', color: '#02130e', padding: '4px 12px', borderRadius: '6px', width: 'max-content' }}>
              🏢 GENERAL MANAGER
            </span>
          </h1>
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
          background: 'rgba(2, 19, 14, 0.7)', 
          borderRadius: '24px',
          border: '2.5px solid #cca334',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Otorisator Aktif</div>
          <div style={{ color: '#f3c653', fontWeight: 900, fontSize: '18px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{profile?.full_name}</div>
          <div style={{ color: '#ffffff', fontSize: '12px', opacity: 0.7, fontWeight: 600, marginTop: '4px' }}>Otoritas Eksekutif Utama</div>
          
          <button 
            onClick={handleLogout}
            style={{ 
              marginTop: '24px', width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', 
              border: '2px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '14px', 
              fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' 
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#fca5a5';
            }}
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
        height: '100vh'
      }}>
        
        {/* Header Dashboard Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ color: '#043121', fontWeight: 900, fontSize: '28px', margin: 0 }}>
              {activeMenu === 'overview' && '📊 Pusat Kontrol Eksekutif'}
              {activeMenu === 'approvals' && '⚖️ Otorisasi Akad Syariah'}
              {activeMenu === 'contracts' && '📋 Arsip Otorisasi Pembiayaan'}
              {activeMenu === 'rag' && '🤖 Saluran Ingesti Data RAG'}
            </h2>
            <p style={{ color: '#043121', opacity: 0.7, fontSize: '14px', fontWeight: 600, marginTop: '6px' }}>
              Keputusan final eksekutif didukung dengan Rekomendasi Pintar AI RAG.
            </p>
          </div>
          
          {/* Time Frame Indicator */}
          <div style={{ background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', color: '#02130e', padding: '12px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: 900, boxShadow: '0 10px 25px rgba(204, 163, 52, 0.2)' }}>
            📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <ManagerDashboard activeMenu={activeMenu} profile={profile} />
      </main>
    </div>
  );
}

function ManagerMenuButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '18px 24px',
        background: active ? 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)' : 'transparent',
        color: active ? '#02130e' : 'rgba(255,255,255,0.75)',
        border: active ? 'none' : '1.5px solid rgba(255,255,255,0.05)',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: 900,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.3s ease-out',
        boxShadow: active ? '0 15px 35px rgba(243, 198, 83, 0.35)' : 'none',
        transform: active ? 'scale(1.02)' : 'scale(1)'
      }}
      onMouseOver={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = '#ffffff';
        }
      }}
      onMouseOut={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
        }
      }}
    >
      <span style={{ fontSize: '22px' }}>{icon}</span>
      {label}
    </button>
  );
}

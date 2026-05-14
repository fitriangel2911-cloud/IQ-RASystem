'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import CSDashboard from '../../components/dashboard/CSDashboard';
import BrandLogo from '@/components/brand/BrandLogo';

export default function CustomerServicePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('onboarding');

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
      <div style={{ minHeight: '100vh', background: '#02130e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h3 style={{ color: '#f3c653', fontWeight: 800 }}>Membuka Layanan CS...</h3>
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
        width: '300px',
        background: '#043121', // Matched with Homepage green
        borderRight: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 24px',
        zIndex: 100,
        boxShadow: '20px 0 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ marginBottom: '50px' }}>
          <BrandLogo size={45} fontSize="22px" />
          <span style={{ color: '#ffffff', fontSize: '12px', display: 'block', opacity: 0.6, marginTop: '8px' }}>CUSTOMER SERVICE</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
          <CSMenuButton active={activeMenu === 'onboarding'} onClick={() => setActiveMenu('onboarding')} icon="📝" label="Registrasi Anggota" />
          <CSMenuButton active={activeMenu === 'kyc'} onClick={() => setActiveMenu('kyc')} icon="📂" label="Verifikasi KYC" />
          <CSMenuButton active={activeMenu === 'ai-help'} onClick={() => setActiveMenu('ai-help')} icon="💬" label="AI Sharia Assistant" />
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          padding: '24px', 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Staff CS On-Duty</div>
          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px' }}>{profile?.full_name}</div>
          <button 
            onClick={handleLogout}
            style={{ 
              marginTop: '20px', width: '100%', background: 'transparent', color: '#fca5a5', 
              border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '12px', 
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' 
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
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
        height: '100vh'
      }}>
        <CSDashboard activeMenu={activeMenu} profile={profile} />
      </main>
    </div>
  );
}

function CSMenuButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        background: active ? 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)' : 'transparent',
        color: active ? '#02130e' : 'rgba(255,255,255,0.6)',
        border: 'none',
        borderRadius: '18px',
        fontSize: '15px',
        fontWeight: 800,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: active ? '0 10px 20px rgba(204, 163, 52, 0.2)' : 'none'
      }}
    >
      <span style={{ fontSize: '22px' }}>{icon}</span>
      {label}
    </button>
  );
}

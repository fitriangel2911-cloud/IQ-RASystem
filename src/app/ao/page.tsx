'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import AODashboard from '@/components/dashboard/AODashboard';
import BrandLogo from '@/components/brand/BrandLogo';

export default function AOPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');

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
      <div style={{ minHeight: '100vh', background: '#02130e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
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
      
      <aside style={{
        width: '320px',
        background: 'rgba(4, 49, 33, 0.96)', 
        borderRight: '3px solid #10b981',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 24px',
        zIndex: 100,
        boxShadow: '25px 0 70px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)'
      }}>
        
        <div style={{ marginBottom: '50px', paddingLeft: '12px' }}>
          <BrandLogo size={40} fontSize="22px" />
          <span style={{ fontSize: '11px', display: 'block', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', marginTop: '12px', background: '#10b981', color: '#02130e', padding: '4px 12px', borderRadius: '6px', width: 'max-content' }}>
            💼 ACCOUNT OFFICER
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
          <AOMenuButton 
            active={activeMenu === 'overview'} 
            onClick={() => setActiveMenu('overview')} 
            icon="📊" 
            label="Pipeline AO" 
          />
          <AOMenuButton 
            active={activeMenu === 'leads'} 
            onClick={() => setActiveMenu('leads')} 
            icon="🎯" 
            label="Input Prospek" 
          />
          <AOMenuButton 
            active={activeMenu === 'portfolio'} 
            onClick={() => setActiveMenu('portfolio')} 
            icon="📂" 
            label="Portofolio Anggota" 
          />
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          padding: '24px', 
          background: 'rgba(2, 19, 14, 0.7)', 
          borderRadius: '24px',
          border: '2.5px solid #10b981',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Officer Aktif</div>
          <div style={{ color: '#10b981', fontWeight: 900, fontSize: '18px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{profile?.full_name}</div>
          <div style={{ color: '#ffffff', fontSize: '12px', opacity: 0.7, fontWeight: 600, marginTop: '4px' }}>Account & Field Analyst</div>
          
          <button 
            onClick={handleLogout}
            style={{ 
              marginTop: '24px', width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', 
              border: '2px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '14px', 
              fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' 
            }}
          >
            🚪 Log Out
          </button>
        </div>
      </aside>

      <main style={{ 
        flexGrow: 1, 
        padding: '50px 70px', 
        zIndex: 20, 
        overflowY: 'auto',
        height: '100vh'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ color: '#043121', fontWeight: 900, fontSize: '28px', margin: 0 }}>
              {activeMenu === 'overview' && '📊 Dashboard Operasional AO'}
              {activeMenu === 'leads' && '🎯 Manajemen Prospek & Lead'}
              {activeMenu === 'portfolio' && '📂 Monitoring Portofolio Aktif'}
            </h2>
            <p style={{ color: '#043121', opacity: 0.7, fontSize: '14px', fontWeight: 600, marginTop: '6px' }}>
              Kelola ekosistem pembiayaan syariah secara produktif dan amanah.
            </p>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '12px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: 900, boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)' }}>
            📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <AODashboard activeMenu={activeMenu} profile={profile} />
      </main>
    </div>
  );
}

function AOMenuButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '18px 24px',
        background: active ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
        color: active ? '#ffffff' : 'rgba(255,255,255,0.75)',
        border: active ? 'none' : '1.5px solid rgba(255,255,255,0.05)',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: 900,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.3s ease-out',
        boxShadow: active ? '0 15px 35px rgba(16, 185, 129, 0.35)' : 'none',
        transform: active ? 'scale(1.02)' : 'scale(1)'
      }}
    >
      <span style={{ fontSize: '22px' }}>{icon}</span>
      {label}
    </button>
  );
}

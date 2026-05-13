'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import DPSDashboard from '@/components/dashboard/DPSDashboard';

export default function DPSPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user: curUser }, error } = await supabase.auth.getUser();

      if (error || !curUser) {
        router.push('/login');
        return;
      }

      setUser(curUser);

      // Retrieve profile for role checking
      const { data: dbP } = await supabase
        .from('users')
        .select('*')
        .eq('id', curUser.id)
        .single();

      if (dbP) {
        setProfile(dbP);
        
        // Authenticate only 'dps' (Dewan Pengawas Syariah) or 'super_user'
        const validRoles = ['dps', 'super_user'];
        if (!validRoles.includes(dbP.role)) {
          router.push('/dashboard');
          return;
        }
      } else {
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkAuth();
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
        <h3 style={{ color: '#f3c653', fontWeight: 900, fontSize: '18px', letterSpacing: '1px' }}>MENGHUBUNGKAN KE LOG AUDIT SYARIAH...</h3>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
      <GlobalSiteBackground />

      {/* 🕋 DEWAN PENGAWAS SYARIAH PRESTIGE SIDEBAR */}
      <aside style={{
        width: '320px',
        background: 'rgba(4, 49, 33, 0.97)',
        borderRight: '3px solid #cca334',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 24px',
        zIndex: 100,
        boxShadow: '25px 0 70px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(24px)'
      }}>
        
        <div style={{ marginBottom: '50px', paddingLeft: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#f3c653', margin: 0, letterSpacing: '1.5px' }}>
            iQ-RA System
            <span style={{ color: '#02130e', fontSize: '10px', display: 'block', fontWeight: 900, textTransform: 'uppercase', marginTop: '8px', background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', padding: '4px 10px', borderRadius: '6px', width: 'max-content' }}>
              🕌 DEWAN PENGAWAS SYARIAH
            </span>
          </h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
          <DPSMenuButton active={activeMenu === 'overview'} onClick={() => setActiveMenu('overview')} icon="🕋" label="Monitor Kepatuhan" />
          <DPSMenuButton active={activeMenu === 'audit'} onClick={() => setActiveMenu('audit')} icon="🛡️" label="Audit Akad Pembiayaan" />
          <DPSMenuButton active={activeMenu === 'rag'} onClick={() => setActiveMenu('rag')} icon="🤖" label="RAG Pipeline" />
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          padding: '24px', 
          background: 'rgba(2, 19, 14, 0.8)', 
          borderRadius: '24px',
          border: '2px solid #cca334',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Anggota Dewan DPS</div>
          <div style={{ color: '#ffffff', fontWeight: 900, fontSize: '18px' }}>{profile?.full_name}</div>
          <div style={{ color: '#34d399', fontSize: '12px', fontWeight: 600 }}>Hak Akses: Auditor Syariah</div>

          <button 
            onClick={handleLogout}
            style={{ 
              marginTop: '24px', width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', 
              border: '2px solid rgba(239, 68, 68, 0.3)', padding: '14px', borderRadius: '14px', 
              fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' 
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
            🚪 Keluar Pengawasan
          </button>
        </div>
      </aside>

      {/* MAIN SCROLLING REGION */}
      <main style={{ flexGrow: 1, padding: '50px 70px', zIndex: 20, overflowY: 'auto', height: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ color: '#043121', fontWeight: 900, fontSize: '28px', margin: 0 }}>
              {activeMenu === 'overview' && '🕋 Pusat Pengawasan Kepatuhan Syariah'}
              {activeMenu === 'audit' && '🛡️ Audit & Otorisasi Syahadat Akad'}
              {activeMenu === 'rag' && '🤖 Saluran Ingesti Data RAG'}
            </h2>
            <p style={{ color: '#043121', opacity: 0.7, fontSize: '14px', fontWeight: 600, marginTop: '6px' }}>
              Menjaga kemurnian operasional koperasi bebas dari unsur Riba, Gharar, dan Maysir.
            </p>
          </div>

          <div style={{ background: '#043121', color: '#f3c653', padding: '12px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: 900 }}>
            🕌 {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <DPSDashboard activeMenu={activeMenu} profile={profile} />
      </main>
    </div>
  );
}

function DPSMenuButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 24px',
        background: active ? 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)' : 'transparent',
        color: active ? '#02130e' : 'rgba(255,255,255,0.75)',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.05)',
        borderRadius: '20px', fontSize: '16px', fontWeight: 900, textAlign: 'left',
        cursor: 'pointer', transition: 'all 0.3s',
        boxShadow: active ? '0 15px 30px rgba(243,198,83,0.3)' : 'none',
        transform: active ? 'scale(1.02)' : 'scale(1)'
      }}
      onMouseOver={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: '22px' }}>{icon}</span>
      {label}
    </button>
  );
}

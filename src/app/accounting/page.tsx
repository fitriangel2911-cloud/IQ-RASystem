'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import AccountingDashboard from '@/components/dashboard/AccountingDashboard';

export default function AccountingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');

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
        
        // Route Security Validation: Authorize only 'accounting' or 'super_user' admins
        const allowedRoles = ['accounting', 'super_user'];
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
      <div style={{ minHeight: '100vh', background: '#02130e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid rgba(243, 198, 83, 0.2)', borderTopColor: '#f3c653', borderRadius: '50%' }}></div>
        <h3 style={{ color: '#f3c653', fontWeight: 900, fontSize: '18px', letterSpacing: '1px' }}>MEMBUKA SISTEM PEMBUKUAN SAK EP...</h3>
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
      {/* 🖼️ Apply Animated White Geometric Pattern Background */}
      <GlobalSiteBackground />
      
      {/* 🌲 ACCOUNTING EXCLUSIVE EMERALD SIDEBAR */}
      <aside style={{
        width: '320px',
        background: 'rgba(4, 49, 33, 0.95)', // Beautiful deep emerald backdrop
        borderRight: '3px solid #cca334', // Majestic thick Gold border line
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 24px',
        zIndex: 100,
        boxShadow: '25px 0 70px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(15px)'
      }}>
        
        {/* Brand Header */}
        <div style={{ marginBottom: '50px', paddingLeft: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#f3c653', margin: 0, letterSpacing: '1.5px' }}>
            iQ-RA System
            <span style={{ color: '#ffffff', fontSize: '11px', display: 'block', opacity: 0.7, fontWeight: 800, textTransform: 'uppercase', marginTop: '6px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', width: 'max-content' }}>
              💼 ACCOUNTING DIV
            </span>
          </h1>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
          <AccountingMenuButton 
            active={activeMenu === 'overview'} 
            onClick={() => setActiveMenu('overview')} 
            icon="📊" 
            label="Ringkasan Keuangan" 
          />
          <AccountingMenuButton 
            active={activeMenu === 'journal'} 
            onClick={() => setActiveMenu('journal')} 
            icon="✒️" 
            label="Buku Besar & Jurnal" 
          />
          <AccountingMenuButton 
            active={activeMenu === 'reports'} 
            onClick={() => setActiveMenu('reports')} 
            icon="📑" 
            label="Laporan SAK EP" 
          />
          <AccountingMenuButton 
            active={activeMenu === 'provisioning'} 
            onClick={() => setActiveMenu('provisioning')} 
            icon="🛡️" 
            label="Pencadangan CKPN" 
          />
        </nav>

        {/* Active Operator Profile */}
        <div style={{ 
          marginTop: 'auto', 
          padding: '24px', 
          background: 'rgba(2, 19, 14, 0.6)', 
          borderRadius: '24px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.3)'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Petugas Pembukuan</div>
          <div style={{ color: '#ffffff', fontWeight: 900, fontSize: '16px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{profile?.full_name}</div>
          <div style={{ color: '#34d399', fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>Status: Terautentikasi</div>
          
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
            🚪 Tutup Buku / Keluar
          </button>
        </div>
      </aside>

      {/* ⚪ SCROLLABLE DYNAMIC MAIN CONTENT AREA */}
      <main style={{ 
        flexGrow: 1, 
        padding: '50px 70px', 
        zIndex: 20, 
        overflowY: 'auto',
        height: '100vh'
      }}>
        
        {/* Internal Page Header Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ color: '#043121', fontWeight: 900, fontSize: '28px', margin: 0 }}>
              {activeMenu === 'overview' && '📊 Dasbor Informasi Keuangan'}
              {activeMenu === 'journal' && '✒️ Jurnal Penyesuaian & Buku Besar'}
              {activeMenu === 'reports' && '📑 Laporan Keuangan Syariah'}
              {activeMenu === 'provisioning' && '🛡️ Manajemen Risiko Penurunan Nilai (CKPN)'}
            </h2>
            <p style={{ color: '#043121', opacity: 0.7, fontSize: '14px', fontWeight: 600, marginTop: '6px' }}>
              Manajemen akuntansi terotomasi terpadu berbasis PostgreSQL Cloud.
            </p>
          </div>
          
          {/* Date Pill */}
          <div style={{ background: '#043121', color: '#f3c653', padding: '12px 20px', borderRadius: '14px', fontSize: '14px', fontWeight: 900, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <AccountingDashboard activeMenu={activeMenu} profile={profile} />
      </main>
    </div>
  );
}

function AccountingMenuButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '18px 24px',
        background: active ? 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)' : 'transparent',
        color: active ? '#02130e' : 'rgba(255,255,255,0.7)',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.05)',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: 900,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 15px 30px rgba(243, 198, 83, 0.3)' : 'none',
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
          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
        }
      }}
    >
      <span style={{ fontSize: '22px' }}>{icon}</span>
      {label}
    </button>
  );
}

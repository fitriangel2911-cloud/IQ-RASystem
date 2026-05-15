'use client';
import React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  profile: any;
}

export default function Sidebar({ activeTab, setActiveTab, profile }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const confirmSignOut = window.confirm('Apakah Anda yakin ingin keluar dari akun Anda?');
    if (!confirmSignOut) return;
    
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Ringkasan Akun', icon: '📊' },
    { id: 'accounts', label: 'Daftar Rekening', icon: '💳' },
    { id: 'transactions', label: 'Riwayat Transaksi', icon: '💸' },
    { id: 'financing', label: 'Pengajuan Pembiayaan', icon: '🤝' },
    { id: 'profile', label: 'Profil & Dokumen', icon: '👤' },
  ];

  const isProfileComplete = profile?.nik && profile?.kk_number && profile?.phone_number;

  return (
    <aside style={{
      width: '280px',
      background: 'linear-gradient(180deg, #032419 0%, #021c13 100%)',
      borderRight: '2px solid #cca334',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 20px',
      position: 'sticky',
      top: 0,
      height: '100vh',
      zIndex: 30,
      boxShadow: '6px 0 20px rgba(0,0,0,0.4)',
      flexShrink: 0
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
          width: '40px', height: '40px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(204, 163, 52, 0.3)'
        }}>
          <img src="/logo-recolored.png" alt="iQ-RA" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>iQ-RA SYSTEM</div>
          <div style={{ fontSize: '10px', color: '#cca334', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Portal Anggota</div>
        </div>
      </div>

      {/* Miniature Profile Widget */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(204, 163, 52, 0.2)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: '#f3c653', color: '#02130e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 900, boxShadow: '0 4px 10px rgba(243, 198, 83, 0.3)'
        }}>
          {profile?.users?.full_name ? profile.users.full_name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile?.users?.full_name || 'Memuat...'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isProfileComplete ? '#34d399' : '#ef4444',
              boxShadow: isProfileComplete ? '0 0 8px #34d399' : '0 0 8px #ef4444'
            }} />
            <span style={{ fontSize: '11px', color: isProfileComplete ? '#34d399' : '#fca5a5', fontWeight: 700 }}>
              {isProfileComplete ? 'Dokumen Lengkap' : 'Dokumen Belum Lengkap'}
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              background: activeTab === item.id ? '#f3c653' : 'transparent',
              border: 'none',
              textAlign: 'left',
              padding: '14px 16px',
              borderRadius: '12px',
              color: activeTab === item.id ? '#02130e' : 'rgba(255,255,255,0.8)',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === item.id ? '0 4px 15px rgba(243, 198, 83, 0.3)' : 'none'
            }}
            onMouseOver={(e) => {
              if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseOut={(e) => {
              if (activeTab !== item.id) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout Trigger Button */}
      <button
        onClick={handleLogout}
        style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid #fca5a5',
          color: '#ffffff',
          padding: '14px',
          borderRadius: '12px',
          fontWeight: 800,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginTop: '20px'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
      >
        🔌 Keluar Sesi Portal
      </button>
    </aside>
  );
}

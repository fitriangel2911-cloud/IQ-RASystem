'use client';
import React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  profile: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, profile, isOpen, onClose }: SidebarProps) {
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
      width: isOpen ? '300px' : '0px',
      opacity: isOpen ? 1 : 0,
      background: 'var(--bg-sidebar)',
      backdropFilter: 'blur(25px)',
      borderRight: isOpen ? '3px solid var(--gold-intense)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      padding: isOpen ? '40px 24px' : '0px',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      zIndex: 100,
      boxShadow: isOpen ? '10px 0 30px var(--shadow-color)' : 'none',
      flexShrink: 0,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden'
    }}>
      {/* Sidebar Close Toggle - Enhanced Spacing & Visibility */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          right: '24px',
          top: '24px',
          background: 'rgba(0,0,0,0.15)',
          border: '2px solid var(--text-primary)',
          borderRadius: '12px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 900,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          zIndex: 110
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'rotate(0deg) scale(1)'; }}
        title="Tutup Navigasi"
      >
        ✕
      </button>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px', marginTop: '10px' }}>
        <div style={{
          background: 'var(--text-primary)',
          width: '45px', height: '45px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}>
          <img src="/logo-recolored.png" alt="iQ-RA" style={{ width: '75%', height: '75%', objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>iQ-RA SYSTEM</div>
          <div style={{ fontSize: '11px', color: 'var(--text-primary)', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Portal Anggota</div>
        </div>
      </div>

      {/* Profile Widget */}
      <div style={{
        background: 'rgba(0,0,0,0.05)',
        border: '1px solid var(--border-primary)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        boxShadow: '0 4px 15px var(--shadow-color)'
      }}>
        <div style={{
          width: '45px', height: '45px', borderRadius: '12px',
          background: 'var(--text-primary)', color: 'var(--bg-page)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 900
        }}>
          {profile?.users?.full_name ? profile.users.full_name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile?.users?.full_name || 'Memuat...'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isProfileComplete ? '#10b981' : '#ef4444'
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-primary)', opacity: 0.9, fontWeight: 700 }}>
              {isProfileComplete ? 'Terverifikasi' : 'Belum Verifikasi'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              background: activeTab === item.id ? 'var(--text-primary)' : 'transparent',
              border: 'none',
              textAlign: 'left',
              padding: '16px 20px',
              borderRadius: '16px',
              color: activeTab === item.id ? 'var(--bg-page)' : 'var(--text-primary)',
              fontWeight: 800,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === item.id ? '0 10px 20px var(--shadow-color)' : 'none'
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          background: 'rgba(0, 0, 0, 0.1)',
          border: '1.5px solid var(--text-primary)',
          color: 'var(--text-primary)',
          padding: '16px',
          borderRadius: '16px',
          fontWeight: 900,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.3s',
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
        onMouseOver={(e) => { 
          e.currentTarget.style.background = '#ef4444'; 
          e.currentTarget.style.borderColor = '#ef4444';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseOut={(e) => { 
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'; 
          e.currentTarget.style.borderColor = 'var(--text-primary)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
      >
        <span>🚪</span> Keluar Sesi
      </button>
    </aside>
  );
}

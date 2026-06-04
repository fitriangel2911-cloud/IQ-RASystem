'use client';
import React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import BrandLogo from '@/components/brand/BrandLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  profile: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, profile, isOpen, onClose }: SidebarProps) {
  const { theme } = useTheme();

  const menuItems = [
    {
      id: 'overview',
      label: 'Ringkasan Akun',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    },
    {
      id: 'accounts',
      label: 'Daftar Rekening',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="3" ry="3"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      )
    },
    {
      id: 'transactions',
      label: 'Riwayat Transaksi',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      )
    },
    {
      id: 'deposits',
      label: 'Pembayaran Simpanan',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      id: 'products',
      label: 'Produk & Layanan',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      )
    },
    {
      id: 'financing',
      label: 'Pengajuan Pembiayaan',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profil & Dokumen',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
  ];

  const isProfileComplete = profile?.nik && profile?.kk_number && profile?.phone_number;

  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

  return (
    <aside style={{
      width: isOpen ? '260px' : '0px',
      opacity: isOpen ? 1 : 0,
      background: theme === 'light' ? 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(243, 198, 83, 0.25) 100%)' : 'rgba(4, 49, 33, 0.65)',
      backdropFilter: 'blur(25px)',
      border: isOpen ? '1px solid var(--border-primary)' : 'none',
      borderRadius: isOpen ? '30px' : '0px',
      display: 'flex',
      flexDirection: 'column',
      padding: isOpen ? '40px 24px' : '0px',
      position: 'fixed',
      top: '20px',
      left: '20px',
      height: 'calc(100vh - 40px)',
      zIndex: 100,
      boxShadow: isOpen ? '0 20px 60px var(--shadow-color)' : 'none',
      flexShrink: 0,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden'
    }}>
      {/* Brand & Close Toggle Container */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', marginTop: '10px' }}>
        <div>
          <BrandLogo size={36} fontSize="18px" textColor="var(--text-primary)" />
          <div style={{ fontSize: '10px', color: 'var(--text-primary)', opacity: 0.8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '6px', marginLeft: '45px' }}>PORTAL ANGGOTA</div>
        </div>

        {/* Modern Close Sidebar Button */}
        <button 
          onClick={onClose}
          style={{
            background: theme === 'light' ? '#ffffff' : 'var(--bg-page)',
            border: theme === 'light' ? '2.5px solid #000000' : '2px solid #ffffff',
            borderRadius: '12px',
            color: theme === 'light' ? '#000000' : '#ffffff',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px var(--shadow-color)',
            flexShrink: 0,
            zIndex: 150
          }}
          onMouseOver={(e) => { 
            e.currentTarget.style.transform = 'scale(1.15) rotate(90deg)'; 
            e.currentTarget.style.borderColor = 'var(--gold-bright)';
            e.currentTarget.style.background = 'var(--gold-gradient)';
            e.currentTarget.style.color = '#02130e';
          }}
          onMouseOut={(e) => { 
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; 
            e.currentTarget.style.borderColor = theme === 'light' ? '#000000' : '#ffffff';
            e.currentTarget.style.background = theme === 'light' ? '#ffffff' : 'var(--bg-page)';
            e.currentTarget.style.color = theme === 'light' ? '#000000' : '#ffffff';
          }}
          title="Tutup Navigasi"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
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
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          ) : (
            profile?.users?.full_name ? profile.users.full_name.charAt(0).toUpperCase() : 'A'
          )}
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
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          const isHovered = hoveredTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={() => setHoveredTab(item.id)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                background: isActive 
                  ? 'var(--text-primary)' 
                  : (isHovered ? 'var(--border-primary)' : 'transparent'),
                border: 'none',
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: '16px',
                color: isActive ? 'var(--bg-page)' : 'var(--text-primary)',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transform: !isActive && isHovered ? 'translateX(6px)' : 'translateX(0)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 10px 20px var(--shadow-color)' : 'none'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', transform: isHovered ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s ease' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

    </aside>
  );
}

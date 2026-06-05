'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import DPSDashboard from '@/components/dashboard/DPSDashboard';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import NotificationBell from '@/components/dashboard/NotificationBell';
import { useTheme } from '@/context/ThemeContext';
import AIChatbot from '@/components/dashboard/AIChatbot';
import EditProfileModal from '@/components/dashboard/EditProfileModal';
import Modal from '@/components/dashboard/Modal';
import Toast from '@/components/dashboard/Toast';
export default function DPSPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState<{ message: string, type: 'success'|'error'|'warning'|'info', isVisible: boolean }>({ message: '', type: 'info', isVisible: false });

  const showToast = (message: string, type: 'success'|'error'|'warning'|'info' = 'success') => {
    setToastInfo({ message, type, isVisible: true });
  };

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
        
        // Authenticate only 'dps' (Dewan Pengawas Syariah) or 'super_admin'
        const validRoles = ['dps', 'super_admin'];
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

  const confirmLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid rgba(243, 198, 83, 0.2)', borderTopColor: '#f3c653', borderRadius: '50%' }}></div>
        <h3 style={{ color: 'var(--gold-bright)', fontWeight: 900, fontSize: '18px', letterSpacing: '1px' }}>MENGHUBUNGKAN KE LOG AUDIT SYARIAH...</h3>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
      <GlobalSiteBackground />

      {/* 🕋 DEWAN PENGAWAS SYARIAH PRESTIGE SIDEBAR */}
      <aside style={{
        width: isSidebarOpen ? '260px' : '0px',
        opacity: isSidebarOpen ? 1 : 0,
        background: 'var(--bg-sidebar)',
        borderRight: isSidebarOpen ? '3.5px solid var(--border-primary)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 100,
        boxShadow: isSidebarOpen ? '25px 0 70px var(--shadow-color)' : 'none',
        backdropFilter: 'blur(24px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        height: '100vh'
      }}>
        
        {/* SIDEBAR HEAD (Sticky) */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'var(--bg-sidebar)',
          zIndex: 10,
          padding: isSidebarOpen ? '16px 16px 12px 16px' : '0px',
          borderBottom: '1px solid var(--border-primary)',
          flexShrink: 0
        }}>
          {/* Close Button Toggle */}
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '10px',
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

          <div style={{ marginBottom: '12px', paddingLeft: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <BrandLogo size={28} fontSize="16px" textColor="var(--text-primary)" />
            </div>
            <span style={{ color: 'var(--text-primary)', fontSize: '9px', display: 'block', opacity: 0.8, marginTop: '4px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              DEWAN PENGAWAS SYARIAH
            </span>
          </div>

          {isSidebarOpen && (
            <div style={{ 
              padding: '10px 12px', 
              background: 'var(--border-primary)', 
              borderRadius: '12px',
              border: '1px solid var(--border-primary)',
            }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '13px' }}>{profile?.full_name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>Hak Akses: Auditor Syariah</div>
            </div>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, overflowY: 'auto', padding: isSidebarOpen ? '16px 12px 20px 16px' : '0px' }}>
          <DPSMenuButton active={activeMenu === 'overview'} onClick={() => setActiveMenu('overview')} icon="🕋" label="Dasbor Kepatuhan" />
          <DPSMenuButton active={activeMenu === 'audit'} onClick={() => setActiveMenu('audit')} icon="🛡️" label="Audit Pembiayaan" />
          <DPSMenuButton active={activeMenu === 'products'} onClick={() => setActiveMenu('products')} icon="📖" label="Manajemen Akad & Produk" />
          <DPSMenuButton active={activeMenu === 'purification'} onClick={() => setActiveMenu('purification')} icon="💸" label="Dana Non-Halal & ZISWAF" />
          <DPSMenuButton active={activeMenu === 'report'} onClick={() => setActiveMenu('report')} icon="🧾" label="Laporan Pengawasan" />
          <DPSMenuButton active={activeMenu === 'rag'} onClick={() => setActiveMenu('rag')} icon="🤖" label="Ingesti Data RAG" />
        </nav>
      </aside>

      {/* MAIN SCROLLING REGION */}
      <main style={{ 
        flexGrow: 1, 
        zIndex: 20, 
        overflowY: 'auto', 
        height: '100vh',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* MAIN CONTAINER HEAD (Sticky) */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '2px solid var(--border-primary)',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px var(--shadow-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {!isSidebarOpen && (
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
            )}
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '24px', margin: 0 }}>
                {activeMenu === 'overview' && <>🕋 Dasbor Ringkasan Kepatuhan <br/>(Shariah Health)</>}
                {activeMenu === 'audit' && '🛡️ Audit Pembiayaan (Sampling & Review)'}
                {activeMenu === 'products' && '📖 Manajemen Akad & Persetujuan Produk'}
                {activeMenu === 'purification' && <>💸 Pengawasan & Pembersihan <br/>Dana Non-Halal</>}
                {activeMenu === 'report' && '🧾 Generator Laporan Pengawasan Syariah'}
                {activeMenu === 'rag' && '🤖 Saluran Ingesti Pengetahuan AI RAG'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', opacity: 0.7, fontSize: '13px', fontWeight: 600, marginTop: '6px', margin: 0 }}>
                Menjaga kemurnian operasional koperasi bebas dari unsur Riba, Gharar, dan Maysir.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', padding: '10px 30px', borderRadius: '12px', fontSize: '13px', fontWeight: 900, boxShadow: '0 4px 15px var(--shadow-color)', minWidth: '220px', textAlign: 'center' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            
            <ThemeToggle />
            <NotificationBell />
            
            {/* Profil Bulat dengan Dropdown */}
            <div style={{ position: 'relative' }}>
              <div onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--text-primary)', color: 'var(--bg-page)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '16px', cursor: 'pointer',
                boxShadow: '0 2px 10px var(--shadow-color)',
                border: '2px solid var(--border-primary)'
              }} title={profile?.full_name}>
                {profile?.full_name?.charAt(0) || 'D'}
              </div>

              {isProfileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%', right: 0,
                  width: '240px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 10px 40px var(--shadow-color)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-primary)', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '14px' }}>{profile?.full_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{profile?.phone || '0812-XXXX-XXXX'}</div>
                  </div>
                  
                  <button 
                    onClick={() => { setIsEditModalOpen(true); setIsProfileMenuOpen(false); }}
                    style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: '8px',
                      background: 'transparent', color: 'var(--text-primary)', border: 'none',
                      cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontSize: '13px'
                    }} 
                    onMouseOver={e => e.currentTarget.style.background = 'var(--border-primary)'} 
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    ✏️ Edit Profil
                  </button>
                  
                  <button onClick={handleLogout} style={{
                    textAlign: 'left', padding: '10px 12px', borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none',
                    cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontSize: '13px'
                  }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>
                    🚪 Logout Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div style={{ padding: '24px 40px', flexGrow: 1 }}>
          <DPSDashboard activeMenu={activeMenu} profile={profile} />
        </div>
      </main>

      {/* Immersive Global AI Chatbot */}
      <AIChatbot role="dps" />
      
      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        profile={profile} 
        onUpdate={(newProfile: any) => {
          setProfile(newProfile);
          showToast('Profil berhasil diperbarui', 'success');
        }} 
      />

      <Modal 
        isOpen={isLogoutModalOpen}
        type="confirm"
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari sesi Dewan Pengawas Syariah?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      <Toast 
        message={toastInfo.message}
        type={toastInfo.type}
        isVisible={toastInfo.isVisible}
        onClose={() => setToastInfo(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}

function DPSMenuButton({ active, onClick, icon, label }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
        background: active 
          ? 'var(--text-primary)' 
          : (isHovered ? 'var(--border-primary)' : 'transparent'),
        color: active ? 'var(--bg-page)' : 'var(--text-primary)',
        border: active ? 'none' : '1px solid var(--border-primary)',
        borderRadius: '14px', fontSize: '13px', fontWeight: 900, textAlign: 'left',
        cursor: 'pointer', transition: 'all 0.3s',
        transform: !active && isHovered ? 'translateX(6px)' : 'scale(1)',
        boxShadow: active ? '0 4px 12px var(--shadow-color)' : 'none',
        width: '100%',
        whiteSpace: 'normal',
        lineHeight: '1.4'
      }}
    >
      <span style={{ 
        fontSize: '18px',
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.2s ease'
      }}>{icon}</span>
      {label}
    </button>
  );
}

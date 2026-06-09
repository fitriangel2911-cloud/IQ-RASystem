'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import BrandLogo from '@/components/brand/BrandLogo';
import { useTheme } from '@/context/ThemeContext';
import Toast, { ToastProps } from '@/components/dashboard/Toast';

// Intensely styled menu button for the dashboard sidebar, matching the Super Admin dashboard
function DashboardMenuButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
        border: 'none',
        textAlign: 'left',
        padding: '10px 14px',
        borderRadius: '14px',
        color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
        fontWeight: 800,
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s',
        width: '100%',
        boxShadow: active ? '0 4px 15px var(--shadow-color)' : 'none'
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      {label}
    </button>
  );
}

export default function ManagerPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [toast, setToast] = useState<{message: string, type: ToastProps['type'], isVisible: boolean}>({ message: '', type: 'info', isVisible: false });
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);

  const showToast = (message: string, type: ToastProps['type']) => {
    setToast({ message, type, isVisible: true });
  };

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

  const handleLogout = () => {
    setConfirmAction({
      message: 'Apakah Anda yakin ingin keluar dari sesi operasional sistem?',
      onConfirm: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
      }
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '16px', position: 'relative', zIndex: 10 }}>
        <div style={{ border: '3px solid transparent', borderTopColor: 'var(--gold-intense)', borderRightColor: 'var(--gold-intense)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        <h3 style={{ fontWeight: 800, fontSize: '18px', color: 'var(--gold-intense)' }}>Memuat Dasbor IQ-RA...</h3>
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'transparent', // Animated Pattern Layer Support
      color: 'var(--text-primary)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 🖼️ Apply White Animated Sharia Geometric Backdrop */}
      <GlobalSiteBackground />
      
      {/* 1. SIDEBAR: Solid, Bold, Premium Dark Emerald (matching Super Admin Sidebar) */}
      {isSidebarOpen && (
        <aside style={{
          width: '280px',
          background: 'var(--bg-sidebar)', // Deep saturated Emerald
          borderRight: '2px solid #cca334', // Rich gold divider
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 30,
          boxShadow: '8px 0 25px var(--shadow-color)',
          flexShrink: 0,
          transition: 'all 0.3s ease-in-out'
        }}>
          {/* Sidebar Brand */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ marginTop: '0px' }}>
                <BrandLogo size={42} fontSize="20px" textColor="var(--sidebar-heading)" />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px', marginLeft: '52px' }}>General Manager</div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>✖</button>
          </div>

          {/* Sidebar Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
            
            <div style={{ fontSize: '11px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px', marginTop: '10px' }}>PENGAWASAN & OTO</div>
            
            <DashboardMenuButton active={activeMenu === 'overview'} onClick={() => setActiveMenu('overview')} icon="📊" label="Analitik Eksekutif" />
            <DashboardMenuButton active={activeMenu === 'approvals'} onClick={() => setActiveMenu('approvals')} icon="⚖️" label="Persetujuan Akad" />
            <DashboardMenuButton active={activeMenu === 'withdrawals'} onClick={() => setActiveMenu('withdrawals')} icon="💸" label="Penarikan Dana" />
            <DashboardMenuButton active={activeMenu === 'contracts'} onClick={() => setActiveMenu('contracts')} icon="📋" label="Riwayat Otorisasi" />
            <DashboardMenuButton active={activeMenu === 'rag'} onClick={() => setActiveMenu('rag')} icon="🤖" label="RAG Pipeline" />
          </nav>
        </aside>
      )}

      {/* 2. MAIN CONTENT AREA: Crystal Clear High Contrast */}
      <main style={{
        flexGrow: 1,
        padding: '24px 40px',
        overflowY: 'auto',
        height: '100vh',
        position: 'relative',
        zIndex: 10,
        transition: 'all 0.3s ease-in-out'
      }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'sticky', top: '-24px', paddingTop: '24px', paddingBottom: '16px', background: 'var(--bg-card)', zIndex: 20, borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--gold-intense)', fontSize: '28px', cursor: 'pointer', marginTop: '-2px' }}>
                ☰
              </button>
            )}
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '6px', textShadow: '0 2px 10px var(--shadow-color)' }}>
                {activeMenu === 'overview' ? 'Pusat Kontrol Eksekutif' : 
                 activeMenu === 'approvals' ? 'Otorisasi Akad Syariah' :
                 activeMenu === 'withdrawals' ? 'Persetujuan Penarikan Dana' :
                 activeMenu === 'contracts' ? 'Arsip Otorisasi Pembiayaan' :
                 'Saluran Ingesti Data RAG'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
                {activeMenu === 'overview' 
                  ? 'Keputusan final eksekutif didukung dengan Rekomendasi Pintar AI RAG.' 
                  : activeMenu === 'approvals'
                  ? 'Otorisasi akhir dan persetujuan akad pembiayaan syariah.'
                  : activeMenu === 'withdrawals'
                  ? 'Persetujuan penarikan dana tabungan anggota dengan opsi transfer bank langsung.'
                  : activeMenu === 'contracts'
                  ? 'Riwayat otorisasi dan arsip kontrak pembiayaan.'
                  : 'Ingest data eksternal ke dalam basis data pengetahuan AI RAG.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'var(--bg-card)', border: '2px solid #34d399', borderRadius: '30px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 800, color: 'var(--text-success)', boxShadow: '0 4px 15px rgba(52, 211, 153, 0.2)' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--text-success)', borderRadius: '50%', boxShadow: '0 0 10px #34d399' }} />
              DATABASE SEHAT (LIVE)
            </div>
            
            <button 
              onClick={toggleTheme} 
              style={{ background: 'transparent', border: 'none', color: 'var(--gold-intense)', fontSize: '24px', cursor: 'pointer' }}
              title="Ganti Tema"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                style={{
                  background: 'var(--bg-dark-box)', border: '1px solid rgba(243, 198, 83, 0.2)',
                  borderRadius: '30px', padding: '8px 16px 8px 8px', display: 'flex', alignItems: 'center', gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-intense)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#02130e' }}>
                  {profile?.full_name ? profile.full_name.charAt(0) : 'M'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{profile?.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{profile?.role}</div>
                </div>
              </div>

              {isProfileMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: 'var(--bg-card)', border: '1px solid rgba(243, 198, 83, 0.3)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 15px 35px var(--shadow-color)', zIndex: 100, minWidth: '180px' }}>
                  <button onClick={() => { setIsProfileMenuOpen(false); setEditFullName(profile?.full_name || ''); setIsEditProfileOpen(true); }} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '14px 20px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>✏️ Edit Profil</button>
                  <button onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '14px 20px', color: 'var(--text-danger)', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>🔌 Keluar</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <ManagerDashboard activeMenu={activeMenu} profile={profile} />
        </div>
      </main>

      {/* TOAST NOTIFICATION */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      {/* CONFIRMATION MODAL */}
      {confirmAction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '3px solid #cca334', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>{confirmAction.message}</h3>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmAction(null)} style={{ background: 'transparent', border: '2px solid var(--border-primary)', color: 'var(--text-primary)', padding: '10px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Batal</button>
              <button onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} style={{ background: 'var(--gold-intense)', border: 'none', color: '#02130e', padding: '12px 24px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', padding: '36px', borderRadius: '24px', border: '3px solid #cca334', width: '100%', maxWidth: '450px' }}>
            <h2 style={{ color: 'var(--gold-intense)', fontSize: '22px', fontWeight: 900, marginBottom: '24px' }}>✏️ Edit Profil Staf</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-dark-box)', border: '2px dashed var(--gold-intense)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', cursor: 'not-allowed' }}>
                Upload Foto<br/>(Coming Soon)
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>Nama Lengkap</label>
              <input value={editFullName} onChange={e => setEditFullName(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-dark-box)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', borderRadius: '10px', marginTop: '6px' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>Nomor Telepon</label>
              <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="0812xxxx" style={{ width: '100%', padding: '12px', background: 'var(--bg-dark-box)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', borderRadius: '10px', marginTop: '6px' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setIsEditProfileOpen(false)} style={{ flex: 1, background: 'transparent', border: '2px solid var(--border-primary)', color: 'var(--text-primary)', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Batal</button>
              <button onClick={async () => {
                setIsSavingProfile(true);
                const supabase = createClient();
                await supabase.from('users').update({ full_name: editFullName }).eq('id', user.id);
                setProfile({...profile, full_name: editFullName});
                setIsSavingProfile(false);
                setIsEditProfileOpen(false);
                showToast('Profil berhasil diperbarui', 'success');
              }} style={{ flex: 1, background: 'var(--gold-intense)', border: 'none', color: '#02130e', padding: '12px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>{isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import TellerTerminal from '@/components/dashboard/TellerTerminal';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import NotificationBell from '@/components/dashboard/NotificationBell';
import { useTheme } from '@/context/ThemeContext';
import AIChatbot from '@/components/dashboard/AIChatbot';

// SVG Icons
const IconDashboard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconDeposit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/></svg>;
const IconWithdraw = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v14"/><path d="m5 10 7-7 7 7"/><path d="M19 21H5"/></svg>;
const IconReceipt = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>;
const IconShift = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;

export default function TellerPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { router.push('/login'); return; }
      setUser(currentUser);
      const { data: dbProfile } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
      if (dbProfile) {
        setProfile(dbProfile);
        if (dbProfile.role !== 'teller' && dbProfile.role !== 'super_admin') { router.push('/dashboard'); return; }
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
        <h3 style={{ color: '#f3c653', fontWeight: 800, fontSize: '18px' }}>Membuka Layanan Teller...</h3>
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
      
      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-page)', padding: '32px', borderRadius: '24px', width: '400px', border: '1px solid var(--border-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative' }}>
            <button onClick={() => setShowEditProfile(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-primary)', fontSize: '20px' }}>Edit Profil Petugas</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gold-intense)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 900, color: '#02130e', border: '4px solid var(--bg-page)', position: 'relative', cursor: 'pointer' }}
                >
                  {profile?.full_name?.charAt(0) || 'T'}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#000', color: '#f3c653', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✏️</div>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Nama Lengkap</label>
                <input type="text" defaultValue={profile?.full_name} style={{ background: 'var(--bg-header)', border: '1px solid var(--border-primary)', padding: '12px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Nomor Telepon</label>
                <input type="text" defaultValue={profile?.phone || ''} placeholder="Contoh: 08123456789" style={{ background: 'var(--bg-header)', border: '1px solid var(--border-primary)', padding: '12px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</label>
                <input type="email" defaultValue={user?.email} disabled style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-primary)', padding: '12px', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'not-allowed' }} />
              </div>

              <button onClick={() => setShowEditProfile(false)} style={{ background: 'var(--gold-intense)', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: '12px' }}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR EMERALD */}
      <aside style={{
        width: isSidebarOpen ? '320px' : '0px',
        opacity: isSidebarOpen ? 1 : 0,
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(20px)',
        borderRight: isSidebarOpen ? '2px solid var(--gold-bright)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: isSidebarOpen ? '20px 20px' : '0px',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100,
        boxShadow: isSidebarOpen ? '8px 0 25px var(--shadow-color)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}>
        {/* Close Button Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'absolute', right: '15px', top: '15px',
            background: theme === 'light' ? '#ffffff' : 'var(--bg-page)',
            border: theme === 'light' ? '2.5px solid #000000' : '2px solid #ffffff',
            borderRadius: '8px', color: theme === 'light' ? '#000000' : '#ffffff',
            cursor: 'pointer', padding: '6px 12px', fontWeight: 900, fontSize: '14px', transition: 'all 0.3s',
            zIndex: 110
          }}
        >✕</button>

        {/* SIDEBAR HEADER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px', paddingRight: '40px' }}>
          <BrandLogo size={56} fontSize="28px" textColor="var(--text-primary)" />
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginLeft: '65px', opacity: 0.9 }}>
            Layanan Kasir
          </div>
        </div>
        
        <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'var(--border-primary)', borderRadius: '12px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: 'var(--bg-page)' }}>
            {profile?.full_name?.charAt(0) || 'T'}
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '13px' }}>{profile?.full_name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>Petugas Aktif</div>
          </div>
        </div>

        {/* SIDEBAR NAV */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {[
            { key: '1', label: 'Status & Dasbor', icon: <IconDashboard /> },
            { key: '2', label: 'Cari Anggota', icon: <IconUsers /> },
            { key: '3', label: 'Setoran Tunai', icon: <IconDeposit /> },
            { key: '4', label: 'Penarikan Tunai', icon: <IconWithdraw /> },
            { key: '5', label: 'Bayar Angsuran', icon: <IconReceipt /> },
            { key: '6', label: 'Buka/Tutup Shift', icon: <IconShift /> },
          ].map(item => (
            <TellerMenuButton 
              key={item.key}
              active={activeTab === item.key} 
              onClick={() => {
                setActiveTab(item.key);
                const tabId = `teller-tab-${item.key}`;
                document.getElementById(tabId)?.click();
              }} 
              icon={item.icon} 
              label={item.label} 
            />
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ 
        flexGrow: 1, 
        marginLeft: isSidebarOpen ? '320px' : '0px',
        zIndex: 20, 
        overflowY: 'auto',
        height: '100vh',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* MAIN HEADER */}
        <header style={{ 
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'var(--bg-header)',
          backdropFilter: 'blur(16px)',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-primary)',
          boxShadow: '0 4px 20px var(--shadow-color)',
          minHeight: '80px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  background: theme === 'light' ? '#ffffff' : 'var(--bg-sidebar)',
                  border: theme === 'light' ? '2px solid #000000' : '2px solid #ffffff',
                  borderRadius: '10px',
                  color: theme === 'light' ? '#000000' : '#ffffff',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 900,
                  boxShadow: '0 4px 15px var(--shadow-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s'
                }}
              >
                <span style={{ fontSize: '13px' }}>MENU</span>
              </button>
            )}
            <div style={{ borderLeft: '4px solid var(--gold-intense)', paddingLeft: '12px' }}>
              <div style={{ color: 'var(--gold-intense)', fontSize: '11px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Terminal Operasional Kas</div>
              <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px', fontWeight: 900 }}>Operasional Teller</h2>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right', marginRight: '10px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
              <NotificationBell />
              <ThemeToggle />
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-intense)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#02130e', border: '2px solid var(--border-primary)', cursor: 'pointer' }}>
                {profile?.full_name?.charAt(0) || 'T'}
              </div>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '45px',
                  right: '0',
                  background: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  padding: '8px',
                  width: '180px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <button onClick={() => { setShowEditProfile(true); setShowProfileMenu(false); }} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ffffff', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Edit Profil</button>
                  <button onClick={handleLogout} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Keluar (Logout)</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={{ padding: '24px 32px', flexGrow: 1 }} onClick={() => setShowProfileMenu(false)}>
          <TellerTerminal userId={user?.id} />
        </div>

      </main>

      {/* Immersive Global AI Chatbot */}
      <AIChatbot role="teller" />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function TellerMenuButton({ active, onClick, icon, label }: any) {
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        color: active ? 'var(--bg-page)' : 'var(--text-primary)'
      }}>{icon}</span>
      {label}
    </button>
  );
}


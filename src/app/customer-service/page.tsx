'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import CSDashboard from '../../components/dashboard/CSDashboard';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import NotificationBell from '@/components/dashboard/NotificationBell';
import { useTheme } from '@/context/ThemeContext';

export default function CustomerServicePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('onboarding');
  
  // States for Sidebar and modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ action: string, title: string, message: string } | null>(null);

  // States for Edit Profile
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setFormattedDate(new Date().toLocaleDateString('id-ID', options));
  }, []);

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
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
        <h3 style={{ color: 'var(--gold-bright)', fontWeight: 800 }}>Membuka Layanan CS...</h3>
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
        width: isSidebarOpen ? '280px' : '0px',
        opacity: isSidebarOpen ? 1 : 0,
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(20px)',
        borderRight: isSidebarOpen ? '2px solid var(--border-primary)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        padding: isSidebarOpen ? '20px 18px 10px 18px' : '0px',
        zIndex: 100,
        boxShadow: isSidebarOpen ? '20px 0 50px var(--shadow-color)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Close Button Toggle */}
        {isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'absolute',
              right: '15px',
              top: '15px',
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

        <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px', flexShrink: 0 }}>
          <BrandLogo size={60} fontSize="28px" textColor="var(--text-primary)" />
          <span style={{ color: 'var(--text-primary)', fontSize: '11px', display: 'block', opacity: 0.6, marginTop: '6px', fontWeight: 800, letterSpacing: '1.5px' }}>CUSTOMER SERVICE</span>
        </div>

        <div style={{ 
          padding: '14px 18px', 
          background: 'var(--border-primary)', 
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          flexShrink: 0,
          marginBottom: '16px'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>CS On-Duty</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name}</div>
        </div>

        <nav style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px', 
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '4px'
        }}>
          <CSMenuButton 
            active={activeMenu === 'onboarding'} 
            onClick={() => setActiveMenu('onboarding')} 
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            } 
            label="Registrasi Anggota" 
          />
          <CSMenuButton 
            active={activeMenu === 'kyc'} 
            onClick={() => setActiveMenu('kyc')} 
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <circle cx="10" cy="13" r="2"></circle>
                <path d="M14 17a4 4 0 0 0-8 0"></path>
              </svg>
            } 
            label="Verifikasi KYC" 
          />
          <CSMenuButton 
            active={activeMenu === 'members'} 
            onClick={() => setActiveMenu('members')} 
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            } 
            label="Database Anggota" 
          />
          <CSMenuButton 
            active={activeMenu === 'verifications'} 
            onClick={() => setActiveMenu('verifications')} 
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            } 
            label="Verifikasi Pembayaran" 
          />
          <CSMenuButton 
            active={activeMenu === 'special-savings'} 
            onClick={() => setActiveMenu('special-savings')} 
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            } 
            label="Simpanan Bertujuan" 
          />
          <CSMenuButton 
            active={activeMenu === 'financing'} 
            onClick={() => setActiveMenu('financing')} 
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            } 
            label="Pengajuan Pembiayaan" 
          />
          <CSMenuButton 
            active={activeMenu === 'ai-help'} 
            onClick={() => setActiveMenu('ai-help')} 
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            } 
            label="AI Sharia Assistant" 
          />
        </nav>

      </aside>

      {/* ⚪ MAIN CONTENT */}
      <main style={{ 
        flexGrow: 1, 
        padding: '24px 40px', 
        zIndex: 20, 
        overflowY: 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Top Sticky Header */}
        <header style={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(15px)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          padding: '12px 24px',
          boxShadow: '0 8px 32px var(--shadow-color)',
          flexShrink: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  background: theme === 'light' ? '#ffffff' : 'var(--bg-sidebar)',
                  border: theme === 'light' ? '2.5px solid #000000' : '2px solid #ffffff',
                  borderRadius: '10px',
                  color: theme === 'light' ? '#000000' : '#ffffff',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '13px',
                  transition: 'all 0.3s'
                }}
              >
                ☰ MENU
              </button>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kalender Kerja</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 800 }}>{formattedDate}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            <NotificationBell />
            <ThemeToggle />
            
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--gold-intense)',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '15px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  border: '2px solid var(--border-primary)',
                  overflow: 'hidden'
                }}>
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {(!profile?.avatar_url) && (
                    <span>{profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'C'}</span>
                  )}
                </div>
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '48px',
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(25px)',
                    border: '1.5px solid var(--border-primary)',
                    borderRadius: '16px',
                    padding: '8px',
                    width: '160px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 100000
                  }}>
                    <button 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setEditName(profile?.full_name || '');
                        setEditEmail(profile?.email || '');
                        setEditPhone(profile?.phone || '');
                        setEditAvatarUrl(profile?.avatar_url || '');
                        setIsEditProfileModalOpen(true);
                      }}
                      style={{
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--border-primary)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      ✏️ Edit Profil
                    </button>
                    <button 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setConfirmModal({
                          action: 'logout',
                          title: 'Keluar Sesi?',
                          message: 'Apakah Anda yakin ingin keluar dari layanan Customer Service?'
                        });
                      }}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        color: '#ef4444',
                        textAlign: 'left',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                      🚪 Keluar Sesi
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <CSDashboard activeMenu={activeMenu} profile={profile} />
      </main>

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100001
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--border-primary)',
            borderRadius: '24px',
            padding: '32px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '18px', fontWeight: 900 }}>EDIT PROFIL STAFF CS</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Nama Lengkap</label>
              <input 
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-page)',
                  border: '1.5px solid var(--border-primary)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Email</label>
              <input 
                type="email" 
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-page)',
                  border: '1.5px solid var(--border-primary)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Nomor Telepon</label>
              <input 
                type="text" 
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="Contoh: 081234567890..."
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-page)',
                  border: '1.5px solid var(--border-primary)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>URL Foto Profil</label>
              <input 
                type="text" 
                value={editAvatarUrl}
                onChange={e => setEditAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg..."
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-page)',
                  border: '1.5px solid var(--border-primary)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Detail Akun (Read-only)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--bg-page)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 800 }}>PERAN</div>
                  <div style={{ fontSize: '12px', color: 'var(--gold-intense)', fontWeight: 800, marginTop: '2px', textTransform: 'uppercase' }}>{profile?.role?.replace('_', ' ')}</div>
                </div>
                <div style={{ background: 'var(--bg-page)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 800 }}>ID STAFF</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 800, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.id}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                onClick={() => setIsEditProfileModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1.5px solid var(--border-primary)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  try {
                    const supabase = createClient();
                    const { error } = await supabase
                      .from('users')
                      .update({ 
                        full_name: editName, 
                        email: editEmail,
                        phone: editPhone,
                        avatar_url: editAvatarUrl
                      })
                      .eq('id', user.id);
                    if (error) throw error;
                    
                    setProfile((prev: any) => ({ 
                      ...prev, 
                      full_name: editName, 
                      email: editEmail,
                      phone: editPhone,
                      avatar_url: editAvatarUrl
                    }));
                    setIsEditProfileModalOpen(false);
                  } catch (err: any) {
                    alert('Gagal memperbarui profil: ' + err.message);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: 'var(--gold-intense)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTERED CONFIRMATION POPUP MODAL */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--border-primary)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '480px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {confirmModal.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '16px 28px',
                  background: 'transparent',
                  border: '2px solid var(--border-primary)',
                  borderRadius: '14px',
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  if (confirmModal.action === 'logout') {
                    handleLogout();
                  }
                  setConfirmModal(null);
                }}
                style={{
                  padding: '16px 28px',
                  background: 'var(--gold-intense)',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#02130e',
                  fontWeight: 900,
                  fontSize: '15px',
                  cursor: 'pointer',
                  flex: 1,
                  boxShadow: '0 8px 24px rgba(218,165,32,0.3)'
                }}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CSMenuButton({ active, onClick, icon, label }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: active 
          ? 'var(--text-primary)' 
          : (isHovered ? 'var(--border-primary)' : 'transparent'),
        color: active ? 'var(--bg-page)' : 'var(--text-primary)',
        border: 'none',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: 900,
        textAlign: 'left',
        cursor: 'pointer',
        transform: !active && isHovered ? 'translateX(4px)' : 'translateX(0)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 6px 12px var(--shadow-color)' : 'none',
        width: '100%'
      }}
    >
      <span style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        opacity: active ? 1 : 0.8,
        color: active ? 'var(--bg-page)' : 'var(--text-primary)'
      }}>{icon}</span>
      <span style={{ opacity: active ? 1 : 0.9 }}>{label}</span>
    </button>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import TellerTerminal from '@/components/dashboard/TellerTerminal';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export default function TellerPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      
      {/* SIDEBAR EMERALD */}
      <aside style={{
        width: isSidebarOpen ? '320px' : '0px',
        opacity: isSidebarOpen ? 1 : 0,
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(20px)',
        borderRight: isSidebarOpen ? '2px solid var(--gold-bright)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: isSidebarOpen ? '36px 24px' : '0px',
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
            cursor: 'pointer', padding: '6px 12px', fontWeight: 900, fontSize: '14px', transition: 'all 0.3s'
          }}
        >✕</button>

        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <BrandLogo size={46} fontSize="24px" textColor="var(--text-primary)" />
            <div style={{ marginRight: '45px' }}><ThemeToggle /></div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginLeft: '56px', opacity: 0.9 }}>
            Layanan Kasir
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          {[
            { key: '1', label: 'Status & Dasbor' },
            { key: '2', label: 'Cari Anggota' },
            { key: '3', label: 'Setoran Tunai' },
            { key: '4', label: 'Penarikan Tunai' },
            { key: '5', label: 'Bayar Angsuran' },
            { key: '6', label: 'Buka/Tutup Shift' },
          ].map(item => (
            <a key={item.key}
              href="#"
              onClick={e => {
                e.preventDefault();
                const tabId = `teller-tab-${item.key}`;
                document.getElementById(tabId)?.click();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 16px', borderRadius: '12px', textDecoration: 'none',
                color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(243,198,83,0.1)'; (e.currentTarget as HTMLElement).style.color = '#f3c653'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            >
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 900, background: 'rgba(243,198,83,0.1)', color: '#f3c653', padding: '2px 8px', borderRadius: '5px' }}>[{item.key}]</span>
            </a>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '18px', background: 'var(--border-primary)', borderRadius: '18px', border: '1px solid var(--gold-bright)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--gold-intense)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#02130e' }}>
              {profile?.full_name?.charAt(0) || 'T'}
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Petugas Aktif</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>{profile?.full_name}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--text-primary)', border: '2px solid #fca5a5', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}>
            Keluar Sistem
          </button>
        </div>
      </aside>


      {/* MAIN CONTENT AREA */}
      <main style={{ 
        flexGrow: 1, 
        padding: '40px 60px', 
        marginLeft: isSidebarOpen ? '320px' : '0px',
        zIndex: 20, 
        overflowY: 'auto',
        height: '100vh',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header Content */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '44px',
          background: 'var(--bg-header)',
          backdropFilter: 'blur(16px)',
          padding: '24px 36px',
          borderRadius: '24px',
          border: '1px solid var(--border-primary)',
          borderLeft: '6px solid var(--gold-intense)',
          boxShadow: '0 20px 40px var(--shadow-color)'
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
                <span style={{ fontSize: '14px' }}>MENU</span>
              </button>
            )}
            <div>
              <div style={{ background: 'var(--border-primary)', color: 'var(--gold-intense)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', display: 'inline-block', marginBottom: '8px', textTransform: 'uppercase' }}>Terminal Operasional Kas</div>
              <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '28px', fontWeight: 900 }}>Operasional Teller — Navigasi [1]–[6]</h2>
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', fontWeight: 600, textAlign: 'right' }}>
            <div style={{ color: '#34d399', fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>KONEKSI LIVE</div>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div>
          <TellerTerminal userId={user?.id} />
        </div>

      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

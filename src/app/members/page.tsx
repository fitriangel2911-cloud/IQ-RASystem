'use client';

import React, { useState, useEffect } from 'react';
import { useMemberDashboardData } from '@/hooks/useMemberDashboardData';
import Sidebar from '@/components/dashboard/Sidebar';
import OverviewPanel from '@/components/dashboard/OverviewPanel';
import AccountsTable from '@/components/dashboard/AccountsTable';
import TransactionsTable from '@/components/dashboard/TransactionsTable';
import FinancingPanel from '@/components/dashboard/FinancingPanel';
import ProfileForm from '@/components/dashboard/ProfileForm';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';
import { useTheme } from '@/context/ThemeContext';

type TabType = 'overview' | 'accounts' | 'transactions' | 'financing' | 'profile';

export default function MemberPage() {
  const { profile, accounts, transactions, contracts, loading, error, refetch } = useMemberDashboardData();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme } = useTheme();

  // Deteksi layar HP dan tutup sidebar secara otomatis
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize(); // Eksekusi saat pertama kali dimuat
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        gap: '16px',
        position: 'relative',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
          background: 'var(--bg-page)', opacity: 0.95
        }} />
        
        <div style={{
          position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
        }}>
          {/* Custom Shimmering Spinner */}
          <div style={{
            border: '3px solid transparent',
            borderTopColor: 'var(--gold-bright)',
            borderRightColor: 'var(--gold-bright)',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite'
          }} />
          <h3 style={{ fontWeight: 800, fontSize: '18px', color: 'var(--gold-bright)', letterSpacing: '0.5px' }}>
            Sinkronisasi Basis Data Anggota...
          </h3>
        </div>
        
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444', marginBottom: '12px' }}>Terjadi Kesalahan Sinkronisasi</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.6, marginBottom: '32px' }}>{error}</p>
        <button 
          onClick={() => refetch()}
          style={{
            background: 'var(--gold-gradient)', color: '#02130e', border: 'none',
            padding: '14px 32px', borderRadius: '12px', fontWeight: 900,
            cursor: 'pointer', boxShadow: '0 4px 15px var(--shadow-color)'
          }}
        >
          🔄 Coba Ulangi Penarikan Data
        </button>
      </div>
    );
  }

  return (
    <div className={isSidebarOpen ? 'sidebar-open' : ''} style={{
      minHeight: '100vh',
      background: 'transparent',
      color: 'var(--text-primary)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Immersive Dynamic Animated Homepage Background */}
      <GlobalSiteBackground />

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        profile={profile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <main className={`main-content-layout flex-grow h-[calc(100vh-20px)] md:h-[calc(100vh-40px)] m-2 md:m-5 p-5 md:p-12 rounded-[20px] md:rounded-[30px] overflow-y-auto relative z-10 shadow-2xl transition-all duration-500 ${isSidebarOpen ? 'ml-2 md:ml-[340px]' : 'ml-2 md:ml-[20px]'}`} style={{
        background: theme === 'light' ? 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(243, 198, 83, 0.25) 100%)' : 'rgba(4, 49, 33, 0.65)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-primary)',
      }}>
        
        {/* Responsive Dashboard Topbar Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 md:mb-11">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                background: theme === 'light' ? '#ffffff' : 'var(--bg-card)',
                border: theme === 'light' ? '2.5px solid #000000' : '2px solid #ffffff',
                borderRadius: '14px',
                color: theme === 'light' ? '#000000' : '#ffffff',
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: 900,
                boxShadow: '0 6px 20px var(--shadow-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 50
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--gold-bright)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = theme === 'light' ? '#000000' : '#ffffff';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {isSidebarOpen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                )}
              </span>
              <span style={{ fontSize: '13px', letterSpacing: '1px', fontWeight: 800 }}>MENU PORTAL</span>
            </button>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: '0 0 6px 0' }}>
                {activeTab === 'overview' && 'Ikhtisar Ringkasan'}
                {activeTab === 'accounts' && 'Portofolio Rekening'}
                {activeTab === 'transactions' && 'Log Aktivitas Finansial'}
                {activeTab === 'financing' && 'Layanan Pembiayaan'}
                {activeTab === 'profile' && 'Verifikasi Kredensial Dokumen'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600, margin: 0 }}>
                {activeTab === 'overview' && 'Status ringkasan menyeluruh rekening & transaksi syariah Anda.'}
                {activeTab === 'accounts' && 'Rincian dan rupa saldo dari seluruh wadiah & mudharabah Anda.'}
                {activeTab === 'transactions' && 'Catatan terperinci mutasi debit & kredit riil tanpa jeda.'}
                {activeTab === 'financing' && 'Pengajuan kemitraan produktif & pemantauan akad aktif Anda.'}
                {activeTab === 'profile' && 'Lengkapi dokumen KYC fisik untuk kelayakan penjaminan syariah.'}
              </p>
            </div>
          </div>

          {/* Dynamic Theme Switcher & Auto-Refresh Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ThemeToggle />
            
            <div style={{
              background: 'var(--bg-card)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid var(--border-primary)',
              borderRadius: '30px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              boxShadow: '0 4px 12px var(--shadow-color)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#10b981', animation: 'pulse 2s infinite', boxShadow: '0 0 8px #10b981'
              }} />
              <span>SINKRONISASI AKTIF (60d)</span>
            </div>
          </div>
        </header>

        {/* TAB CONTENT SWITCHER */}
        <div style={{ animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          {activeTab === 'overview' && (
            <OverviewPanel 
              profile={profile}
              accounts={accounts}
              transactions={transactions}
              contracts={contracts}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsTable accounts={accounts} />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTable transactions={transactions} />
          )}

          {activeTab === 'financing' && (
            <FinancingPanel 
              contracts={contracts}
              profile={profile}
              onUpdateSuccess={refetch}
              navigateToProfile={() => setActiveTab('profile')}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileForm 
              profile={profile}
              onUpdateSuccess={refetch}
            />
          )}
        </div>

      </main>

      {/* Embedded Global Keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

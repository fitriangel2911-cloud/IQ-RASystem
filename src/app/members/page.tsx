'use client';

import React, { useState } from 'react';
import { useMemberDashboardData } from '@/hooks/useMemberDashboardData';
import Sidebar from '@/components/dashboard/Sidebar';
import OverviewPanel from '@/components/dashboard/OverviewPanel';
import AccountsTable from '@/components/dashboard/AccountsTable';
import TransactionsTable from '@/components/dashboard/TransactionsTable';
import FinancingPanel from '@/components/dashboard/FinancingPanel';
import ProfileForm from '@/components/dashboard/ProfileForm';

type TabType = 'overview' | 'accounts' | 'transactions' | 'financing' | 'profile';

export default function MemberPage() {
  const { profile, accounts, transactions, contracts, loading, error, refetch } = useMemberDashboardData();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#02130e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        gap: '16px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
          background: 'linear-gradient(135deg, #02130e 0%, #042a1d 100%)', opacity: 0.9
        }} />
        
        <div style={{
          position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
        }}>
          {/* Custom Shimmering Spinner */}
          <div style={{
            border: '3px solid transparent',
            borderTopColor: '#f3c653',
            borderRightColor: '#f3c653',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite'
          }} />
          <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#f3c653', letterSpacing: '0.5px' }}>
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
        background: '#02130e',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444', marginBottom: '12px' }}>Terjadi Kesalahan Sinkronisasi</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '500px', lineHeight: 1.6, marginBottom: '32px' }}>{error}</p>
        <button 
          onClick={() => refetch()}
          style={{
            background: '#f3c653', color: '#02130e', border: 'none',
            padding: '14px 32px', borderRadius: '12px', fontWeight: 900,
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(243, 198, 83, 0.3)'
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

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        profile={profile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <main className="main-content-layout" style={{
        flexGrow: 1,
        height: '100vh',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 10,
        padding: '48px 56px'
      }}>
        
        {/* Responsive Dashboard Topbar Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '44px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                background: 'var(--bg-sidebar)',
                border: '2px solid var(--text-primary)',
                borderRadius: '14px',
                color: 'var(--text-primary)',
                padding: '12px 20px',
                cursor: 'pointer',
                fontWeight: 900,
                boxShadow: '0 4px 15px var(--shadow-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                zIndex: 50
              }}
            >
              {isSidebarOpen ? '✕' : '☰'} <span style={{ fontSize: '13px', letterSpacing: '1px' }}>MENU PORTAL</span>
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

          {/* Auto-Refresh Badge Indicator */}
          <div style={{
            background: '#022b1c',
            border: '1.5px solid #34d399',
            borderRadius: '30px',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 800,
            color: '#34d399',
            boxShadow: '0 4px 12px rgba(52, 211, 153, 0.15)'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#34d399', animation: 'pulse 2s infinite', boxShadow: '0 0 8px #34d399'
            }} />
            <span>SINKRONISASI AKTIF (60d)</span>
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

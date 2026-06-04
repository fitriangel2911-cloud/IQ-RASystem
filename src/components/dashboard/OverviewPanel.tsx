'use client';
import React from 'react';

interface OverviewPanelProps {
  profile: any;
  accounts: any[];
  transactions: any[];
  contracts: any[];
  setActiveTab: (tab: any) => void;
}

export default function OverviewPanel({ profile, accounts, transactions, contracts, setActiveTab }: OverviewPanelProps) {
  const isProfileComplete = !!(profile?.nik && profile?.kk_number && profile?.mother_name);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(num);
  };

  // Slice recent transactions for short preview
  const previewTx = transactions.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      
      {/* Greeting Banner */}
      <div style={{
        background: 'var(--bg-card)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '3px solid var(--border-primary)',
        borderRadius: '28px',
        padding: '40px',
        boxShadow: '0 20px 50px var(--shadow-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Assalamualaikum, <span style={{ color: 'var(--text-primary)', opacity: 0.8 }}>{profile?.users?.full_name || 'Saudara/i'}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
            Selamat datang kembali di portal layanan syariah mandiri Anda. Anda dapat mengelola tabungan, melihat imbal hasil mudharabah, dan mengajukan pembiayaan tanpa riba dari sini.
          </p>
        </div>
        {/* Giant faint background geometric vector element instead of Mosque emoji */}
        <div style={{
          position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)',
          opacity: 0.03, color: 'var(--text-primary)', pointerEvents: 'none', userSelect: 'none'
        }}>
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        </div>
      </div>

      {/* Metrics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">
        {/* Total Balance Card */}
        <div style={cardStyle('var(--text-primary)')}>
          <div style={cardHeaderStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            Total Saldo Keseluruhan
          </div>
          <div style={cardValueStyle}>{formatCurrency(totalBalance)}</div>
          <div style={cardSubText}>{accounts.length} Rekening terdaftar</div>
          <button onClick={() => setActiveTab('accounts')} style={cardButtonStyle}>Lihat Rekening ↗</button>
        </div>

        {/* Transactions Counter Card */}
        <div style={cardStyle('#10b981')}>
          <div style={cardHeaderStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Volume Transaksi
          </div>
          <div style={cardValueStyle}>{transactions.length} <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.5 }}>Aktivitas</span></div>
          <div style={cardSubText}>Pembukuan mutasi real-time</div>
          <button onClick={() => setActiveTab('transactions')} style={cardButtonStyle}>Mutasi Rekening ↗</button>
        </div>

        {/* Financing Card */}
        <div style={cardStyle('#3b82f6')}>
          <div style={cardHeaderStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            Akad Pembiayaan
          </div>
          <div style={cardValueStyle}>{contracts.length} <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.5 }}>Pengajuan</span></div>
          <div style={cardSubText}>{contracts.filter(c => c.status === 'pending').length} Menunggu Tinjauan</div>
          <button onClick={() => setActiveTab('financing')} style={cardButtonStyle}>Status Akad ↗</button>
        </div>
      </div>

      {/* Dual Columns: Blocker / Actions + Quick Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-6 md:gap-8">
        
        {/* Action Checklist Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Tugas & Checklist Anggota</h3>

          {/* KYC Alert if incomplete */}
          {!isProfileComplete && (
            <div style={{
              background: '#991b1b',
              border: '2px solid #fca5a5',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 15px 30px var(--shadow-color)'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fecaca" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span style={{ fontWeight: 900, color: '#fecaca', fontSize: '16px' }}>Segera Lengkapi Dokumen!</span>
              </div>
              <p style={{ color: '#ffffff', fontSize: '13px', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                Dokumen identitas KYC Anda belum terisi lengkap. Ini membatasi akses pengajuan pembiayaan Anda.
              </p>
              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  background: '#fca5a5', color: '#450a0a', border: 'none',
                  padding: '12px 18px', borderRadius: '12px', fontWeight: 900, fontSize: '13px',
                  cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                  marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Sunting & Lengkapi
              </button>
            </div>
          )}

          {/* Membership Deposit Alert if incomplete */}
          {isProfileComplete && (!profile?.paid_principal_deposit || !profile?.paid_mandatory_deposit) && (
            <div style={{
              background: 'rgba(243, 198, 83, 0.1)',
              border: '2px solid var(--gold-bright)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 15px 30px var(--shadow-color)'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '24px' }}>🪙</span>
                <span style={{ fontWeight: 900, color: 'var(--gold-bright)', fontSize: '16px' }}>Setoran Awal Belum Lunas</span>
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                Untuk mengaktifkan keanggotaan penuh, Anda diwajibkan menyetor Simpanan Pokok (diawal) dan Simpanan Wajib (perbulan) secara online.
              </p>
              <button
                onClick={() => setActiveTab('deposits')}
                style={{
                  background: 'var(--gold-gradient)', color: '#02130e', border: 'none',
                  padding: '12px 18px', borderRadius: '12px', fontWeight: 900, fontSize: '13px',
                  cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                  marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                💳 Bayar Simpanan Online
              </button>
            </div>
          )}

          {/* System Tips */}
          <div style={{
            background: 'var(--bg-card)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '2px solid var(--border-primary)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f3c653" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Tips Keamanan Finansial
            </h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              Ingatlah untuk tidak pernah memberikan kata sandi (password) akun iQ-RA Anda kepada siapa pun, termasuk kepada petugas koperasi kami. Petugas resmi tidak akan pernah meminta kredensial pribadi Anda.
            </p>
          </div>
        </div>

        {/* Quick Transaction Preview */}
        <div style={{
          background: 'var(--bg-card)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '3px solid var(--border-primary)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 15px 40px var(--shadow-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Aktivitas Terkini</h3>
            <button 
              onClick={() => setActiveTab('transactions')}
              style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
            >
              Lihat Semua →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {previewTx.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', opacity: 0.4, fontSize: '14px' }}>
                Belum memiliki riwayat transaksi.
              </div>
            ) : (
              previewTx.map(tx => {
                const isOut = tx.type.toLowerCase().includes('withdrawal') || tx.type.toLowerCase().includes('out');
                return (
                  <div key={tx.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-page)', backdropFilter: 'blur(16px)', padding: '14px 18px', borderRadius: '14px',
                    border: '1px solid var(--border-primary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: isOut ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isOut ? '#ef4444' : '#10b981'
                      }}>
                        {isOut ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="17" y1="17" x2="7" y2="7"></line>
                            <polyline points="7 17 7 7 17 7"></polyline>
                          </svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {tx.type.toLowerCase().includes('deposit') ? 'Setoran Masuk' : isOut ? 'Penarikan Tunai' : 'Transaksi Buku'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {new Date(tx.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '15px', fontWeight: 900,
                      color: isOut ? '#ef4444' : '#10b981'
                    }}>
                      {isOut ? '-' : '+'} {formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const cardStyle = (borderColor: string) => ({
  background: 'var(--bg-card)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
  border: `2px solid ${borderColor}`,
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 15px 35px var(--shadow-color)',
  display: 'flex',
  flexDirection: 'column' as any,
  position: 'relative' as any
});

const cardHeaderStyle = {
  fontSize: '13px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  opacity: 0.6,
  textTransform: 'uppercase' as any,
  letterSpacing: '1px',
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center'
};

const cardValueStyle = {
  fontSize: '28px',
  fontWeight: 900,
  color: 'var(--text-primary)',
  marginBottom: '6px'
};

const cardSubText = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  marginBottom: '24px'
};

const cardButtonStyle = {
  background: 'var(--border-primary)',
  border: '1px solid var(--border-primary)',
  color: 'var(--text-primary)',
  padding: '8px 16px',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  alignSelf: 'flex-start' as any,
  marginTop: 'auto',
  transition: 'background 0.2s'
};

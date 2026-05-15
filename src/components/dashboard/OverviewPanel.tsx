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
        background: 'rgba(4, 49, 33, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '3px solid #cca334',
        borderRadius: '28px',
        padding: '40px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', marginBottom: '12px' }}>
            Assalamualaikum, <span style={{ color: '#f3c653' }}>{profile?.users?.full_name || 'Saudara/i'}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
            Selamat datang kembali di portal layanan syariah mandiri Anda. Anda dapat mengelola tabungan, melihat imbal hasil mudharabah, dan mengajukan pembiayaan tanpa riba dari sini.
          </p>
        </div>
        {/* Giant faint background vector element */}
        <div style={{
          position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%) scale(1.6)',
          opacity: 0.04, fontSize: '120px', pointerEvents: 'none', userSelect: 'none'
        }}>🕌</div>
      </div>

      {/* Metrics Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
        {/* Total Balance Card */}
        <div style={cardStyle('#cca334')}>
          <div style={cardHeaderStyle}>💵 Total Saldo Keseluruhan</div>
          <div style={cardValueStyle}>{formatCurrency(totalBalance)}</div>
          <div style={cardSubText}>{accounts.length} Rekening terdaftar</div>
          <button onClick={() => setActiveTab('accounts')} style={cardButtonStyle}>Lihat Rekening ↗</button>
        </div>

        {/* Transactions Counter Card */}
        <div style={cardStyle('#34d399')}>
          <div style={cardHeaderStyle}>📊 Volume Transaksi</div>
          <div style={cardValueStyle}>{transactions.length} <span style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Aktivitas</span></div>
          <div style={cardSubText}>Pembukuan mutasi real-time</div>
          <button onClick={() => setActiveTab('transactions')} style={cardButtonStyle}>Mutasi Rekening ↗</button>
        </div>

        {/* Financing Card */}
        <div style={cardStyle('#60a5fa')}>
          <div style={cardHeaderStyle}>🤝 Akad Pembiayaan</div>
          <div style={cardValueStyle}>{contracts.length} <span style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Pengajuan</span></div>
          <div style={cardSubText}>{contracts.filter(c => c.status === 'pending').length} Menunggu Tinjauan</div>
          <button onClick={() => setActiveTab('financing')} style={cardButtonStyle}>Status Akad ↗</button>
        </div>
      </div>

      {/* Dual Columns: Blocker / Actions + Quick Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '32px' }}>
        
        {/* Action Checklist Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#043121', margin: 0 }}>Tugas & Checklist Anggota</h3>

          {/* KYC Alert if incomplete */}
          {!isProfileComplete && (
            <div style={{
              background: '#7f1d1d', // Solid premium deep red background for maximum readability
              border: '2px solid #fca5a5',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 15px 30px rgba(127, 29, 29, 0.3)'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '24px' }}>🚨</span>
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
                  marginTop: '4px'
                }}
              >
                ✏️ Sunting & Lengkapi
              </button>
            </div>
          )}

          {/* System Tips */}
          <div style={{
            background: 'rgba(4, 49, 33, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '2px solid rgba(204, 163, 52, 0.2)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f3c653' }}>💡 Tips Keamanan Finansial</h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
              Ingatlah untuk tidak pernah memberikan kata sandi (password) akun iQ-RA Anda kepada siapa pun, termasuk kepada petugas koperasi kami. Petugas resmi tidak akan pernah meminta kredensial pribadi Anda.
            </p>
          </div>
        </div>

        {/* Quick Transaction Preview */}
        <div style={{
          background: 'rgba(4, 49, 33, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '3px solid #cca334',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 15px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#f3c653', margin: 0 }}>Aktivitas Terkini</h3>
            <button 
              onClick={() => setActiveTab('transactions')}
              style={{ background: 'transparent', border: 'none', color: '#34d399', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
            >
              Lihat Semua →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {previewTx.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                Belum memiliki riwayat transaksi.
              </div>
            ) : (
              previewTx.map(tx => {
                const isOut = tx.type.toLowerCase().includes('withdrawal') || tx.type.toLowerCase().includes('out');
                return (
                  <div key={tx.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)', padding: '14px 18px', borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                        {tx.type.toLowerCase().includes('deposit') ? '📥 Setoran' : isOut ? '📤 Penarikan' : '💸 Transaksi'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                        {new Date(tx.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '15px', fontWeight: 900,
                      color: isOut ? '#fca5a5' : '#34d399'
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
  background: 'rgba(4, 49, 33, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
  border: `2px solid ${borderColor}`,
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
  display: 'flex',
  flexDirection: 'column' as any,
  position: 'relative' as any
});

const cardHeaderStyle = {
  fontSize: '13px',
  fontWeight: 800,
  color: '#ffffff',
  opacity: 0.6,
  textTransform: 'uppercase' as any,
  letterSpacing: '1px',
  marginBottom: '12px'
};

const cardValueStyle = {
  fontSize: '28px',
  fontWeight: 900,
  color: '#ffffff',
  marginBottom: '6px'
};

const cardSubText = {
  fontSize: '12px',
  color: 'rgba(255,255,255,0.4)',
  fontWeight: 600,
  marginBottom: '24px'
};

const cardButtonStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  alignSelf: 'flex-start' as any,
  marginTop: 'auto',
  transition: 'background 0.2s'
};

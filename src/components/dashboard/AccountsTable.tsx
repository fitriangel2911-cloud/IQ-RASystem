'use client';
import React from 'react';

interface AccountsTableProps {
  accounts: any[];
}

export default function AccountsTable({ accounts }: AccountsTableProps) {
  const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const accountTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'wadiah': return 'Simpanan Wadiah (Titipan)';
      case 'mudharabah': return 'Investasi Mudharabah (Bagi Hasil)';
      case 'haji': return 'Tabungan Haji';
      case 'umrah': return 'Tabungan Umrah';
      case 'pembiayaan': return 'Pembiayaan Kontrak';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)', 
      backdropFilter: 'blur(24px)', 
      WebkitBackdropFilter: 'blur(24px)',
      border: '2px solid var(--border-primary)',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 20px 50px var(--shadow-color)'
    }}>
      <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Daftar Seluruh Rekening Aktif</h3>
        <span style={{ background: 'var(--border-primary)', color: 'var(--text-primary)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, border: '1px solid var(--border-primary)' }}>
          {accounts.length} Rekening
        </span>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--border-primary)', borderBottom: '2px solid var(--border-primary)' }}>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Kode Rekening</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Akad / Jenis Tabungan</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Saldo Mengendap</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>
                  Belum memiliki rekening terdaftar.<br/>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', opacity: 0.6, display: 'inline-block', marginTop: '8px' }}>Silakan hubungi Customer Service untuk pembukaan rekening pertama.</span>
                </td>
              </tr>
            ) : (
              accounts.map((acc, index) => (
                <tr 
                  key={acc.id}
                  style={{
                    borderBottom: '1px solid var(--border-primary)',
                    background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <td style={{ padding: '20px' }}>
                    <code style={{
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-primary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace'
                    }}>{acc.account_code}</code>
                  </td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 800 }}>
                    {accountTypeLabel(acc.type)}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right', fontSize: '18px', fontWeight: 900, color: '#10b981' }}>
                    {currencyFormatter.format(acc.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

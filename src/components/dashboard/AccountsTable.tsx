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
      background: '#032419',
      border: '3px solid #cca334',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
    }}>
      <div style={{ padding: '24px 30px', borderBottom: '2px solid rgba(204, 163, 52, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#f3c653', margin: 0 }}>Daftar Seluruh Rekening Aktif</h3>
        <span style={{ background: 'rgba(243, 198, 83, 0.1)', color: '#f3c653', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, border: '1px solid rgba(243,198,83,0.3)' }}>
          {accounts.length} Rekening
        </span>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#021c13', borderBottom: '2px solid #cca334' }}>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px' }}>Kode Rekening</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px' }}>Akad / Jenis Tabungan</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Saldo Mengendap</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '16px', fontWeight: 600 }}>
                  Belum memiliki rekening terdaftar.<br/>
                  <span style={{ fontSize: '13px', color: '#cca334', display: 'inline-block', marginTop: '8px' }}>Silakan hubungi Customer Service untuk pembukaan rekening pertama.</span>
                </td>
              </tr>
            ) : (
              accounts.map((acc, index) => (
                <tr 
                  key={acc.id}
                  style={{
                    borderBottom: '1px solid rgba(204, 163, 52, 0.1)',
                    background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <td style={{ padding: '20px' }}>
                    <code style={{
                      background: '#010d09',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#ffffff',
                      fontFamily: 'monospace'
                    }}>{acc.account_code}</code>
                  </td>
                  <td style={{ padding: '20px', color: '#ffffff', fontSize: '15px', fontWeight: 800 }}>
                    {accountTypeLabel(acc.type)}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right', fontSize: '18px', fontWeight: 900, color: '#34d399' }}>
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

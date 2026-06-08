'use client';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface TransactionsTableProps {
  transactions: any[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const { theme } = useTheme();
  const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatType = (type: string) => {
    const safeType = type || '';
    switch (safeType.toLowerCase()) {
      case 'deposit':
      case 'simpanan': 
        return { label: 'SETORAN TUNAI', color: '#10b981', sign: '+' };
      case 'withdrawal':
      case 'penarikan': 
        return { label: 'PENARIKAN TUNAI', color: '#ef4444', sign: '-' };
      case 'transfer_in': 
        return { label: 'TRANSFER MASUK', color: '#10b981', sign: '+' };
      case 'transfer_out': 
        return { label: 'TRANSFER KELUAR', color: '#ef4444', sign: '-' };
      case 'profit_share': 
        return { label: 'BAGI HASIL (NISBAH)', color: 'var(--text-primary)', sign: '+' };
      case 'financing_disbursement': 
        return { label: 'PENCAIRAN PEMBIAYAAN', color: '#3b82f6', sign: '+' };
      default: 
        return { label: safeType.toUpperCase(), color: 'var(--text-primary)', sign: '' };
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
        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Catatan Histori Seluruh Transaksi</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ background: 'var(--border-primary)', color: 'var(--text-primary)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, border: '1px solid var(--border-primary)' }}>
            {transactions.length} Riwayat
          </span>
          <button 
            onClick={() => window.print()}
            style={{
              background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
              color: '#02130e',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(243,198,83,0.3)',
              textTransform: 'uppercase'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Unduh E-Statement (PDF)
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--border-primary)', borderBottom: '2px solid var(--border-primary)' }}>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Waktu & Tanggal</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Tipe Transaksi</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Keterangan / Deskripsi</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Nominal Rupiah</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>
                  Belum ada rekaman mutasi keuangan.<br/>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', opacity: 0.6, display: 'inline-block', marginTop: '8px' }}>Semua riwayat setoran, penarikan, dan pencairan akan tampil secara real-time di sini.</span>
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => {
                const info = formatType(tx.type);
                const dateObj = new Date(tx.created_at);
                return (
                  <tr 
                    key={tx.id}
                    style={{
                      borderBottom: '1px solid var(--border-primary)',
                      background: idx % 2 === 0 ? 'transparent' : (theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)'),
                    }}
                  >
                    {/* Date */}
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '15px' }}>
                        {dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>
                        {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td style={{ padding: '20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 900,
                        background: 'rgba(0,0,0,0.02)',
                        border: `1.5px solid ${info.color}`,
                        color: info.color,
                      }}>
                        {info.label}
                      </span>
                    </td>

                    {/* Desc */}
                    <td style={{ padding: '20px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || 'Catatan Teller / Sistem'}
                    </td>

                    {/* Amount */}
                    <td style={{ 
                      padding: '20px', 
                      textAlign: 'right', 
                      fontSize: '16px', 
                      fontWeight: 900, 
                      color: info.color 
                    }}>
                      {info.sign} {currencyFormatter.format(tx.amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

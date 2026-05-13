'use client';
import React from 'react';

interface TransactionsTableProps {
  transactions: any[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'simpanan': 
        return { label: '📥 SETORAN TUNAI', color: '#34d399', sign: '+' };
      case 'withdrawal':
      case 'penarikan': 
        return { label: '📤 PENARIKAN TUNAI', color: '#fca5a5', sign: '-' };
      case 'transfer_in': 
        return { label: '📥 TRANSFER MASUK', color: '#34d399', sign: '+' };
      case 'transfer_out': 
        return { label: '📤 TRANSFER KELUAR', color: '#fca5a5', sign: '-' };
      case 'profit_share': 
        return { label: '💎 BAGI HASIL (NISBAH)', color: '#f3c653', sign: '+' };
      case 'financing_disbursement': 
        return { label: '🤝 PENCAIRAN PEMBIAYAAN', color: '#60a5fa', sign: '+' };
      default: 
        return { label: type.toUpperCase(), color: '#ffffff', sign: '' };
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
        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#f3c653', margin: 0 }}>Catatan Histori Seluruh Transaksi</h3>
        <span style={{ background: 'rgba(243, 198, 83, 0.1)', color: '#f3c653', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, border: '1px solid rgba(243,198,83,0.3)' }}>
          {transactions.length} Riwayat
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#021c13', borderBottom: '2px solid #cca334' }}>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px' }}>Waktu & Tanggal</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px' }}>Tipe Transaksi</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px' }}>Keterangan / Deskripsi</th>
              <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Nominal Rupiah</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '16px', fontWeight: 600 }}>
                  Belum ada rekaman mutasi keuangan.<br/>
                  <span style={{ fontSize: '13px', color: '#cca334', display: 'inline-block', marginTop: '8px' }}>Semua riwayat setoran, penarikan, dan pencairan akan tampil secara real-time di sini.</span>
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
                      borderBottom: '1px solid rgba(204, 163, 52, 0.1)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    {/* Date */}
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '15px' }}>
                        {dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>
                        {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td style={{ padding: '20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 900,
                        background: 'rgba(2, 28, 19, 0.6)',
                        border: `1.5px solid ${info.color}`,
                        color: info.color,
                      }}>
                        {info.label}
                      </span>
                    </td>

                    {/* Desc */}
                    <td style={{ padding: '20px', color: '#ffffff', fontSize: '14px', fontWeight: 500, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

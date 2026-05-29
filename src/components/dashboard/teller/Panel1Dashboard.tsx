'use client';
import React from 'react';

interface ShiftData {
  id?: string;
  status: 'aktif' | 'tutup';
  start_time?: string;
  cash_in?: number;
  teller_name?: string;
}

interface RecentTx {
  id: string;
  date: string;
  reference_no: string;
  description: string;
  debit: number;
  credit: number;
}

interface Panel1Props {
  shiftStatus: ShiftData;
  cashOnHand: number;
  recentTransactions: RecentTx[];
  onGoToPanel: (panel: string) => void;
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
const fmtTime = (s: string) => new Date(s).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

export default function Panel1Dashboard({ shiftStatus, cashOnHand, recentTransactions, onGoToPanel }: Panel1Props) {
  const shortcuts = [
    { key: '1', label: 'Dasbor' },
    { key: '2', label: 'Cari Anggota' },
    { key: '3', label: 'Setoran' },
    { key: '4', label: 'Penarikan' },
    { key: '5', label: 'Angsuran' },
    { key: '6', label: 'Shift' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Status Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Shift Badge */}
        <div style={{
          background: shiftStatus.status === 'aktif' ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
          border: `2px solid ${shiftStatus.status === 'aktif' ? '#4ade80' : '#ef4444'}`,
          borderRadius: '20px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: shiftStatus.status === 'aktif' ? '#4ade80' : '#ef4444',
            display: 'inline-block', marginBottom: '12px',
            boxShadow: `0 0 12px ${shiftStatus.status === 'aktif' ? '#4ade80' : '#ef4444'}`
          }}></span>
          <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: shiftStatus.status === 'aktif' ? '#4ade80' : '#ef4444', marginBottom: '6px' }}>
            SHIFT {shiftStatus.status === 'aktif' ? 'AKTIF' : 'TUTUP'}
          </div>
          {shiftStatus.start_time && (
            <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Mulai: {fmtTime(shiftStatus.start_time)}
            </div>
          )}
          {shiftStatus.status === 'tutup' && (
            <button onClick={() => onGoToPanel('shift')} style={{
              marginTop: '12px', background: '#4ade80', color: '#02130e', border: 'none',
              borderRadius: '10px', padding: '10px 20px', fontWeight: 900, cursor: 'pointer', fontSize: '14px'
            }}>Buka Shift [6]</button>
          )}
        </div>

        {/* Cash on Hand */}
        <div style={{
          background: 'rgba(243,198,83,0.06)', border: '2px solid rgba(243,198,83,0.3)',
          borderRadius: '20px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: '#f3c653', marginBottom: '8px' }}>
            KAS DI TANGAN
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#4ade80', marginBottom: '4px' }}>{fmt(cashOnHand)}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Real-time • COA 101.01</div>
        </div>

        {/* Date & Petugas */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
          borderRadius: '20px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            HARI INI
          </div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          {shiftStatus.teller_name && (
            <div style={{ fontSize: '14px', color: '#f3c653', fontWeight: 700, marginTop: '6px' }}>
              Teller: {shiftStatus.teller_name}
            </div>
          )}
        </div>
      </div>

      {/* Shortcut Hints */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
        borderRadius: '20px', padding: '24px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>
          Navigasi Keyboard Cepat
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {shortcuts.map(sc => (
            <button key={sc.key} onClick={() => onGoToPanel(
              sc.key === '1' ? 'dashboard' : sc.key === '2' ? 'member' : sc.key === '3' ? 'deposit' : sc.key === '4' ? 'withdrawal' : sc.key === '5' ? 'payment' : 'shift'
            )} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--border-primary)', border: '1px solid var(--border-primary)',
              borderRadius: '12px', padding: '12px 18px', cursor: 'pointer',
              color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px', transition: 'all 0.2s'
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#f3c653'; e.currentTarget.style.color = '#f3c653'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              <span style={{ fontFamily: 'monospace', background: 'rgba(243,198,83,0.15)', color: '#f3c653', padding: '3px 9px', borderRadius: '6px', fontSize: '13px', fontWeight: 900 }}>[{sc.key}]</span>
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Transaksi Terakhir */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
        borderRadius: '20px', overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>5 Transaksi Terakhir</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Tanggal', 'Ref No', 'Keterangan', 'Debit', 'Kredit'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: h === 'Debit' || h === 'Kredit' ? 'right' : 'left', fontSize: '13px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '15px' }}>Belum ada transaksi hari ini.</td></tr>
              ) : recentTransactions.slice(0, 5).map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '14px 18px', fontSize: '14px', color: 'var(--text-secondary)' }}>{fmtDate(tx.date)}</td>
                  <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 800, color: '#4ade80', fontFamily: 'monospace' }}>{tx.reference_no}</td>
                  <td style={{ padding: '14px 18px', fontSize: '14px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#4ade80', fontSize: '14px' }}>{tx.debit > 0 ? fmt(tx.debit) : '-'}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#fca5a5', fontSize: '14px' }}>{tx.credit > 0 ? fmt(tx.credit) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

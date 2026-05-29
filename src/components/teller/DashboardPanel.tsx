'use client';
import React from 'react';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const SHORTCUTS = [
  { key: '1', label: '🏠 Dasbor' }, { key: '2', label: '🔍 Anggota' },
  { key: '3', label: '💵 Setoran' }, { key: '4', label: '💸 Penarikan' },
  { key: '5', label: '🧾 Angsuran' }, { key: '6', label: '🔑 Shift' },
];

interface Props {
  shiftOpen: boolean;
  shiftStartTime: string | null;
  cashOnHand: number;
  recentTx: any[];
  onOpenShift: () => void;
}

export default function DashboardPanel({ shiftOpen, shiftStartTime, cashOnHand, recentTx, onOpenShift }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Shift Status */}
      <div style={{
        background: shiftOpen ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
        border: `2px solid ${shiftOpen ? '#4ade80' : '#ef4444'}`,
        borderRadius: '20px', padding: '28px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%',
            background: shiftOpen ? '#4ade80' : '#ef4444',
            boxShadow: `0 0 10px ${shiftOpen ? '#4ade80' : '#ef4444'}`
          }} />
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Status Shift Hari Ini</div>
            <div style={{ color: shiftOpen ? '#4ade80' : '#fca5a5', fontSize: '22px', fontWeight: 900 }}>
              {shiftOpen ? '● SHIFT AKTIF' : '○ SHIFT BELUM DIBUKA'}
            </div>
            {shiftOpen && shiftStartTime && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Dimulai: {shiftStartTime}</div>
            )}
          </div>
        </div>
        {!shiftOpen && (
          <button onClick={onOpenShift} style={{
            background: 'linear-gradient(135deg, #4ade80, #22c55e)',
            color: '#022c22', border: 'none', padding: '14px 28px',
            borderRadius: '14px', fontWeight: 900, fontSize: '15px', cursor: 'pointer'
          }}>🔓 Buka Shift Sekarang [6]</button>
        )}
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'
      }}>
        {[
          { label: '💰 Kas di Tangan', value: fmt(cashOnHand), color: '#f3c653' },
          { label: '📅 Tanggal', value: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), color: 'var(--text-primary)' },
          { label: '⏰ Waktu Lokal', value: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), color: 'var(--text-primary)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-header)', borderRadius: '18px', padding: '24px',
            border: '1px solid var(--border-primary)', textAlign: 'center'
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: '20px', fontWeight: 900 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Keyboard Hints */}
      <div style={{ background: 'var(--bg-header)', borderRadius: '16px', padding: '18px 24px', border: '1px solid var(--border-primary)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>⌨️ Navigasi Keyboard Cepat</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {SHORTCUTS.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: 'var(--border-primary)', color: 'var(--gold-intense)', padding: '2px 8px', borderRadius: '6px', fontWeight: 900, fontFamily: 'monospace', fontSize: '13px' }}>[{s.key}]</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--gold-intense)', margin: 0, fontSize: '15px', fontWeight: 900 }}>📋 5 TRANSAKSI TERAKHIR</h3>
          <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 800 }}>🟢 LIVE</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['WAKTU', 'REF', 'KETERANGAN', 'DEBIT', 'KREDIT'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', color: 'var(--gold-bright)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', textAlign: i > 2 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTx.length > 0 ? recentTx.slice(0, 5).map(tx => (
                <tr key={tx.id} style={{ borderTop: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '13px 16px', fontSize: '11px', color: '#4ade80', fontWeight: 800 }}>{tx.reference_no}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--text-primary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', color: '#4ade80', fontWeight: 800, fontSize: '13px' }}>{tx.debit > 0 ? `+${fmt(tx.debit)}` : '—'}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', color: '#fca5a5', fontWeight: 800, fontSize: '13px' }}>{tx.credit > 0 ? `−${fmt(tx.credit)}` : '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Belum ada transaksi hari ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect, useRef } from 'react';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

type PanelKey = 'dashboard' | 'member' | 'deposit' | 'withdrawal' | 'payment' | 'shift';

interface Member { id: string; user_id: string; nik: string; phone_number?: string; users?: { full_name: string; email: string }; }

interface Props {
  members: Member[];
  selectedMember: Member | null;
  setSelectedMember: (m: Member | null) => void;
  balance: number | null;
  setActivePanel: (p: PanelKey) => void;
}

export default function MemberPanel({ members, selectedMember, setSelectedMember, balance, setActivePanel }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = query.length >= 1
    ? members.filter(m =>
        m.users?.full_name?.toLowerCase().includes(query.toLowerCase()) || m.nik?.includes(query)
      )
    : members;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search */}
      <div style={{ background: 'var(--bg-header)', borderRadius: '20px', padding: '24px', border: '2px solid rgba(204,163,52,0.4)' }}>
        <label style={{ display: 'block', color: 'var(--gold-bright)', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          🔍 Cari Anggota — Nama / NIK
        </label>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ketik nama atau NIK anggota..."
          style={{
            width: '100%', background: 'var(--bg-page)',
            border: '2px solid var(--border-primary)', borderRadius: '14px',
            padding: '16px 20px', color: 'var(--text-primary)',
            fontSize: '18px', fontWeight: 700, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--gold-bright)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-primary)'}
        />
        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px' }}>{filtered.length} anggota ditemukan</div>
      </div>

      {/* Member Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
        {filtered.map(m => (
          <button key={m.id} onClick={() => setSelectedMember(m)} style={{
            background: selectedMember?.id === m.id ? 'rgba(204,163,52,0.12)' : 'var(--bg-card)',
            border: `2px solid ${selectedMember?.id === m.id ? 'var(--gold-bright)' : 'var(--border-primary)'}`,
            borderRadius: '14px', padding: '16px', cursor: 'pointer',
            textAlign: 'left', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f3c653, #cca334)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 900, color: '#02130e', flexShrink: 0
            }}>{m.users?.full_name?.charAt(0) || '?'}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.users?.full_name || 'Anggota'}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>NIK: {m.nik}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Member Card */}
      {selectedMember && (
        <div style={{ background: 'var(--bg-header)', borderRadius: '24px', padding: '28px', border: '2px solid var(--gold-bright)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{
              width: '68px', height: '68px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #f3c653, #cca334)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 900, color: '#02130e',
            }}>{selectedMember.users?.full_name?.charAt(0) || '?'}</div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '22px', fontWeight: 900 }}>{selectedMember.users?.full_name}</h3>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ background: '#022c22', color: '#4ade80', padding: '3px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 800, border: '1px solid #4ade80' }}>● AKTIF</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>NIK: {selectedMember.nik}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{selectedMember.users?.email}</span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Saldo Simpanan</div>
              <div style={{ color: '#4ade80', fontSize: '22px', fontWeight: 900 }}>{balance !== null ? fmt(balance) : '—'}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {([
              { label: '💵 Setoran Tunai', panel: 'deposit' },
              { label: '💸 Penarikan Tunai', panel: 'withdrawal' },
              { label: '🧾 Bayar Angsuran', panel: 'payment' },
            ] as { label: string; panel: PanelKey }[]).map(btn => (
              <button key={btn.panel} onClick={() => setActivePanel(btn.panel)} style={{
                background: 'rgba(204,163,52,0.08)', border: '1.5px solid rgba(204,163,52,0.35)',
                borderRadius: '12px', padding: '14px', color: 'var(--gold-intense)',
                fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
              }}>{btn.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

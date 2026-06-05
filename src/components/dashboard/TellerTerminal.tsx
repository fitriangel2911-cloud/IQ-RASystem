'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

import Panel1Dashboard from './teller/Panel1Dashboard';
import Panel2Member from './teller/Panel2Member';
import Panel3Deposit from './teller/Panel3Deposit';
import Panel4Withdrawal from './teller/Panel4Withdrawal';
import Panel5Payment from './teller/Panel5Payment';
import Panel6Shift, { ShiftData } from './teller/Panel6Shift';
import Panel7Disbursement from './teller/Panel7Disbursement';

interface TellerTerminalProps {
  userId: string;
  activeMenu?: string;
}

type PanelKey = 'dashboard' | 'member' | 'deposit' | 'withdrawal' | 'payment' | 'disbursement' | 'shift';

const PANELS: { key: PanelKey; label: string; shortcut: string }[] = [
  { key: 'dashboard', label: 'Status & Dasbor', shortcut: '1' },
  { key: 'member',    label: 'Cari Anggota',    shortcut: '2' },
  { key: 'deposit',   label: 'Setoran Tunai',   shortcut: '3' },
  { key: 'withdrawal',label: 'Penarikan Tunai', shortcut: '4' },
  { key: 'payment',   label: 'Bayar Angsuran',  shortcut: '5' },
  { key: 'disbursement', label: 'Pencairan Pembiayaan', shortcut: '6' },
  { key: 'shift',     label: 'Shift Kas',       shortcut: '7' },
];

const PANEL_TITLES: Record<PanelKey, string> = {
  dashboard:  'Status Shift & Dasbor',
  member:     'Profil & Pencarian Anggota',
  deposit:    'Setoran Tunai',
  withdrawal: 'Penarikan Tunai',
  payment:    'Pembayaran Angsuran',
  disbursement: 'Pencairan Dana Pembiayaan',
  shift:      'Buka / Tutup Shift Kas',
};

export default function TellerTerminal({ userId, activeMenu }: TellerTerminalProps) {
  const [activePanel, setActivePanel] = useState<PanelKey>('dashboard');

  // Synchronize internal activePanel with parent activeMenu prop
  useEffect(() => {
    if (activeMenu && ['dashboard', 'member', 'deposit', 'withdrawal', 'payment', 'disbursement', 'shift'].includes(activeMenu)) {
      setActivePanel(activeMenu as PanelKey);
    }
  }, [activeMenu]);

  const [tellerName, setTellerName] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [shiftStatus, setShiftStatus] = useState<ShiftData>({ status: 'tutup' });
  const [cashOnHand, setCashOnHand] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // Fetch teller name + active shift + cash on hand + recent transactions
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      if (userId) {
        const { data: u } = await supabase.from('users').select('full_name').eq('id', userId).single();
        if (u) setTellerName(u.full_name);

        // Auto-resume active shift of the day for this teller
        const { data: activeShift } = await supabase
          .from('teller_shifts')
          .select('*')
          .eq('teller_id', userId)
          .eq('status', 'aktif')
          .order('opened_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeShift) {
          setShiftStatus({
            id: activeShift.id,
            status: 'aktif',
            start_time: activeShift.opened_at,
            cash_in: Number(activeShift.cash_in),
            teller_name: activeShift.teller_name,
            teller_id: activeShift.teller_id
          });
        }
      }
      await loadDashboardData();
    };
    init();
  }, [userId, refreshKey]);

  async function loadDashboardData() {
    const supabase = createClient();
    // Cash on Hand (COA 101.01): sum(debit) - sum(credit)
    const { data: cashData } = await supabase
      .from('journal_entries')
      .select('debit, credit')
      .eq('account_code', '101.01');
    if (cashData) {
      const totalDebit = cashData.reduce((s, r) => s + (Number(r.debit) || 0), 0);
      const totalCredit = cashData.reduce((s, r) => s + (Number(r.credit) || 0), 0);
      setCashOnHand(totalDebit - totalCredit);
    }
    // Recent 5 transactions
    const { data: txData } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (txData) setRecentTransactions(txData);
  };

  // Global keyboard shortcut [1]–[6]
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const map: Record<string, PanelKey> = {
        '1': 'dashboard', '2': 'member', '3': 'deposit',
        '4': 'withdrawal', '5': 'payment', '6': 'disbursement', '7': 'shift',
      };
      if (map[e.key]) {
        e.preventDefault();
        setActivePanel(map[e.key]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelectMember = (member: any) => {
    setSelectedMember(member);
  };

  const handleShiftChange = (shift: ShiftData) => {
    setShiftStatus(shift);
  };

  // Rich-loads account balances in real-time on transaction success!
  const handleTransactionSuccess = async () => {
    triggerRefresh();
    if (selectedMember) {
      const supabase = createClient();
      const { data: accounts } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('member_id', selectedMember.user_id);
      if (accounts) {
        setSelectedMember((prev: any) => ({
          ...prev,
          savings_accounts: accounts
        }));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Tab Navigation Bar */}
      <div style={{
        display: 'flex', gap: '8px', padding: '12px 16px',
        background: 'var(--bg-header)', backdropFilter: 'blur(16px)',
        borderRadius: '20px', marginBottom: '16px',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 8px 24px var(--shadow-color)',
        overflowX: 'auto',
      }}>
        {PANELS.map(panel => {
          const isActive = activePanel === panel.key;
          return (
            <button
              key={panel.key}
              id={`teller-tab-${panel.shortcut}`}
              onClick={() => setActivePanel(panel.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: '12px', border: 'none',
                background: isActive ? 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)' : 'transparent',
                color: isActive ? '#02130e' : 'var(--text-secondary)',
                fontWeight: isActive ? 900 : 700,
                fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: isActive ? '0 4px 15px rgba(243,198,83,0.35)' : 'none',
              }}
              onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
              onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
            >
              <span>{panel.label}</span>
            </button>
          );
        })}
        {/* Selected member badge */}
        {selectedMember && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', flexShrink: 0
          }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#4ade80', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedMember.users?.full_name}
            </span>
            <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '16px', padding: '0', marginLeft: '6px', lineHeight: 1 }}>✕</button>
          </div>
        )}
      </div>

      {/* Panel Title */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
          {PANEL_TITLES[activePanel]}
        </h2>
        {activePanel !== 'dashboard' && activePanel !== 'member' && activePanel !== 'shift' && !selectedMember && (
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(252,165,165,0.8)', fontWeight: 600 }}>
            Belum ada anggota terpilih — Silakan cari anggota terlebih dahulu.
          </p>
        )}
      </div>

      {/* Panel Content */}
      <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        {activePanel === 'dashboard' && (
          <Panel1Dashboard
            shiftStatus={{ ...shiftStatus, teller_name: tellerName }}
            cashOnHand={cashOnHand}
            recentTransactions={recentTransactions}
            onGoToPanel={(p) => setActivePanel(p as PanelKey)}
          />
        )}
        {activePanel === 'member' && (
          <Panel2Member
            onSelectMember={handleSelectMember}
            selectedMember={selectedMember}
            onGoToPanel={(p) => setActivePanel(p as PanelKey)}
            tellerName={tellerName}
          />
        )}
        {activePanel === 'deposit' && (
          <Panel3Deposit
            selectedMember={selectedMember}
            tellerName={tellerName}
            onSuccess={handleTransactionSuccess}
          />
        )}
        {activePanel === 'withdrawal' && (
          <Panel4Withdrawal
            selectedMember={selectedMember}
            tellerName={tellerName}
            onSuccess={handleTransactionSuccess}
          />
        )}
        {activePanel === 'payment' && (
          <Panel5Payment
            selectedMember={selectedMember}
            tellerName={tellerName}
            onSuccess={handleTransactionSuccess}
          />
        )}
        {activePanel === 'disbursement' && (
          <Panel7Disbursement
            selectedMember={selectedMember}
            tellerName={tellerName}
            onSuccess={handleTransactionSuccess}
          />
        )}
        {activePanel === 'shift' && (
          <Panel6Shift
            shiftStatus={shiftStatus}
            tellerId={userId}
            tellerName={tellerName}
            cashOnHand={cashOnHand}
            onShiftChange={handleShiftChange}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Member {
  id: string;
  user_id: string;
  nik: string;
  phone_number?: string;
  created_at: string;
  users?: { full_name: string; email: string };
  savings_accounts?: SavingsAccount[];
}

interface SavingsAccount {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
}

interface FinancingContract {
  id: string;
  type: string;
  amount: number;
  tenor_months: number;
  margin_ratio: number;
  status: string;
  disbursement_date?: string;
  installment_amount?: number;
  created_at: string;
}

interface Panel2Props {
  onSelectMember: (member: Member) => void;
  selectedMember: Member | null;
  onGoToPanel: (panel: string) => void;
  tellerName: string;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  pokok: 'Simpanan Pokok',
  wajib: 'Simpanan Wajib',
  wadiah: 'Simpanan Wadiah',
  mudharabah: 'Simpanan Mudharabah',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  murabahah: 'Murabahah',
  mudharabah: 'Mudharabah',
  musyarakah: 'Musyarakah',
  ijarah: 'Ijarah',
  istishna: "Istishna'",
  qardhul_hasan: 'Qardhul Hasan',
};

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

export default function Panel2Member({ onSelectMember, selectedMember, onGoToPanel, tellerName }: Panel2Props) {
  const [query, setQuery] = useState('');
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'simpanan' | 'pembiayaan' | 'konsolidasi'>('simpanan');

  // Savings accounts & mutations
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [mutasi, setMutasi] = useState<any[]>([]);
  const [loadingMutasi, setLoadingMutasi] = useState(false);

  // Financing contracts (Utang Pembiayaan)
  const [contracts, setContracts] = useState<FinancingContract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch Mutasi (Savings transactions)
  useEffect(() => {
    if (selectedMember && selectedMember.savings_accounts) {
      const fetchMutasi = async () => {
        setLoadingMutasi(true);
        const supabase = createClient();
        const accountIds = selectedMember.savings_accounts!.map(acc => acc.id);
        
        if (accountIds.length === 0) {
          setMutasi([]);
          setLoadingMutasi(false);
          return;
        }

        const { data } = await supabase
          .from('savings_transactions')
          .select('*, savings_accounts(account_number, account_type)')
          .in('account_id', accountIds)
          .order('created_at', { ascending: false });

        if (data) setMutasi(data);
        else setMutasi([]);
        setLoadingMutasi(false);
      };
      fetchMutasi();
    } else {
      setMutasi([]);
    }
  }, [selectedMember]);

  // Fetch Financing Contracts (Utang Pembiayaan)
  useEffect(() => {
    if (selectedMember) {
      const fetchContracts = async () => {
        setLoadingContracts(true);
        const supabase = createClient();
        const { data } = await supabase
          .from('financing_contracts')
          .select('*')
          .eq('member_id', selectedMember.user_id);
        setContracts(data || []);
        setLoadingContracts(false);
      };
      fetchContracts();
    } else {
      setContracts([]);
    }
  }, [selectedMember]);

  // Fetch Members List
  useEffect(() => {
    searchRef.current?.focus();
    const fetchMembers = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('members').select('*, users(full_name, email)').order('created_at', { ascending: false });
      if (data) { setAllMembers(data); setFiltered(data); }
    };
    fetchMembers();
  }, []);

  // Filtering
  useEffect(() => {
    if (!query) { setFiltered(allMembers); return; }
    const q = query.toLowerCase();
    setFiltered(allMembers.filter(m =>
      m.users?.full_name?.toLowerCase().includes(q) ||
      m.nik?.includes(q) ||
      m.user_id?.includes(q)
    ));
  }, [query, allMembers]);

  const handleSelect = async (member: Member) => {
    setLoadingAccounts(true);
    const supabase = createClient();
    const { data: accounts } = await supabase
      .from('savings_accounts')
      .select('*')
      .eq('member_id', member.user_id);
    const enriched = { ...member, savings_accounts: accounts || [] };
    onSelectMember(enriched);
    setLoadingAccounts(false);
  };

  const initials = (name?: string) => (name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Calculation for consolidation
  const totalSimpanan = selectedMember?.savings_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
  const totalUtangPembiayaan = contracts.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
  const netWorth = totalSimpanan - totalUtangPembiayaan;

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      {/* Left: Search & Mutasi Ledger */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Search Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-primary)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cari Anggota</h3>
            <div style={{ position: 'relative' }}>
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="NAMA / NIK / ID ANGGOTA..."
                style={{
                  width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)',
                  borderRadius: '12px', padding: '14px 18px', color: 'var(--text-primary)',
                  fontSize: '16px', fontWeight: 600, outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={e => { e.target.style.borderColor = '#f3c653'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-primary)'; }}
              />
            </div>
          </div>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '15px' }}>
                Tidak ada anggota ditemukan.
              </div>
            ) : filtered.map(m => (
              <button key={m.id} onClick={() => handleSelect(m)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px 24px', background: selectedMember?.id === m.id ? 'rgba(243,198,83,0.1)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border-primary)',
                borderLeft: selectedMember?.id === m.id ? '4px solid #f3c653' : '4px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
              }}
                onMouseOver={e => { if (selectedMember?.id !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseOut={e => { if (selectedMember?.id !== m.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #f3c653, #cca334)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 900, color: '#02130e'
                }}>{initials(m.users?.full_name)}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.users?.full_name || 'Anggota'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>NIK: {m.nik}</div>
                </div>
                <span style={{ fontSize: '12px', color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 800 }}>AKTIF</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabbed Normative Ledger Card */}
        {selectedMember && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '20px',
            padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
            animation: 'fadeInUp 0.4s ease-out'
          }}>
            {/* Header & Print Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Laporan Normatif Keuangan Anggota
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
                  Konsolidasi data simpanan tabungan dan kewajiban pembiayaan
                </div>
              </div>
              <button 
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (!printWin) return;
                  printWin.document.write(`
                    <html>
                      <head>
                        <title>Laporan Keuangan &amp; Mutasi Normatif - ${selectedMember.users?.full_name}</title>
                        <style>
                          body { font-family: 'Courier New', monospace; padding: 40px; color: #000; background: #fff; font-size: 12px; line-height: 1.4; }
                          h1 { text-align: center; font-size: 20px; margin: 0; }
                          .subtitle { text-align: center; font-size: 13px; margin-bottom: 20px; font-weight: bold; }
                          .section-title { font-size: 14px; font-weight: bold; margin-top: 24px; border-bottom: 2px solid #000; padding-bottom: 4px; text-transform: uppercase; }
                          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                          th { background-color: #f2f2f2; }
                          .text-right { text-align: right; }
                          .line { border-top: 1px dashed #000; margin: 12px 0; }
                          .total-row { font-weight: bold; background-color: #fafafa; }
                        </style>
                      </head>
                      <body>
                        <h1>KOPERASI SYARIAH IQ-RA</h1>
                        <div class="subtitle">Laporan Posisi Keuangan &amp; Mutasi Normatif Anggota</div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 20px;">
                          <div>
                            <div><strong>Nama Anggota:</strong> ${selectedMember.users?.full_name}</div>
                            <div><strong>NIK:</strong> ${selectedMember.nik}</div>
                          </div>
                          <div style="text-align: right;">
                            <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            <div><strong>Petugas Teller:</strong> ${tellerName}</div>
                          </div>
                        </div>

                        <div class="line"></div>

                        <!-- 1. SIMPANAN TABUNGAN -->
                        <div class="section-title">I. Portofolio Simpanan &amp; Tabungan (Aset Anggota)</div>
                        <table>
                          <thead>
                            <tr>
                              <th>Nomor Rekening</th>
                              <th>Produk Simpanan</th>
                              <th class="text-right">Saldo Riil</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${(selectedMember.savings_accounts || []).map(acc => `
                              <tr>
                                <td>${acc.account_number}</td>
                                <td>${ACCOUNT_TYPE_LABELS[acc.account_type] || acc.account_type}</td>
                                <td class="text-right">${fmt(acc.balance)}</td>
                              </tr>
                            `).join('')}
                            <tr class="total-row">
                              <td colspan="2" class="text-right">TOTAL PORTFOLIO SIMPANAN</td>
                              <td class="text-right">${fmt(totalSimpanan)}</td>
                            </tr>
                          </tbody>
                        </table>

                        <!-- 2. UTANG PEMBIAYAAN -->
                        <div class="section-title">II. Portofolio Kewajiban Pembiayaan (Utang Anggota)</div>
                        <table>
                          <thead>
                            <tr>
                              <th>Produk Pembiayaan</th>
                              <th>Tenor</th>
                              <th>Status Kontrak</th>
                              <th class="text-right">Plafon Pembiayaan</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${contracts.length === 0 ? `
                              <tr><td colspan="4" style="text-align: center;">Tidak ada kewajiban pembiayaan aktif.</td></tr>
                            ` : contracts.map(c => `
                              <tr>
                                <td>${CONTRACT_TYPE_LABELS[c.type] || c.type}</td>
                                <td>${c.tenor_months} Bulan</td>
                                <td>${c.status === 'active' ? 'AKTIF' : c.status.toUpperCase()}</td>
                                <td class="text-right">${fmt(c.amount)}</td>
                              </tr>
                            `).join('')}
                            <tr class="total-row">
                              <td colspan="3" class="text-right">TOTAL KEWAJIBAN PEMBIAYAAN</td>
                              <td class="text-right">${fmt(totalUtangPembiayaan)}</td>
                            </tr>
                          </tbody>
                        </table>

                        <!-- 3. RINGKASAN NERACA BERSIH -->
                        <div class="section-title">III. Ringkasan Neraca Bersih Anggota</div>
                        <table style="font-size: 12px; font-weight: bold;">
                          <tr>
                            <td>TOTAL ASET (SIMPANAN)</td>
                            <td class="text-right" style="color: green;">${fmt(totalSimpanan)}</td>
                          </tr>
                          <tr>
                            <td>TOTAL KEWAJIBAN (UTANG PEMBIAYAAN)</td>
                            <td class="text-right" style="color: red;">${fmt(totalUtangPembiayaan)}</td>
                          </tr>
                          <tr class="total-row" style="background-color: #e2e8f0;">
                            <td>NERACA BERSIH (NET WORTH)</td>
                            <td class="text-right">${fmt(netWorth)}</td>
                          </tr>
                        </table>

                        <!-- 4. MUTASI HISTORI TABUNGAN -->
                        <div class="section-title">IV. Histori Mutasi Buku Tabungan (5 Terakhir)</div>
                        <table>
                          <thead>
                            <tr>
                              <th>Waktu</th>
                              <th>No. Referensi</th>
                              <th>Produk Simpanan</th>
                              <th>Jenis Transaksi</th>
                              <th class="text-right">Nominal</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${mutasi.slice(0, 5).map(item => `
                              <tr>
                                <td>${new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                <td>${item.reference_no}</td>
                                <td>${ACCOUNT_TYPE_LABELS[item.savings_accounts?.account_type] || item.savings_accounts?.account_type || ''}</td>
                                <td>${item.transaction_type === 'deposit' ? 'SETORAN' : 'PENARIKAN'}</td>
                                <td class="text-right">${item.transaction_type === 'deposit' ? '+' : '-'}${fmt(item.amount)}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>

                        <div class="line" style="margin-top: 40px;"></div>
                        <div style="text-align: center; font-size: 10px;">Laporan ini dicetak secara sah melalui sistem inti perbankan Koperasi Syariah IQ-RA.</div>
                        <script>window.print(); window.onafterprint = function() { window.close(); }</script>
                      </body>
                    </html>
                  `);
                  printWin.document.close();
                }}
                style={{
                  background: '#f3c653', border: 'none', borderRadius: '10px',
                  padding: '12px 20px', color: '#02130e', fontWeight: 900, fontSize: '14px', cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(243,198,83,0.2)'
                }}
              >
                Cetak Laporan Konsolidasi Normatif
              </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-page)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
              {([
                { key: 'simpanan', label: 'Tabungan & Mutasi' },
                { key: 'pembiayaan', label: 'Utang Pembiayaan' },
                { key: 'konsolidasi', label: 'Ringkasan Konsolidasi' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: '8px', cursor: 'pointer', border: 'none',
                    background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
                    color: activeTab === tab.key ? '#f3c653' : 'var(--text-secondary)',
                    fontWeight: 800, fontSize: '14px', transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT 1: TABUNGAN & MUTASI */}
            {activeTab === 'simpanan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {loadingMutasi ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px', fontSize: '15px' }}>Memuat mutasi rekening...</div>
                ) : mutasi.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '45px', border: '1px dashed var(--border-primary)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>Belum ada histori mutasi untuk anggota ini.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-primary)', borderRadius: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800 }}>Waktu</th>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800 }}>Referensi</th>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800 }}>Produk</th>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800 }}>Jenis</th>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800, textAlign: 'right' }}>Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mutasi.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: idx === mutasi.length - 1 ? 'none' : '1px solid var(--border-primary)' }}>
                            <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px' }}>
                              {item.reference_no}
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: 700 }}>
                              {ACCOUNT_TYPE_LABELS[item.savings_accounts?.account_type] || item.savings_accounts?.account_type}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                fontSize: '12px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px',
                                background: item.transaction_type === 'deposit' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                                color: item.transaction_type === 'deposit' ? '#4ade80' : '#f87171'
                              }}>
                                {item.transaction_type === 'deposit' ? 'SETORAN' : 'PENARIKAN'}
                              </span>
                            </td>
                            <td style={{
                              padding: '14px 18px', textAlign: 'right', fontWeight: 900,
                              color: item.transaction_type === 'deposit' ? '#4ade80' : '#f87171'
                            }}>
                              {item.transaction_type === 'deposit' ? '+' : '-'}{fmt(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: UTANG PEMBIAYAAN */}
            {activeTab === 'pembiayaan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {loadingContracts ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px', fontSize: '15px' }}>Memuat data pembiayaan...</div>
                ) : contracts.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '45px', border: '1px dashed var(--border-primary)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>Tidak ada kontrak pembiayaan aktif untuk anggota ini.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-primary)', borderRadius: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800 }}>Tipe Akad</th>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800 }}>Tenor</th>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800 }}>Margin</th>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800 }}>Status</th>
                          <th style={{ padding: '14px 18px', color: '#f3c653', fontWeight: 800, textAlign: 'right' }}>Plafon (Utang)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.map((c, idx) => (
                          <tr key={c.id} style={{ borderBottom: idx === contracts.length - 1 ? 'none' : '1px solid var(--border-primary)' }}>
                            <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: 800 }}>
                              {CONTRACT_TYPE_LABELS[c.type] || c.type}
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                              {c.tenor_months} Bulan
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {(c.margin_ratio * 100).toFixed(1)}%
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                fontSize: '12px', fontWeight: 900, padding: '4px 8px', borderRadius: '6px',
                                background: c.status === 'active' ? 'rgba(74,222,128,0.1)' : 'rgba(243,198,83,0.1)',
                                color: c.status === 'active' ? '#4ade80' : '#f3c653'
                              }}>
                                {c.status === 'active' ? 'AKTIF' : c.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 900, color: '#f87171' }}>
                              {fmt(c.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: RINGKASAN KONSOLIDASI */}
            {activeTab === 'konsolidasi' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portofolio Aset Tabungan</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#4ade80' }}>{fmt(totalSimpanan)}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Terdiri dari {selectedMember.savings_accounts?.length || 0} Rekening</div>
                </div>
                <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portofolio Utang Pembiayaan</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#fca5a5' }}>{fmt(totalUtangPembiayaan)}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Terdiri dari {contracts.length} Akad Pembiayaan</div>
                </div>
                <div style={{ gridColumn: 'span 2', background: 'rgba(243,198,83,0.04)', border: '2px solid rgba(243,198,83,0.2)', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase' }}>Posisi Neraca Bersih Anggota (Net Worth)</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Selisih portofolio simpanan riil dikurangi kewajiban pembiayaan</div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: netWorth >= 0 ? '#4ade80' : '#f87171' }}>
                    {netWorth >= 0 ? '+' : ''}{fmt(netWorth)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Member Card */}
      <div style={{ width: '360px', flexShrink: 0 }}>
        {selectedMember ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Profile Card */}
            <div style={{ background: 'var(--bg-card)', border: '2px solid rgba(243,198,83,0.3)', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '68px', height: '68px', borderRadius: '18px',
                  background: 'linear-gradient(135deg, #f3c653, #cca334)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: 900, color: '#02130e', flexShrink: 0
                }}>{initials(selectedMember.users?.full_name)}</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>{selectedMember.users?.full_name}</h4>
                  <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: 800, marginTop: '4px' }}>● AKTIF</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>NIK</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{selectedMember.nik}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Email</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px', textAlign: 'right', maxWidth: '200px', wordBreak: 'break-all' }}>{selectedMember.users?.email}</span>
                </div>
                {selectedMember.phone_number && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>WhatsApp</span>
                    <span style={{ fontWeight: 800 }}>{selectedMember.phone_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Savings Accounts Summary */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#f3c653', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Rekening Simpanan
              </div>
              {loadingAccounts ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', fontSize: '14px' }}>Memuat...</div>
              ) : selectedMember.savings_accounts && selectedMember.savings_accounts.length > 0 ? (
                selectedMember.savings_accounts.map(acc => (
                  <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-primary)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{ACCOUNT_TYPE_LABELS[acc.account_type] || acc.account_type}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{acc.account_number}</div>
                    </div>
                    <div style={{ fontWeight: 900, color: '#4ade80', fontSize: '15px' }}>{fmt(acc.balance)}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '16px' }}>Tidak ada rekening simpanan.</div>
              )}
            </div>

            {/* Financing Accounts Summary */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#f3c653', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Pembiayaan Aktif
              </div>
              {loadingContracts ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', fontSize: '14px' }}>Memuat...</div>
              ) : contracts.length > 0 ? (
                contracts.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-primary)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{CONTRACT_TYPE_LABELS[c.type] || c.type}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.tenor_months} bln • {c.status === 'active' ? 'Aktif' : c.status}</div>
                    </div>
                    <div style={{ fontWeight: 900, color: '#fca5a5', fontSize: '15px' }}>{fmt(c.amount)}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '16px' }}>Tidak ada kewajiban pembiayaan.</div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'deposit', label: 'Setoran Tunai', hint: '[3]', color: '#4ade80' },
                { key: 'withdrawal', label: 'Penarikan Tunai', hint: '[4]', color: '#fca5a5' },
                { key: 'payment', label: 'Bayar Angsuran', hint: '[5]', color: '#f3c653' },
              ].map(btn => (
                <button key={btn.key} onClick={() => onGoToPanel(btn.key)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px', background: 'var(--border-primary)',
                  border: `1.5px solid ${btn.color}22`, borderRadius: '12px',
                  color: btn.color, fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
                }}
                  onMouseOver={e => { e.currentTarget.style.background = `${btn.color}18`; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--border-primary)'; }}
                >
                  <span>{btn.label}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', opacity: 0.7 }}>{btn.hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '2px dashed var(--border-primary)', borderRadius: '20px', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '15px' }}>Pilih anggota dari daftar kiri untuk melihat profil lengkap.</div>
          </div>
        )}
      </div>
    </div>
  );
}

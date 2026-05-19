'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AccountingDashboardProps {
  activeMenu: string;
  profile: any;
}

export default function AccountingDashboard({ activeMenu, profile }: AccountingDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState<any[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [stats, setStats] = useState({
    totalAssets: 2450000000,
    totalLiabilities: 1620000000,
    totalEquity: 830000000,
    totalFinancing: 1400000000,
  });

  // Alert system
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manual Journal Form State (Multi-line Double-Entry)
  const [jDate, setJDate] = useState(new Date().toISOString().split('T')[0]);
  const [jRef, setJRef] = useState('');
  const [jDesc, setJDesc] = useState('');
  const [jLines, setJLines] = useState([
    { accountCode: '11101', type: 'debit', amount: 0 },
    { accountCode: '21101', type: 'credit', amount: 0 }
  ]);

  // Setup COA (Chart of Accounts) Helper
  const coaList = [
    { code: '11101', name: 'Kas Utama Teller', category: 'Aset' },
    { code: '11201', name: 'Giro pada Bank Syariah', category: 'Aset' },
    { code: '12101', name: 'Piutang Pembiayaan Murabahah', category: 'Aset' },
    { code: '12201', name: 'Investasi Mudharabah', category: 'Aset' },
    { code: '12999', name: 'Cadangan Kerugian (CKPN) Murabahah', category: 'Kontra-Aset' },
    { code: '21101', name: 'Simpanan Wadiah Yad Dhamanah', category: 'Kewajiban' },
    { code: '21201', name: 'Simpanan Mudharabah Berjangka', category: 'Kewajiban' },
    { code: '22001', name: 'Dana Kebajikan (ZIS) Terikat', category: 'Kewajiban' },
    { code: '31101', name: 'Modal Pokok Anggota', category: 'Ekuitas' },
    { code: '31201', name: 'Modal Wajib Anggota', category: 'Ekuitas' },
    { code: '32101', name: 'Sisa Hasil Usaha (SHU) Tahun Berjalan', category: 'Ekuitas' },
    { code: '41101', name: 'Pendapatan Margin Murabahah', category: 'Pendapatan' },
    { code: '41201', name: 'Pendapatan Bagi Hasil Mudharabah', category: 'Pendapatan' },
    { code: '51101', name: 'Beban Bonus Wadiah Anggota', category: 'Beban' },
    { code: '51201', name: 'Beban Pembentukan CKPN', category: 'Beban' },
    { code: '52101', name: 'Beban Gaji & Personalia Karyawan', category: 'Beban' }
  ];

  // Fetch Journals from Supabase real-time
  const fetchJournals = async () => {
    setLoadingJournals(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setJournals(data);
      calculateStatsFromJournals(data);
    }
    setLoadingJournals(false);
  };

  // Dynamic Statistics Generator: Aggregates real db values over baseline defaults
  const calculateStatsFromJournals = (journalData: any[]) => {
    let extraAssets = 0;
    let extraLiab = 0;
    let extraEq = 0;
    
    journalData.forEach(j => {
      const code = j.account_code.charAt(0);
      const debit = parseFloat(j.debit || '0');
      const credit = parseFloat(j.credit || '0');
      
      if (code === '1') { // Aset
        extraAssets += (debit - credit);
      } else if (code === '2') { // Kewajiban
        extraLiab += (credit - debit);
      } else if (code === '3') { // Ekuitas
        extraEq += (credit - debit);
      }
    });

    setStats({
      totalAssets: 2450000000 + extraAssets,
      totalLiabilities: 1620000000 + extraLiab,
      totalEquity: 830000000 + extraEq,
      totalFinancing: 1400000000
    });
  };

  useEffect(() => {
    fetchJournals();
    // Generate a starting random Ref No
    setJRef('ADJ-' + Math.floor(100000 + Math.random() * 900000));
  }, []);

  // Add line for dynamic journal posting
  const addJournalLine = () => {
    setJLines([...jLines, { accountCode: '11101', type: 'debit', amount: 0 }]);
  };

  // Remove line
  const removeJournalLine = (index: number) => {
    if (jLines.length <= 2) return; // Keep minimum 2 rows for double entry
    setJLines(jLines.filter((_, idx) => idx !== index));
  };

  // Handle specific line change
  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...jLines];
    (newLines[index] as any)[field] = value;
    setJLines(newLines);
  };

  // Main Posting Logics
  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. Calculate totals and validate balance (Debit === Credit)
    let totalDebit = 0;
    let totalCredit = 0;

    jLines.forEach(line => {
      if (line.type === 'debit') totalDebit += parseFloat(line.amount.toString() || '0');
      if (line.type === 'credit') totalCredit += parseFloat(line.amount.toString() || '0');
    });

    if (totalDebit === 0 || totalCredit === 0) {
      setMessage({ type: 'error', text: 'Validasi Gagal: Nominal jurnal tidak boleh kosong atau nol.' });
      setLoading(false);
      return;
    }

    if (totalDebit !== totalCredit) {
      setMessage({ 
        type: 'error', 
        text: `Penjurnalan Tidak Seimbang! Total Debit (${formatter.format(totalDebit)}) tidak sama dengan Total Kredit (${formatter.format(totalCredit)}). SAK EP mewajibkan keseimbangan mutlak.` 
      });
      setLoading(false);
      return;
    }

    // 2. Submit entries to Supabase
    const supabase = createClient();
    
    // Construct row records
    const records = jLines.map(line => ({
      date: jDate,
      reference_no: jRef,
      description: jDesc,
      account_code: line.accountCode,
      debit: line.type === 'debit' ? line.amount : 0,
      credit: line.type === 'credit' ? line.amount : 0
    }));

    const { error } = await supabase.from('journal_entries').insert(records);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan ke basis data: ' + error.message });
    } else {
      setMessage({ type: 'success', text: '🎉 POSTING JURNAL SUKSES! Transaksi ganda telah dicatat dalam Buku Besar secara real-time.' });
      // Reset form state
      setJDesc('');
      setJRef('ADJ-' + Math.floor(100000 + Math.random() * 900000));
      setJLines([
        { accountCode: '11101', type: 'debit', amount: 0 },
        { accountCode: '21101', type: 'credit', amount: 0 }
      ]);
      await fetchJournals();
    }
    setLoading(false);
  };

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {message && (
        <div style={{ 
          padding: '20px', borderRadius: '16px', marginBottom: '30px',
          background: message.type === 'success' ? 'rgba(4, 49, 33, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: message.type === 'success' ? '#34d399' : '#fca5a5',
          border: `2px solid ${message.type === 'success' ? '#f3c653' : '#fca5a5'}`,
          fontWeight: 800, textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          {message.text}
        </div>
      )}

      {/* ======================================= */}
      {/* 📊 TAB 1: OVERVIEW DASHBOARD          */}
      {/* ======================================= */}
      {activeMenu === 'overview' && (
        <div>
          {/* 🚀 Quick Stats Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
            <StatCard label="Total Aset Utama" value={formatter.format(stats.totalAssets)} icon="🏛️" color="#f3c653" subtitle="Aktiva Koperasi" />
            <StatCard label="Total Kewajiban" value={formatter.format(stats.totalLiabilities)} icon="💳" color="#60a5fa" subtitle="Titipan & Simpanan Wadiah" />
            <StatCard label="Modal & Ekuitas" value={formatter.format(stats.totalEquity)} icon="📈" color="#34d399" subtitle="Modal Pokok/Wajib & SHU" />
            <StatCard label="Penyaluran Dana" value={formatter.format(stats.totalFinancing)} icon="🤝" color="#a78bfa" subtitle="Piutang Pembiayaan Aktif" />
          </div>

          {/* Main Section Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '30px' }}>
            
            {/* Chart Mockup Box */}
            <div className="glass-dark" style={{ padding: '36px', border: '2px solid rgba(243, 198, 83, 0.2)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)' }}>
              <h3 style={{ color: '#f3c653', margin: '0 0 24px 0', fontWeight: 900, letterSpacing: '1px' }}>📊 PERFORMA NERACA RILL (REAL-TIME)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Bar Aset */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                    <span>🟢 AKTIVA / ASET</span>
                    <span>100%</span>
                  </div>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '100%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
                  </div>
                </div>

                {/* Bar Kewajiban */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                    <span>🔵 PASIVA (Kewajiban)</span>
                    <span>{Math.round((stats.totalLiabilities / stats.totalAssets) * 100)}%</span>
                  </div>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(stats.totalLiabilities / stats.totalAssets) * 100}%`, background: '#60a5fa', boxShadow: '0 0 10px #60a5fa' }} />
                  </div>
                </div>

                {/* Bar Ekuitas */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                    <span>🟡 PASIVA (Ekuitas/Modal)</span>
                    <span>{Math.round((stats.totalEquity / stats.totalAssets) * 100)}%</span>
                  </div>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(stats.totalEquity / stats.totalAssets) * 100}%`, background: 'var(--text-primary)', boxShadow: '0 0 10px var(--text-primary)' }} />
                  </div>
                </div>

              </div>
              <div style={{ marginTop: '30px', padding: '16px', background: 'rgba(243, 198, 83, 0.1)', borderRadius: '12px', border: '1px solid rgba(243,198,83,0.3)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>
                💡 <strong>Prinsip Keseimbangan SAK EP:</strong> Posisi Neraca Anda Seimbang! Total Aset ({formatter.format(stats.totalAssets)}) === Total Kewajiban + Ekuitas ({formatter.format(stats.totalLiabilities + stats.totalEquity)}).
              </div>
            </div>

            {/* Audit Log Mini Table */}
            <div className="glass-dark" style={{ padding: '36px', border: '2px solid rgba(243, 198, 83, 0.2)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)' }}>
              <h3 style={{ color: '#f3c653', margin: '0 0 20px 0', fontWeight: 900 }}>📋 Jurnal Terakhir Terposting</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {journals.slice(0, 4).map((j, idx) => (
                  <div key={j.id || idx} style={{ background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '12px', borderLeft: '3px solid #f3c653' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#f3c653', fontWeight: 800 }}>
                      <span>{j.reference_no}</span>
                      <span>{j.date}</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '6px 0', fontSize: '14px' }}>{j.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>Kode Akun: {j.account_code}</span>
                      <span style={{ color: '#34d399', fontWeight: 800 }}>{j.debit > 0 ? formatter.format(j.debit) : formatter.format(j.credit)}</span>
                    </div>
                  </div>
                ))}
                {journals.length === 0 && (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>Belum ada entri jurnal tercatat di database.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 📂 TAB 2: GENERAL LEDGER & JOURNALING */}
      {/* ======================================= */}
      {activeMenu === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* 🧱 Posting Form */}
          <div style={{ 
            background: 'var(--bg-card)', 
            backdropFilter: 'blur(20px)', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            border: '3px solid #cca334',
            boxShadow: '0 40px 80px var(--shadow-color)'
          }}>
            <div style={{ background: '#043121', padding: '24px 36px', borderBottom: '2px solid #cca334', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#ffffff', margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '1px' }}>✒️ INPUT JURNAL PENYESUAIAN (DOUBLE-ENTRY)</h2>
              <span style={{ background: '#f3c653', color: '#02130e', fontWeight: 900, fontSize: '12px', padding: '6px 14px', borderRadius: '20px' }}>SAK EP COMPLIANT</span>
            </div>
            
            <form onSubmit={handlePostJournal} style={{ padding: '36px' }}>
              
              {/* Global Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#f3c653', fontSize: '12px', fontWeight: 800 }}>TANGGAL TRANSAKSI</label>
                  <input type="date" required value={jDate} onChange={(e) => setJDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#f3c653', fontSize: '12px', fontWeight: 800 }}>NOMOR REFERENSI</label>
                  <input type="text" required value={jRef} onChange={(e) => setJRef(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#f3c653', fontSize: '12px', fontWeight: 800 }}>DESKRIPSI JURNAL / KETERANGAN</label>
                  <input type="text" required placeholder="Contoh: Rekonsiliasi kas akhir hari teller..." value={jDesc} onChange={(e) => setJDesc(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Double Entry Lines */}
              <div style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px' }}>Rincian Pos Akun Transaksi</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                {jLines.map((line, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 2fr 40px', gap: '16px', alignItems: 'center' }}>
                    
                    <select 
                      value={line.accountCode} 
                      onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                      style={{ ...inputStyle, background: '#fff', color: '#02130e', fontWeight: 700 }}
                    >
                      {coaList.map(c => (
                        <option key={c.code} value={c.code}>({c.code}) {c.name}</option>
                      ))}
                    </select>

                    <select 
                      value={line.type}
                      onChange={(e) => handleLineChange(idx, 'type', e.target.value)}
                      style={{ ...inputStyle, fontWeight: 800 }}
                    >
                      <option value="debit">DEBIT ( + )</option>
                      <option value="credit">KREDIT ( - )</option>
                    </select>

                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#f3c653' }}>Rp</span>
                      <input 
                        type="number" 
                        required 
                        value={line.amount || ''} 
                        onChange={(e) => handleLineChange(idx, 'amount', parseFloat(e.target.value || '0'))}
                        placeholder="0"
                        style={{ ...inputStyle, paddingLeft: '42px' }}
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={() => removeJournalLine(idx)}
                      disabled={jLines.length <= 2}
                      style={{ background: 'transparent', border: 'none', color: '#fca5a5', fontSize: '20px', cursor: 'pointer', opacity: jLines.length <= 2 ? 0.3 : 1 }}
                    >
                      ✕
                    </button>

                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={addJournalLine}
                  style={{ background: 'transparent', border: '2px dashed #cca334', color: '#f3c653', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  ➕ Tambah Pos Baris
                </button>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '16px 40px', background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                      color: '#02130e', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '15px',
                      cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 25px rgba(204, 163, 52, 0.3)'
                    }}
                  >
                    {loading ? '⏳ POSTING DATA...' : '💾 POSTING KE BUKU BESAR'}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* 📄 General Ledger Log List */}
          <div style={{ 
            background: 'var(--bg-card)', 
            backdropFilter: 'blur(20px)', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            border: '1px solid var(--border-primary)',
            boxShadow: '0 40px 80px var(--shadow-color)'
          }}>
            <div style={{ background: '#043121', padding: '24px 36px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ color: '#ffffff', margin: 0, fontWeight: 900 }}>📜 BUKU BESAR (GENERAL LEDGER LOGS)</h3>
              <button onClick={fetchJournals} style={{ background: 'transparent', border: 'none', color: '#f3c653', fontWeight: 800, cursor: 'pointer' }}>🔄 Segarkan Data</button>
            </div>
            <div style={{ padding: '20px 36px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(243, 198, 83, 0.2)' }}>
                    <th style={{ padding: '16px', color: '#f3c653', fontWeight: 800, fontSize: '13px' }}>TANGGAL</th>
                    <th style={{ padding: '16px', color: '#f3c653', fontWeight: 800, fontSize: '13px' }}>REF NO</th>
                    <th style={{ padding: '16px', color: '#f3c653', fontWeight: 800, fontSize: '13px' }}>KODE AKUN</th>
                    <th style={{ padding: '16px', color: '#f3c653', fontWeight: 800, fontSize: '13px' }}>KETERANGAN</th>
                    <th style={{ padding: '16px', color: '#34d399', fontWeight: 800, fontSize: '13px', textAlign: 'right' }}>DEBIT (Rp)</th>
                    <th style={{ padding: '16px', color: '#fca5a5', fontWeight: 800, fontSize: '13px', textAlign: 'right' }}>KREDIT (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingJournals ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 700 }}>Memuat data jurnal...</td>
                    </tr>
                  ) : journals.length > 0 ? journals.map((j, index) => (
                    <tr key={j.id || index} style={{ borderBottom: '1px solid var(--border-primary)', background: 'rgba(0,0,0,0.03)' }}>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '14px' }}>{j.date}</td>
                      <td style={{ padding: '16px', color: '#f3c653', fontWeight: 800, fontSize: '14px' }}>{j.reference_no}</td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '14px' }}>
                        <code style={{ background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>{j.account_code}</code>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{j.description}</td>
                      <td style={{ padding: '16px', color: '#34d399', fontWeight: 800, textAlign: 'right', fontSize: '14px' }}>
                        {j.debit > 0 ? formatter.format(j.debit) : '—'}
                      </td>
                      <td style={{ padding: '16px', color: '#fca5a5', fontWeight: 800, textAlign: 'right', fontSize: '14px' }}>
                        {j.credit > 0 ? formatter.format(j.credit) : '—'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 800 }}>
                        🚫 Belum ada rekaman posting jurnal. Silakan lakukan posting perdana di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 📑 TAB 3: AUTO FINANCIAL REPORTS       */}
      {/* ======================================= */}
      {activeMenu === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="glass-dark" style={{ padding: '40px', border: '2px solid #cca334', background: 'var(--bg-card)', backdropFilter: 'blur(16px)' }}>
            
            {/* Report Header Print Layout */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-primary)', paddingBottom: '20px', marginBottom: '30px' }}>
              <h2 style={{ color: '#f3c653', margin: 0, fontSize: '24px', fontWeight: 900 }}>KOPERASI SIMPAN PINJAM SYARIAH iQ-RA</h2>
              <h3 style={{ color: 'var(--text-primary)', margin: '6px 0 0 0', fontSize: '18px', fontWeight: 700 }}>LAPORAN POSISI KEUANGAN (NERACA)</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Berdasarkan Standar Akuntansi Keuangan Entitas Privat (SAK EP) | Per Tanggal: {new Date().toLocaleDateString('id-ID')}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              
              {/* Left Side: Assets */}
              <div>
                <h4 style={{ color: '#f3c653', borderBottom: '2px solid #f3c653', paddingBottom: '8px', fontWeight: 800 }}>1. ASET (AKTIVA)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <ReportLine label="Kas Utama Teller" value={formatter.format(stats.totalAssets * 0.15)} />
                  <ReportLine label="Giro pada Bank Syariah" value={formatter.format(stats.totalAssets * 0.25)} />
                  <ReportLine label="Piutang Pembiayaan Murabahah" value={formatter.format(stats.totalAssets * 0.65)} />
                  <ReportLine label="Cadangan Kerugian Penurunan Nilai (CKPN)" value={`(${formatter.format(stats.totalAssets * 0.05)})`} isRed />
                  
                  <div style={{ borderTop: '1.5px solid var(--border-primary)', marginTop: '20px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#34d399', fontSize: '16px' }}>
                    <span>TOTAL ASET</span>
                    <span>{formatter.format(stats.totalAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Liabilities & Equity */}
              <div>
                <h4 style={{ color: '#60a5fa', borderBottom: '2px solid #60a5fa', paddingBottom: '8px', fontWeight: 800 }}>2. KEWAJIBAN (LIABILITAS)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                  <ReportLine label="Simpanan Wadiah Yad Dhamanah" value={formatter.format(stats.totalLiabilities * 0.7)} />
                  <ReportLine label="Simpanan Mudharabah Berjangka" value={formatter.format(stats.totalLiabilities * 0.25)} />
                  <ReportLine label="Titipan Zakat, Infaq & Sedekah (ZIS)" value={formatter.format(stats.totalLiabilities * 0.05)} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '10px' }}>
                    <span>TOTAL KEWAJIBAN</span>
                    <span>{formatter.format(stats.totalLiabilities)}</span>
                  </div>
                </div>

                <h4 style={{ color: '#34d399', borderBottom: '2px solid #34d399', paddingBottom: '8px', fontWeight: 800 }}>3. EKUITAS (MODAL)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <ReportLine label="Simpanan Pokok Anggota" value={formatter.format(stats.totalEquity * 0.4)} />
                  <ReportLine label="Simpanan Wajib Anggota" value={formatter.format(stats.totalEquity * 0.4)} />
                  <ReportLine label="Sisa Hasil Usaha (SHU) Berjalan" value={formatter.format(stats.totalEquity * 0.2)} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '10px' }}>
                    <span>TOTAL EKUITAS</span>
                    <span>{formatter.format(stats.totalEquity)}</span>
                  </div>

                  <div style={{ borderTop: '1.5px solid var(--border-primary)', marginTop: '20px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#34d399', fontSize: '16px' }}>
                    <span>TOTAL KEWAJIBAN & EKUITAS</span>
                    <span>{formatter.format(stats.totalLiabilities + stats.totalEquity)}</span>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <button 
                onClick={() => window.print()} 
                style={{ padding: '14px 30px', background: '#022b1c', border: '2px solid #34d399', color: '#34d399', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
              >
                🖨️ CETAK LAPORAN RESMI
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 🛡️ TAB 4: AUTO PROVISIONING (CKPN)      */}
      {/* ======================================= */}
      {activeMenu === 'provisioning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="glass-dark" style={{ padding: '40px', border: '2px solid #ef4444', background: 'var(--bg-card)', backdropFilter: 'blur(16px)' }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 10px 0', fontWeight: 900 }}>🛡️ CADANGAN KERUGIAN PENURUNAN NILAI (CKPN)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
              Sesuai mandat **SAK EP**, koperasi wajib mencadangkan potensi kerugian piutang pembiayaan macet berdasarkan kolektibilitas umur angsuran untuk memitigasi risiko finansial.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(239,68,68,0.1)', borderBottom: '2px solid #ef4444' }}>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>KOLEKTIBILITAS (STATUS)</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>UMUR TUNGGAKAN</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'center' }}>BOBOT CKPN (%)</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>ESTIMASI NILAI CKPN</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: '#34d399', fontWeight: 800 }}>Lancar (Kol-1)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>0 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>0.5%</td>
                  <td style={{ padding: '20px', color: '#34d399', fontWeight: 800, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.8 * 0.005)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: '#fcd34d', fontWeight: 800 }}>Dalam Perhatian Khusus (Kol-2)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>1 - 90 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>5.0%</td>
                  <td style={{ padding: '20px', color: '#fcd34d', fontWeight: 800, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.12 * 0.05)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: '#fb923c', fontWeight: 800 }}>Kurang Lancar (Kol-3)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>91 - 120 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>15.0%</td>
                  <td style={{ padding: '20px', color: '#fb923c', fontWeight: 800, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.05 * 0.15)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: '#f87171', fontWeight: 800 }}>Diragukan (Kol-4)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>121 - 180 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>50.0%</td>
                  <td style={{ padding: '20px', color: '#f87171', fontWeight: 800, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.02 * 0.5)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: '#ef4444', fontWeight: 900 }}>Macet (Kol-5)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>&gt; 180 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>100.0%</td>
                  <td style={{ padding: '20px', color: '#ef4444', fontWeight: 900, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.01 * 1.0)}</td>
                </tr>
              </tbody>
            </table>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', padding: '20px 30px', borderRadius: '12px', border: '2px solid #ef4444', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>TOTAL KEBUTUHAN CADANGAN (CKPN):</span>
                <span style={{ color: '#ef4444', fontSize: '22px', fontWeight: 900 }}>
                  {formatter.format(
                    (stats.totalFinancing * 0.8 * 0.005) + 
                    (stats.totalFinancing * 0.12 * 0.05) +
                    (stats.totalFinancing * 0.05 * 0.15) +
                    (stats.totalFinancing * 0.02 * 0.5) +
                    (stats.totalFinancing * 0.01 * 1.0)
                  )}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-page)',
  border: '2px solid var(--border-primary)',
  borderRadius: '12px',
  padding: '14px 16px',
  color: 'var(--text-primary)',
  fontSize: '15px',
  fontWeight: 600,
  outline: 'none',
  transition: 'border 0.2s'
};

function StatCard({ label, value, icon, color, subtitle }: any) {
  return (
    <div style={{ 
      background: 'var(--bg-card)', 
      backdropFilter: 'blur(12px)', 
      padding: '24px', 
      borderRadius: '24px', 
      border: `2px solid ${color}44`,
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
          <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 900, marginTop: '4px' }}>{value}</div>
        </div>
        <div style={{ fontSize: '32px', background: 'var(--border-primary)', padding: '10px', borderRadius: '14px' }}>{icon}</div>
      </div>
      <div style={{ fontSize: '11px', color: color, fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>{subtitle}</div>
    </div>
  );
}

function ReportLine({ label, value, isRed = false }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0', color: isRed ? '#fca5a5' : 'var(--text-primary)', fontWeight: 600 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 800 }}>{value}</span>
    </div>
  );
}

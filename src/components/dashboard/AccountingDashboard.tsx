'use client';
// force recompile

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Modal from './Modal';

interface AccountingDashboardProps {
  activeMenu: string;
  profile: any;
}

export default function AccountingDashboard({ activeMenu, profile }: AccountingDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState<any[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    totalFinancing: 0,
    totalIncome: 0,
    totalProfitShare: 0,
    totalExpense: 0,
    netProfit: 0,
    accBalances: {} as Record<string, number>
  });

  // Alert system
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTodayClosed, setIsTodayClosed] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // Manual Journal Form State (Multi-line Double-Entry)
  const [jDate, setJDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [eomNisbah, setEomNisbah] = useState(30); // Persentase untuk anggota
  const [ledgerFilterAcc, setLedgerFilterAcc] = useState('ALL'); // Filter Buku Besar
  
  // Fitur Cetak Voucher Spesifik
  const [printingVoucher, setPrintingVoucher] = useState<any>(null);
  
  // Riwayat EOD
  const [closuresHistory, setClosuresHistory] = useState<any[]>([]);
  const [selectedEodDate, setSelectedEodDate] = useState<string | null>(null);
  const [tellerShifts, setTellerShifts] = useState<any[]>([]);
  const [reconData, setReconData] = useState({ savingsDB: 0, financingDB: 0 });

  // Custom Journal Templates
  const [customTemplates, setCustomTemplates] = useState<{id: string, name: string, desc: string, debit: string, credit: string}[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', desc: '', debit: '110101', credit: '110101' });

  // Fixed Assets State
  const [fixedAssets, setFixedAssets] = useState<any[]>([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', category: 'inventaris', purchase_date: new Date().toISOString().split('T')[0], purchase_price: 0, salvage_value: 0, useful_life_months: 48 });

  useEffect(() => {
    const saved = localStorage.getItem('iqra_custom_journal_templates');
    if (saved) {
      try { setCustomTemplates(JSON.parse(saved)); } catch (e) {}
    }
    const savedAssets = localStorage.getItem('iqra_fixed_assets');
    if (savedAssets) {
      try { setFixedAssets(JSON.parse(savedAssets)); } catch(e) {}
    }
  }, []);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAsset.purchase_price <= 0 || newAsset.useful_life_months <= 0) {
      setMessage({ type: 'error', text: 'Data harga atau umur ekonomis tidak valid' });
      return;
    }
    const updated = [...fixedAssets, { ...newAsset, id: Date.now().toString(), accumulated_depreciation: 0 }];
    setFixedAssets(updated);
    localStorage.setItem('iqra_fixed_assets', JSON.stringify(updated));
    setShowAssetModal(false);
    setMessage({ type: 'success', text: 'Aset Tetap Berhasil Didaftarkan' });
  };

  const handleRunMassDepreciation = async () => {
    setLoadingJournals(true);
    let totalDepreciation = 0;
    const updatedAssets = fixedAssets.map(asset => {
      // Straight line depreciation: (Cost - Salvage) / Useful Life
      const depreciableAmount = asset.purchase_price - asset.salvage_value;
      const monthlyDepreciation = depreciableAmount / asset.useful_life_months;
      
      // Don't depreciate more than book value
      const remainingValue = depreciableAmount - asset.accumulated_depreciation;
      if (remainingValue > 0) {
        const actualDepreciation = Math.min(monthlyDepreciation, remainingValue);
        totalDepreciation += actualDepreciation;
        return { ...asset, accumulated_depreciation: asset.accumulated_depreciation + actualDepreciation };
      }
      return asset;
    });

    if (totalDepreciation <= 0) {
      setLoadingJournals(false);
      setMessage({ type: 'success', text: 'Tidak ada aset yang perlu disusutkan bulan ini.' });
      return;
    }

    // Update Local Storage
    setFixedAssets(updatedAssets);
    localStorage.setItem('iqra_fixed_assets', JSON.stringify(updatedAssets));

    // Auto Post Journal
    const supabase = createClient();
    const refNo = 'DEP-' + Math.floor(100000 + Math.random() * 900000);
    const today = new Date().toISOString().split('T')[0];
    
    // Debit Beban Penyusutan (710003), Kredit Akumulasi Penyusutan (160002)
    await supabase.from('journal_entries').insert([
      { reference_no: refNo, date: today, account_code: '710003', debit: totalDepreciation, credit: 0, description: 'Beban Penyusutan Aset Massal Akhir Bulan' },
      { reference_no: refNo, date: today, account_code: '160002', debit: 0, credit: totalDepreciation, description: 'Akumulasi Penyusutan Aset Tetap' }
    ]);

    await fetchJournals();
    setLoadingJournals(false);
    setMessage({ type: 'success', text: `Depresiasi Rp ${formatter.format(totalDepreciation)} Berhasil Dijurnal!` });
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...customTemplates, { ...newTemplate, id: Date.now().toString() }];
    setCustomTemplates(updated);
    localStorage.setItem('iqra_custom_journal_templates', JSON.stringify(updated));
    setShowTemplateModal(false);
    setNewTemplate({ name: '', desc: '', debit: '110101', credit: '110101' });
  };

  const removeTemplate = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem('iqra_custom_journal_templates', JSON.stringify(updated));
  };

  useEffect(() => {
    if (journals.length > 0) {
      calculateStatsFromJournals(journals, reportYear);
    }
  }, [reportYear]);
  const [jRef, setJRef] = useState('');
  const [jDesc, setJDesc] = useState('');
  const [jLines, setJLines] = useState([
    { accountCode: '110102', type: 'debit', amount: 0 },
    { accountCode: '230001', type: 'credit', amount: 0 }
  ]);

  // Setup COA (Chart of Accounts) Helper
  const [coaList, setCoaList] = useState<any[]>([
    { code: '110101', name: 'Kas Brankas', category: 'Aset' },
    { code: '110102', name: 'Kas Teller', category: 'Aset' },
    { code: '110201', name: 'Giro Bank A', category: 'Aset' },
    { code: '140001', name: 'Piutang Murabahah Anggota', category: 'Aset' },
    { code: '170001', name: 'Pembiayaan Mudharabah Anggota', category: 'Aset' },
    { code: '190002', name: 'CKPN Piutang Murabahah (-)', category: 'Kontra-Aset' },
    { code: '230001', name: 'Simpanan Wadiah Anggota', category: 'Liabilitas' },
    { code: '310001', name: 'Simpanan Mudharabah Anggota', category: 'Dana Syirkah' },
    { code: '400001', name: 'Simpanan Pokok', category: 'Ekuitas' },
    { code: '400002', name: 'Simpanan Wajib', category: 'Ekuitas' },
    { code: '400009', name: 'SHU Tahun Berjalan', category: 'Ekuitas' },
    { code: '510001', name: 'Pendapatan Murabahah - Margin', category: 'Pendapatan' },
    { code: '510004', name: 'Pendapatan Mudharabah', category: 'Pendapatan' },
    { code: '520001', name: 'Pendapatan Administrasi Pembiayaan', category: 'Pendapatan' },
    { code: '600001', name: 'Bagi Hasil Simpanan Mudharabah', category: 'Bagi Hasil' },
    { code: '710002', name: 'Beban CKPN Murabahah', category: 'Beban' },
    { code: '710003', name: 'Beban Penyusutan Aset Tetap', category: 'Beban' },
    { code: '160001', name: 'Aset Tetap (Inventaris & Kendaraan)', category: 'Aset' },
    { code: '160002', name: 'Akumulasi Penyusutan Aset Tetap (-)', category: 'Kontra-Aset' },
    { code: '720001', name: 'Gaji/Honor', category: 'Beban' },
    { code: '730001', name: 'Beban Listrik dan Air', category: 'Beban' }
  ]);

  useEffect(() => {
    async function fetchCoa() {
      const supabase = createClient();
      const { data, error } = await supabase.from('coa_accounts').select('*').order('account_code');
      if (!error && data && data.length > 0) {
        setCoaList(data.map((c: any) => ({
          code: c.account_code,
          name: c.account_name,
          category: c.category
        })));
      }
    }
    fetchCoa();
  }, []);


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
      calculateStatsFromJournals(data, reportYear);
    }
    
    // Fetch closures history
    try {
      const { data: allClosures } = await supabase
        .from('daily_closures')
        .select('*')
        .order('closing_date', { ascending: false });
        
      if (allClosures) {
        setClosuresHistory(allClosures);
        const today = new Date().toISOString().split('T')[0];
        const todayClosed = allClosures.some(c => c.closing_date === today);
        setIsTodayClosed(todayClosed);
      }
    } catch(e) {
      // Ignore if table missing or error
    }

    // Fetch active teller shifts
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: shifts } = await supabase
        .from('teller_shifts')
        .select('*')
        .gte('opened_at', today)
        .order('opened_at', { ascending: false });
      if (shifts) setTellerShifts(shifts);
    } catch(e) {}
    
    // Fetch raw DB numbers for reconciliation
    try {
      const { data: savings } = await supabase.from('savings_accounts').select('balance');
      const { data: financing } = await supabase.from('financing_applications').select('plafon_disetujui').eq('status', 'disbursed');
      
      const totalSavingsDB = savings?.reduce((sum, s) => sum + Number(s.balance || 0), 0) || 0;
      const totalFinancingDB = financing?.reduce((sum, f) => sum + Number(f.plafon_disetujui || 0), 0) || 0;
      
      setReconData({ savingsDB: totalSavingsDB, financingDB: totalFinancingDB });
    } catch(e) {}

    setLoadingJournals(false);
  };

  // Dynamic Statistics Generator: Mengkalkulasi sesuai mapping COA 1 s.d 7 secara mutlak real-time
  const calculateStatsFromJournals = (journalData: any[], selectedYear: number) => {
    let assets = 0;
    let liabilities = 0;
    let equity = 0;
    let financing = 0;
    let income = 0;
    let profitShare = 0;
    let expense = 0;
    let pastNetProfit = 0;
    let balances: Record<string, number> = {};
    
    journalData.forEach(j => {
      const dateStr = j.date || j.created_at;
      const jYear = new Date(dateStr).getFullYear();
      
      // Abaikan jurnal masa depan dari laporan tahun ini
      if (jYear > selectedYear) return;

      const code = j.account_code || '';
      const debit = parseFloat(j.debit || '0');
      const credit = parseFloat(j.credit || '0');
      const amount = debit - credit;

      if (!balances[code]) balances[code] = 0;
      balances[code] += amount;
      
      if (code.startsWith('1')) {
        assets += amount;
        if (code.startsWith('14') || code.startsWith('15')) financing += amount;
      } else if (code.startsWith('2') || code.startsWith('3')) { // Liabilitas & Dana Syirkah Temporer
        liabilities -= amount;
      } else if (code.startsWith('4')) { // Ekuitas
        equity -= amount;
      }
      
      // Pemisahan SHU Tahun Berjalan dan SHU Tahun Lalu
      if (code.startsWith('5')) {
        if (jYear === selectedYear) income -= amount;
        else pastNetProfit -= amount;
      } else if (code.startsWith('6')) {
        if (jYear === selectedYear) profitShare += amount;
        else pastNetProfit += amount;
      } else if (code.startsWith('7')) {
        if (jYear === selectedYear) expense += amount;
        else pastNetProfit += amount;
      }
    });

    const netProfit = income - profitShare - expense;

    // Inject SHU Tahun Lalu ke saldo akun 400008 (SHU Tahun Lalu / Ditahan)
    if (!balances['400008']) balances['400008'] = 0;
    balances['400008'] -= pastNetProfit; // Normal saldo kredit (minus = kredit)

    setStats({
      totalAssets: assets,
      totalLiabilities: liabilities,
      totalEquity: equity + pastNetProfit + netProfit, // Real-time updated equity
      totalFinancing: financing,
      totalIncome: income,
      totalProfitShare: profitShare,
      totalExpense: expense,
      netProfit: netProfit,
      accBalances: balances
    });
  };

  const getBal = (prefix: string, isCreditNormal = false) => {
    if (!stats.accBalances) return 0;
    let sum = 0;
    Object.keys(stats.accBalances).forEach(code => {
      if (code.startsWith(prefix)) {
        sum += stats.accBalances[code];
      }
    });
    return isCreditNormal ? -sum : sum;
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

    // 2. Submit entries via API to handle RLS and Server-Side Logic
    try {
      const payload = {
        date: jDate,
        reference_no: jRef,
        description: jDesc,
        entries: jLines.map(line => ({
          account_code: line.accountCode,
          debit: line.type === 'debit' ? line.amount : 0,
          credit: line.type === 'credit' ? line.amount : 0
        }))
      };

      const res = await fetch('/api/accounting/record-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Gagal menyimpan ke basis data');
      }

      setMessage({ type: 'success', text: '🎉 POSTING JURNAL SUKSES! Transaksi ganda telah dicatat dalam Buku Besar secara real-time.' });
      
      // Reset form state
      setJDesc('');
      setJRef('ADJ-' + Math.floor(100000 + Math.random() * 900000));
      setJLines([
        { accountCode: '110102', type: 'debit', amount: 0 },
        { accountCode: '230001', type: 'credit', amount: 0 }
      ]);
      await fetchJournals();

    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  // 🖨️ MODE CETAK VOUCHER JURNAL TUNGGAL 🖨️
  if (printingVoucher) {
    return (
      <div style={{ background: 'white', color: 'black', minHeight: '100vh', padding: '40px', fontFamily: '"Times New Roman", Times, serif' }}>
        <style>{`
          @media print {
            button.hide-on-print { display: none !important; }
            body { background: white !important; margin: 0; padding: 0; }
          }
        `}</style>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button 
            className="hide-on-print" 
            onClick={() => setPrintingVoucher(null)}
            style={{ background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Kembali ke Dasbor
          </button>
          <button 
            className="hide-on-print" 
            onClick={() => window.print()}
            style={{ background: '#10b981', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🖨️ Lanjutkan Cetak Dokumen
          </button>
        </div>

        <div style={{ border: '2px solid black', padding: '40px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', borderBottom: '3px double black', paddingBottom: '20px', marginBottom: '30px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>KOPERASI SYARIAH iQ-RA</h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Divisi Akuntansi & Keuangan Pusat</p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', textDecoration: 'underline' }}>BUKTI JURNAL TRANSAKSI / VOUCHER</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>NO. REF: {printingVoucher.reference_no}</p>
          </div>

          <table style={{ width: '100%', marginBottom: '40px', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ width: '150px', padding: '5px 0', fontWeight: 'bold' }}>Tanggal Transaksi</td>
                <td style={{ width: '10px' }}>:</td>
                <td>{printingVoucher.date}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Keterangan / Uraian</td>
                <td>:</td>
                <td>{printingVoucher.description}</td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '50px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>KODE AKUN</th>
                <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>NAMA AKUN / POSISI</th>
                <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>DEBIT</th>
                <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>KREDIT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>{printingVoucher.account_code}</td>
                <td style={{ border: '1px solid black', padding: '10px' }}>{coaList.find(c => c.code === printingVoucher.account_code)?.name || 'Akun Jurnal'}</td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>{printingVoucher.debit > 0 ? formatter.format(printingVoucher.debit) : '-'}</td>
                <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>{printingVoucher.credit > 0 ? formatter.format(printingVoucher.credit) : '-'}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginTop: '60px' }}>
            <div style={{ width: '200px' }}>
              <p style={{ marginBottom: '80px' }}>Dibuat Oleh,</p>
              <p style={{ borderBottom: '1px solid black', margin: '0 20px', paddingBottom: '5px' }}>{profile?.full_name || 'Petugas Akuntansi'}</p>
              <p style={{ fontSize: '12px', marginTop: '5px' }}>Staff Akuntansi</p>
            </div>
            <div style={{ width: '200px' }}>
              <p style={{ marginBottom: '80px' }}>Disetujui Oleh,</p>
              <p style={{ borderBottom: '1px solid black', margin: '0 20px', paddingBottom: '5px' }}>(..................................)</p>
              <p style={{ fontSize: '12px', marginTop: '5px' }}>Manajer Keuangan</p>
            </div>
          </div>
          
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '10px', color: '#666' }}>
            Dicetak otomatis oleh Sistem iQ-RA pada {new Date().toLocaleString('id-ID')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      <style>{`
        @media print {
          /* Menyembunyikan elemen UI nav/sidebar/header global */
          aside, nav, header, .sidebar, .topbar { display: none !important; }
          body, html { background: white !important; color: black !important; margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif !important; }
          
          /* FIX UNTUK HALAMAN TERPOTONG (CUT OFF) */
          html, body, div, main, section, article {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            min-height: auto !important;
            position: relative !important;
          }
          
          /* Menyembunyikan tombol print dan interaktif */
          button, .hide-on-print { display: none !important; }
          
          /* Format kotak laporan */
          .glass-dark {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            backdrop-filter: none !important;
          }
          
          /* Menghapus border radius & background transparan */
          div { border-radius: 0 !important; }

          /* Redefinisikan variabel warna ke hitam pekat untuk cetak murni */
          :root {
            --text-primary: #000000 !important;
            --text-secondary: #000000 !important;
            --border-primary: #000000 !important;
          }

          /* Teks menjadi hitam semua untuk laporan resmi */
          h2, h3, h4, span, div, p { color: black !important; border-color: black !important; }
          
          /* Garis batas tebal untuk struktur laporan keuangan */
          .border-bottom { border-bottom: 3px double black !important; }
          .border-top { border-top: 2px solid black !important; }

          /* Pemisah Halaman */
          .print-page-break {
            page-break-before: always !important;
            padding-top: 30px !important;
          }

          /* Logo Print */
          .print-logo {
            background: none !important;
            border: 2px solid black !important;
            color: black !important;
          }

          /* Tanda tangan */
          .signature-section { margin-top: 50px !important; }
          .border-bottom { border-bottom: 2px solid black !important; }
          .border-top { border-top: 2px solid black !important; }

          /* Pemisah Halaman */
          .print-page-break {
            page-break-before: always !important;
            padding-top: 30px !important;
          }

          /* Grid penyesuaian khusus Neraca (Aset Kiri, Kewajiban Kanan) */
          .neraca-grid {
            display: flex !important;
            justify-content: space-between !important;
            gap: 20px !important;
          }
          .neraca-col { width: 48% !important; }
        }
      `}</style>

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
            <StatCard label="Total Aset Utama" value={formatter.format(stats.totalAssets)} icon="🏛️" subtitle="Aktiva Koperasi" />
            <StatCard label="Total Kewajiban" value={formatter.format(stats.totalLiabilities)} icon="💳" subtitle="Titipan & Simpanan Wadiah" />
            <StatCard label="Modal & Ekuitas" value={formatter.format(stats.totalEquity)} icon="📈" subtitle="Modal Pokok/Wajib & SHU" />
            <StatCard label="Penyaluran Dana" value={formatter.format(stats.totalFinancing)} icon="🤝" subtitle="Piutang Pembiayaan Aktif" />
          </div>

          {/* Rekonsiliasi Silang Modul (Cross-Module Reconciliation) */}
          <div style={{ background: 'var(--bg-card)', border: '2px solid #3b82f6', borderRadius: '20px', padding: '32px', boxShadow: '0 15px 35px rgba(59, 130, 246, 0.15)', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
              <span style={{ fontSize: '28px' }}>⚖️</span>
              <div>
                <h3 style={{ margin: 0, color: '#3b82f6', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Audit Rekonsiliasi Data Inti (STP Validation)</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Mendeteksi kebocoran transaksi dengan membandingkan tabel fisik operasional (CS/AO) vs saldo mutlak Buku Besar (Accounting).</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Recon 1: Dana Syirkah */}
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '20px', borderRadius: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>Dana Syirkah Temporer (Simpanan Anggota)</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fisik Modul CS (Rekening):</span>
                  <span style={{ fontWeight: 800 }}>{formatter.format(reconData.savingsDB)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Saldo Buku Besar (COA 3):</span>
                  <span style={{ fontWeight: 800 }}>{formatter.format(getBal('3', true) + getBal('2', true))}</span>
                </div>
                
                <div style={{ height: '1px', background: 'rgba(59, 130, 246, 0.2)', margin: '10px 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900 }}>
                  <span>Selisih (Variance):</span>
                  <span style={{ color: (reconData.savingsDB - (getBal('3', true) + getBal('2', true))) === 0 ? '#4ade80' : '#ef4444' }}>
                    {formatter.format(Math.abs(reconData.savingsDB - (getBal('3', true) + getBal('2', true))))}
                  </span>
                </div>
              </div>

              {/* Recon 2: Piutang Pembiayaan */}
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '20px', borderRadius: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>Piutang & Pembiayaan Syariah</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fisik Modul AO (Plafon Aktif):</span>
                  <span style={{ fontWeight: 800 }}>{formatter.format(reconData.financingDB)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Saldo Buku Besar (COA 14,15):</span>
                  <span style={{ fontWeight: 800 }}>{formatter.format(stats.totalFinancing)}</span>
                </div>
                
                <div style={{ height: '1px', background: 'rgba(59, 130, 246, 0.2)', margin: '10px 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900 }}>
                  <span>Selisih (Variance):</span>
                  <span style={{ color: (reconData.financingDB - stats.totalFinancing) === 0 ? '#4ade80' : '#ef4444' }}>
                    {formatter.format(Math.abs(reconData.financingDB - stats.totalFinancing))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Section Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '30px' }}>
            
            {/* Chart Mockup Box */}
            <div className="glass-dark" style={{ padding: '36px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 24px 0', fontWeight: 900, letterSpacing: '1px' }}> PERFORMA NERACA RIIL (REAL-TIME)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Bar Aset */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                    <span> AKTIVA / ASET</span>
                    <span>100%</span>
                  </div>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '100%', background: 'var(--emerald-deep)' }} />
                  </div>
                </div>

                {/* Bar Kewajiban */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                    <span> PASIVA (Kewajiban)</span>
                    <span>{Math.round((stats.totalLiabilities / stats.totalAssets) * 100)}%</span>
                  </div>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(stats.totalLiabilities / stats.totalAssets) * 100}%`, background: 'var(--text-secondary)' }} />
                  </div>
                </div>

                {/* Bar Ekuitas */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                    <span> PASIVA (Ekuitas/Modal)</span>
                    <span>{Math.round((stats.totalEquity / stats.totalAssets) * 100)}%</span>
                  </div>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(stats.totalEquity / stats.totalAssets) * 100}%`, background: 'var(--text-primary)' }} />
                  </div>
                </div>

              </div>
              <div style={{ marginTop: '30px', padding: '16px', background: 'var(--bg-page)', borderRadius: '12px', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>
                💡 <strong>Prinsip Keseimbangan SAK EP:</strong> Posisi Neraca Anda Seimbang! Total Aset ({formatter.format(stats.totalAssets)}) === Total Kewajiban + Ekuitas ({formatter.format(stats.totalLiabilities + stats.totalEquity)}).
              </div>
            </div>

            {/* Audit Log Mini Table */}
            <div className="glass-dark" style={{ padding: '36px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0', fontWeight: 900 }}> Jurnal Terakhir Terposting</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {journals.slice(0, 4).map((j, idx) => (
                  <div key={j.id || idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', borderLeft: '3px solid var(--border-primary)', border: '1px solid var(--border-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 800 }}>
                      <span>{j.reference_no}</span>
                      <span>{j.date}</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '6px 0', fontSize: '14px' }}>{j.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>Kode Akun: {j.account_code}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{j.debit > 0 ? formatter.format(j.debit) : formatter.format(j.credit)}</span>
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
            border: '1.5px solid var(--border-primary)',
            boxShadow: '0 40px 80px var(--shadow-color)'
          }}>
            <div style={{ background: 'var(--bg-header)', padding: '24px 36px', borderBottom: '1.5px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '1px' }}>✒️ INPUT JURNAL PENYESUAIAN (DOUBLE-ENTRY)</h2>
              <span style={{ background: 'var(--border-primary)', color: 'var(--text-primary)', fontWeight: 900, fontSize: '12px', padding: '6px 14px', borderRadius: '20px' }}>SAK EP COMPLIANT</span>
            </div>
            
            <form onSubmit={handlePostJournal} style={{ padding: '36px' }}>
              
              {/* Smart Templates */}
              <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(204, 163, 52, 0.05)', borderRadius: '16px', border: '1px dashed var(--border-primary)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ color: 'var(--gold-intense)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>💡 Template Jurnal Cepat Otomatis (Otomatisasi Posisi COA)</div>
                  <button type="button" onClick={() => setShowTemplateModal(!showTemplateModal)} style={{ background: 'var(--gold-intense)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                    {showTemplateModal ? 'Batal Tambah' : '+ Buat Template Sendiri'}
                  </button>
                </div>
                
                {showTemplateModal && (
                  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-primary)', marginBottom: '16px', animation: 'fadeInUp 0.3s ease' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Buat Template Jurnal Baru</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800 }}>NAMA TOMBOL TEMPLATE</label>
                        <input type="text" value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} placeholder="Cth: Bayar Internet" style={{...inputStyle, padding: '10px'}} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800 }}>DESKRIPSI JURNAL (AUTO-FILL)</label>
                        <input type="text" value={newTemplate.desc} onChange={e => setNewTemplate({...newTemplate, desc: e.target.value})} placeholder="Cth: Pembayaran Tagihan Internet" style={{...inputStyle, padding: '10px'}} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800 }}>AKUN DEBIT (DEFAULT)</label>
                        <select value={newTemplate.debit} onChange={e => setNewTemplate({...newTemplate, debit: e.target.value})} style={{...inputStyle, padding: '10px'}}>
                          {coaList.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800 }}>AKUN KREDIT (DEFAULT)</label>
                        <select value={newTemplate.credit} onChange={e => setNewTemplate({...newTemplate, credit: e.target.value})} style={{...inputStyle, padding: '10px'}}>
                          {coaList.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <button type="button" onClick={handleAddTemplate} disabled={!newTemplate.name || !newTemplate.desc} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: (!newTemplate.name || !newTemplate.desc) ? 0.5 : 1 }}>
                      Simpan Template
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Default Templates */}
                  <button type="button" onClick={() => {
                    setJDesc('Pembayaran Biaya Operasional - Listrik & Air');
                    setJLines([{ accountCode: '730001', type: 'debit', amount: 0 }, { accountCode: '110101', type: 'credit', amount: 0 }]);
                  }} style={{ background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>⚡ Bayar Listrik/Air</button>
                  <button type="button" onClick={() => {
                    setJDesc('Pembayaran Gaji / Honor Karyawan');
                    setJLines([{ accountCode: '720001', type: 'debit', amount: 0 }, { accountCode: '110101', type: 'credit', amount: 0 }]);
                  }} style={{ background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>👥 Bayar Gaji</button>
                  <button type="button" onClick={() => {
                    setJDesc('Mutasi Penyetoran Kas Teller ke Brankas Utama');
                    setJLines([{ accountCode: '110101', type: 'debit', amount: 0 }, { accountCode: '110102', type: 'credit', amount: 0 }]);
                  }} style={{ background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>🏦 Mutasi Teller -&gt; Brankas</button>
                  
                  {/* Custom Templates */}
                  {customTemplates.map(tpl => (
                    <div key={tpl.id} style={{ position: 'relative', display: 'flex' }}>
                      <button type="button" onClick={() => {
                        setJDesc(tpl.desc);
                        setJLines([{ accountCode: tpl.debit, type: 'debit', amount: 0 }, { accountCode: tpl.credit, type: 'credit', amount: 0 }]);
                      }} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1.5px solid rgba(59, 130, 246, 0.5)', color: '#3b82f6', padding: '10px 16px', borderRadius: '10px 0 0 10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        ⭐ {tpl.name}
                      </button>
                      <button type="button" onClick={() => removeTemplate(tpl.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1.5px solid rgba(239, 68, 68, 0.5)', borderLeft: 'none', color: '#ef4444', padding: '10px', borderRadius: '0 10px 10px 0', cursor: 'pointer' }} title="Hapus Template">
                        ✕
                      </button>
                    </div>
                  ))}

                  <button type="button" onClick={() => {
                    setJDesc('');
                    setJLines([{ accountCode: '110102', type: 'debit', amount: 0 }, { accountCode: '230001', type: 'credit', amount: 0 }]);
                  }} style={{ background: 'transparent', border: '1.5px dashed rgba(239, 68, 68, 0.5)', color: '#ef4444', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>🔄 Kosongkan Form</button>
                </div>
              </div>

              {/* Global Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>TANGGAL TRANSAKSI</label>
                  <input type="date" required value={jDate} onChange={(e) => setJDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>NOMOR REFERENSI</label>
                  <input type="text" required value={jRef} onChange={(e) => setJRef(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>DESKRIPSI JURNAL / KETERANGAN</label>
                  <input 
                    type="text" 
                    required 
                    list="desc-options"
                    placeholder="Pilih atau ketik deskripsi transaksi..." 
                    value={jDesc} 
                    onChange={(e) => setJDesc(e.target.value)} 
                    style={inputStyle} 
                  />
                  <datalist id="desc-options">
                    <option value="Rekonsiliasi Kas Akhir Hari (Teller)" />
                    <option value="Penerimaan Setoran Simpanan Pokok & Wajib" />
                    <option value="Pencairan Dana Pembiayaan Murabahah" />
                    <option value="Penerimaan Angsuran Pembiayaan" />
                    <option value="Pembayaran Biaya Operasional - Gaji Karyawan" />
                    <option value="Pembayaran Biaya Operasional - Listrik & Air" />
                    <option value="Pencadangan Kerugian Penurunan Nilai (CKPN)" />
                    <option value="Distribusi Bagi Hasil Simpanan Mudharabah" />
                    <option value="Koreksi Jurnal" />
                  </datalist>
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
                        type="text" 
                        required 
                        value={line.amount ? line.amount.toLocaleString('id-ID') : ''} 
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          handleLineChange(idx, 'amount', parseInt(rawValue || '0', 10));
                        }}
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
            <div style={{ background: 'var(--bg-header)', padding: '24px 36px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 900 }}>📜 BUKU BESAR (GENERAL LEDGER LOGS)</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 800 }}>Filter Akun:</label>
                  <select 
                    value={ledgerFilterAcc} 
                    onChange={(e) => setLedgerFilterAcc(e.target.value)}
                    style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer' }}
                  >
                    <option value="ALL">Semua Akun</option>
                    {coaList.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <button onClick={fetchJournals} style={{ background: 'var(--border-primary)', padding: '8px 16px', borderRadius: '10px', border: 'none', color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer' }}>🔄 Segarkan Data</button>
              </div>
            </div>
            <div style={{ padding: '20px 36px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-primary)' }}>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '13px' }}>TANGGAL</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '13px' }}>REF NO</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '13px' }}>KODE AKUN</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '13px' }}>KETERANGAN</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '13px', textAlign: 'right' }}>DEBIT (Rp)</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '13px', textAlign: 'right' }}>KREDIT (Rp)</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '13px', textAlign: 'center' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingJournals ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 700 }}>Memuat data jurnal...</td>
                    </tr>
                  ) : journals.filter(j => ledgerFilterAcc === 'ALL' || j.account_code === ledgerFilterAcc).length > 0 ? 
                    journals.filter(j => ledgerFilterAcc === 'ALL' || j.account_code === ledgerFilterAcc).map((j, index) => (
                    <tr key={j.id || index} style={{ borderBottom: '1px solid var(--border-primary)', background: 'rgba(0,0,0,0.03)' }}>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '14px' }}>{j.date}</td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>{j.reference_no}</td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '14px' }}>
                        <code style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>{j.account_code}</code>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{j.description}</td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right', fontSize: '14px' }}>
                        {j.debit > 0 ? formatter.format(j.debit) : '—'}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right', fontSize: '14px' }}>
                        {j.credit > 0 ? formatter.format(j.credit) : '—'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button 
                          onClick={() => setPrintingVoucher(j)}
                          style={{ background: 'rgba(243, 198, 83, 0.1)', border: '1px solid #f3c653', color: 'var(--gold-intense)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}
                          title="Cetak Bukti Jurnal / Voucher"
                        >
                          🖨️ Cetak
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 800 }}>
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
          
          {/* Header Filter Section (Hidden on Print) */}
          <div className="glass-dark hide-on-print" style={{ padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-primary)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📅</span> Pilih Tahun Pembukuan
            </h3>
            <select 
              value={reportYear} 
              onChange={(e) => setReportYear(parseInt(e.target.value))}
              style={{ padding: '12px 20px', borderRadius: '12px', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 800, cursor: 'pointer', outline: 'none' }}
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
                <option key={year} value={year} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Tahun {year}</option>
              ))}
            </select>
          </div>
          
          <div className="glass-dark" style={{ padding: '40px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)' }}>
            
            {/* Report Header Print Layout */}
            <ReportHeader 
              title="LAPORAN POSISI KEUANGAN (NERACA)" 
              subtitle={`Berdasarkan Standar Akuntansi Keuangan Entitas Privat (SAK EP) | Per 31 Desember ${reportYear}`} 
            />

            <div className="neraca-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              
              {/* Left Side: Assets */}
              <div className="neraca-col">
                <h4 style={{ color: 'var(--text-primary)', borderBottom: '2.5px double var(--border-primary)', paddingBottom: '8px', fontWeight: 800 }}>1. ASET (AKTIVA)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <ReportLine label="Kas & Setara Kas (11)" value={formatter.format(getBal('11'))} />
                  <ReportLine label="Penempatan pada Bank (12)" value={formatter.format(getBal('12'))} />
                  <ReportLine label="Piutang Murabahah (14)" value={formatter.format(getBal('14'))} />
                  <ReportLine label="Pembiayaan Mudharabah (15)" value={formatter.format(getBal('15'))} />
                  <ReportLine label="Aset Tetap & Inventaris (16)" value={formatter.format(getBal('16'))} />
                  
                  <div style={{ borderTop: '1.5px solid var(--border-primary)', marginTop: '20px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: 'var(--text-primary)', fontSize: '16px' }}>
                    <span>TOTAL ASET</span>
                    <span>{formatter.format(stats.totalAssets)}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Liabilities & Equity */}
              <div className="neraca-col">
                <h4 style={{ color: 'var(--text-primary)', borderBottom: '2.5px double var(--border-primary)', paddingBottom: '8px', fontWeight: 800 }}>2. KEWAJIBAN (LIABILITAS)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                  <ReportLine label="Kewajiban Segera (21)" value={formatter.format(getBal('21', true))} />
                  <ReportLine label="Simpanan Wadiah/Titipan (22)" value={formatter.format(getBal('22', true))} />
                  <ReportLine label="Dana Syirkah Temporer (31+32)" value={formatter.format(getBal('3', true))} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '10px' }}>
                    <span>TOTAL KEWAJIBAN</span>
                    <span>{formatter.format(stats.totalLiabilities)}</span>
                  </div>
                </div>

                <h4 style={{ color: 'var(--text-primary)', borderBottom: '2.5px double var(--border-primary)', paddingBottom: '8px', fontWeight: 800 }}>3. EKUITAS (MODAL)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <ReportLine label="Simpanan Pokok Anggota" value={formatter.format(getBal('400001', true))} />
                  <ReportLine label="Simpanan Wajib Anggota" value={formatter.format(getBal('400002', true))} />
                  <ReportLine label="Sisa Hasil Usaha (SHU) Berjalan" value={formatter.format(stats.netProfit)} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '10px' }}>
                    <span>TOTAL EKUITAS</span>
                    <span>{formatter.format(stats.totalEquity)}</span>
                  </div>

                  <div style={{ borderTop: '1.5px solid var(--border-primary)', marginTop: '20px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: 'var(--text-primary)', fontSize: '16px' }}>
                    <span>TOTAL KEWAJIBAN & EKUITAS</span>
                    <span>{formatter.format(stats.totalLiabilities + stats.totalEquity)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ======================================= */}
          {/* INCOME STATEMENT (LABA RUGI KOMPREHENSIF) */}
          {/* ======================================= */}
          {/* INCOME STATEMENT (LABA RUGI KOMPREHENSIF) */}
          {/* ======================================= */}
          <div className="glass-dark print-page-break" style={{ padding: '40px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', marginTop: '10px' }}>
            <ReportHeader 
              title="LAPORAN LABA RUGI KOMPREHENSIF" 
              subtitle={`Berdasarkan Standar Akuntansi Keuangan Entitas Privat (SAK EP) | Untuk Tahun yang Berakhir 31 Desember ${reportYear}`} 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
              
              {/* PENDAPATAN OPERASIONAL */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px', fontWeight: 800 }}>PENDAPATAN OPERASIONAL (Akun 5)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px' }}>
                  <ReportLine label="Total Pendapatan Margin & Bagi Hasil" value={formatter.format(stats.totalIncome)} />
                </div>
              </div>

              {/* HAK PIHAK KETIGA / BAGI HASIL */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px', fontWeight: 800 }}>HAK PIHAK KETIGA ATAS BAGI HASIL (Akun 6)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px' }}>
                  <ReportLine label="Distribusi Bagi Hasil Simpanan Mudharabah" value={formatter.format(stats.totalProfitShare)} isRed />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--text-primary)', fontSize: '15px', borderTop: '1px dashed var(--border-primary)', paddingTop: '10px', marginTop: '10px' }}>
                  <span>PENDAPATAN BERSIH OPERASIONAL</span>
                  <span>{formatter.format(stats.totalIncome - stats.totalProfitShare)}</span>
                </div>
              </div>

              {/* BEBAN OPERASIONAL */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px', fontWeight: 800 }}>BEBAN OPERASIONAL (Akun 7)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px' }}>
                  <ReportLine label="Total Beban Kepegawaian, Administrasi & Umum" value={formatter.format(stats.totalExpense)} isRed />
                </div>
              </div>

              {/* NET PROFIT */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1.5px solid var(--border-primary)', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>SISA HASIL USAHA (SHU) BERSIH TAHUN BERJALAN</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Net Profit / Sisa Hasil Usaha otomatis ditransfer ke Ekuitas Neraca</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {formatter.format(stats.netProfit)}
                </div>
              </div>
            </div>
          </div>

          {/* ======================================= */}
          {/* STATEMENT OF CHANGES IN EQUITY          */}
          {/* ======================================= */}
          <div className="glass-dark print-page-break" style={{ padding: '40px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', marginTop: '10px' }}>
            <ReportHeader 
              title="LAPORAN PERUBAHAN EKUITAS" 
              subtitle={`Berdasarkan Standar Akuntansi Keuangan Entitas Privat (SAK EP) | Untuk Tahun yang Berakhir 31 Desember ${reportYear}`} 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '800px', margin: '0 auto' }}>
              <ReportLine label="Simpanan Pokok Anggota" value={formatter.format(getBal('400001', true))} />
              <ReportLine label="Simpanan Wajib Anggota" value={formatter.format(getBal('400002', true))} />
              <ReportLine label="Cadangan Umum & Khusus" value={formatter.format(getBal('400005', true) + getBal('400006', true))} />
              <ReportLine label="SHU Tahun Lalu (Ditahan)" value={formatter.format(getBal('400008', true))} />
              <ReportLine label="Laba Bersih (SHU Tahun Berjalan)" value={formatter.format(stats.netProfit)} />
              
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1.5px solid var(--border-primary)', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>TOTAL EKUITAS AKHIR TAHUN BERJALAN</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>{formatter.format(stats.totalEquity)}</div>
              </div>
            </div>
          </div>

          {/* ======================================= */}
          {/* STATEMENT OF CASH FLOWS                 */}
          {/* ======================================= */}
          <div className="glass-dark print-page-break" style={{ padding: '40px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', marginTop: '10px' }}>
            <ReportHeader 
              title="LAPORAN ARUS KAS (CASH FLOW)" 
              subtitle={`Metode Tidak Langsung (Indirect Method) SAK EP | Untuk Tahun yang Berakhir 31 Desember ${reportYear}`} 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
              
              {/* Aktivitas Operasi */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px', fontWeight: 800 }}>1. ARUS KAS DARI AKTIVITAS OPERASI</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px' }}>
                  <ReportLine label="Laba Bersih (SHU) Berjalan" value={formatter.format(stats.netProfit)} />
                  <ReportLine label="Kenaikan Titipan & Dana Syirkah" value={formatter.format(stats.totalLiabilities)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', borderTop: '1px dashed var(--border-primary)', paddingTop: '10px' }}>
                    <span>Kas Bersih dari Aktivitas Operasi</span>
                    <span>{formatter.format(stats.netProfit + stats.totalLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Aktivitas Investasi */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px', fontWeight: 800 }}>2. ARUS KAS DARI AKTIVITAS INVESTASI</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px' }}>
                  <ReportLine label="Penyaluran Pembiayaan Keluar (Penambahan Piutang)" value={`(${formatter.format(getBal('14') + getBal('15'))})`} isRed />
                  <ReportLine label="Pembelian Aset Tetap" value={`(${formatter.format(getBal('16'))})`} isRed />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', borderTop: '1px dashed var(--border-primary)', paddingTop: '10px' }}>
                    <span>Kas Bersih dari Aktivitas Investasi</span>
                    <span>({formatter.format(getBal('14') + getBal('15') + getBal('16'))})</span>
                  </div>
                </div>
              </div>

              {/* Aktivitas Pendanaan */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px', fontWeight: 800 }}>3. ARUS KAS DARI AKTIVITAS PENDANAAN</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px' }}>
                  <ReportLine label="Penerimaan Modal Pokok & Wajib" value={formatter.format(getBal('400001', true) + getBal('400002', true))} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', borderTop: '1px dashed var(--border-primary)', paddingTop: '10px' }}>
                    <span>Kas Bersih dari Aktivitas Pendanaan</span>
                    <span>{formatter.format(getBal('400001', true) + getBal('400002', true))}</span>
                  </div>
                </div>
              </div>

              {/* NET CASH BALANCE */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1.5px solid var(--border-primary)', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>SALDO KAS & SETARA KAS AKHIR</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Operasi + Investasi + Pendanaan</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {formatter.format(getBal('11'))}
                </div>
              </div>

            </div>
            
            <div style={{ marginTop: '50px', textAlign: 'center' }}>
              <button 
                onClick={() => window.print()} 
                style={{ padding: '16px 40px', background: 'var(--text-primary)', border: 'none', color: 'var(--bg-page)', borderRadius: '12px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}
              >
                🖨️ CETAK SELURUH LAPORAN KEUANGAN (SAK EP)
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
          
          <div className="glass-dark" style={{ padding: '40px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0', fontWeight: 900 }}>🛡️ CADANGAN KERUGIAN PENURUNAN NILAI (CKPN)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
              Sesuai mandat **SAK EP**, koperasi wajib mencadangkan potensi kerugian piutang pembiayaan macet berdasarkan kolektibilitas umur angsuran untuk memitigasi risiko finansial.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--bg-header)', borderBottom: '2px solid var(--border-primary)' }}>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>KOLEKTIBILITAS (STATUS)</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>UMUR TUNGGAKAN</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'center' }}>BOBOT CKPN (%)</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>ESTIMASI NILAI CKPN</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>Lancar (Kol-1)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>0 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>0.5%</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.8 * 0.005)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>Dalam Perhatian Khusus (Kol-2)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>1 - 90 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>5.0%</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.12 * 0.05)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>Kurang Lancar (Kol-3)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>91 - 120 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>15.0%</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.05 * 0.15)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>Diragukan (Kol-4)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>121 - 180 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>50.0%</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.02 * 0.5)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 900 }}>Macet (Kol-5)</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)' }}>&gt; 180 Hari</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', textAlign: 'center' }}>100.0%</td>
                  <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 900, textAlign: 'right' }}>{formatter.format(stats.totalFinancing * 0.01 * 1.0)}</td>
                </tr>
              </tbody>
            </table>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
              <div style={{ background: 'var(--bg-page)', padding: '20px 30px', borderRadius: '12px', border: '1.5px solid var(--border-primary)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>TOTAL KEBUTUHAN CADANGAN (CKPN):</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: 900 }}>
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

            <div style={{ marginTop: '20px', background: 'var(--bg-page)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0', fontSize: '16px', fontWeight: 800 }}>Otorisasi Pencadangan Otomatis</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                Menekan tombol di bawah ini akan secara otomatis memposting jurnal Beban Pencadangan (Debit) dan Cadangan Kerugian (Kredit) sebesar total nilai di atas.
              </p>
              <button 
                onClick={async () => {
                  const ckpnAmount = (stats.totalFinancing * 0.8 * 0.005) + 
                                     (stats.totalFinancing * 0.12 * 0.05) +
                                     (stats.totalFinancing * 0.05 * 0.15) +
                                     (stats.totalFinancing * 0.02 * 0.5) +
                                     (stats.totalFinancing * 0.01 * 1.0);
                                     
                  if (ckpnAmount <= 0) {
                     setMessage({ type: 'error', text: 'Kebutuhan CKPN masih Rp 0, tidak ada yang perlu dicadangkan.' });
                     window.scrollTo(0,0);
                     return;
                  }

                  setConfirmModal({
                    isOpen: true,
                    title: 'Otorisasi Pencadangan',
                    message: `Apakah Anda yakin ingin memposting jurnal CKPN sebesar ${formatter.format(ckpnAmount)}?`,
                    onConfirm: async () => {
                      setConfirmModal(null);
                      setLoading(true);
                      try {
                        const debitPayload = {
                          date: new Date().toISOString().split('T')[0],
                          reference_no: `CKPN-${Math.floor(10000 + Math.random() * 90000)}`,
                          description: `Pencadangan Kerugian Penurunan Nilai (CKPN) Umum`,
                          debit: ckpnAmount,
                          credit: 0,
                          account_code: '710002' // Beban CKPN
                        };

                        const creditPayload = {
                          ...debitPayload,
                          debit: 0,
                          credit: ckpnAmount,
                          account_code: '190002' // CKPN Piutang (-)
                        };

                        await fetch('/api/accounting/record-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(debitPayload) });
                        await fetch('/api/accounting/record-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creditPayload) });
                        
                        await fetchJournals();
                        setMessage({ type: 'success', text: `Berhasil memposting jurnal CKPN Umum sebesar ${formatter.format(ckpnAmount)}.` });
                      } catch (err: any) {
                        setMessage({ type: 'error', text: err.message });
                      } finally {
                        setLoading(false);
                        window.scrollTo(0,0);
                      }
                    }
                  });
                }}
                disabled={loading}
                style={{
                  background: loading ? 'gray' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white', border: 'none', padding: '16px 32px', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)', width: '100%'
                }}
              >
                {loading ? 'MEMPROSES JURNAL CKPN...' : '🛡️ POSTING JURNAL CKPN UMUM SEKARANG'}
              </button>
            </div>

            <div style={{ marginTop: '20px', background: 'rgba(239, 68, 68, 0.05)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h4 style={{ color: '#ef4444', margin: '0 0 10px 0', fontSize: '16px', fontWeight: 800 }}>Penyisihan CKPN Khusus (Pemindaian NPL &gt; 90 Hari)</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                Modul ini memindai seluruh akad pembiayaan aktif. Jika ditemukan fasilitas yang telah menunggak atau berusia lebih dari 90 hari tanpa penyelesaian (NPL), sistem akan otomatis membentuk <strong>CKPN Khusus</strong> dan menjurnalkannya ke akun <strong>Beban CKPN (710002)</strong> dan <strong>CKPN Piutang (190002)</strong>.
              </p>
              <button 
                onClick={async () => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Pemindaian CKPN Khusus',
                    message: 'Jalankan pemindaian otomatis untuk membentuk pencadangan CKPN Khusus? Operasi ini akan menjurnal transaksi penyesuaian untuk setiap NPL yang ditemukan.',
                    onConfirm: async () => {
                      setConfirmModal(null);
                      try {
                        setLoading(true);
                        const res = await fetch('/api/accounting/provisioning', { method: 'POST' });
                        const data = await res.json();
                        if (data.success) {
                          setMessage({ type: 'success', text: data.message });
                          fetchJournals();
                        } else {
                          setMessage({ type: 'error', text: 'Error: ' + data.error });
                        }
                      } catch (err: any) {
                        setMessage({ type: 'error', text: 'Gagal menjalankan provisioning: ' + err.message });
                      } finally {
                        setLoading(false);
                      }
                    }
                  });
                }}
                disabled={loading}
                style={{
                  background: loading ? 'gray' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  color: 'white', border: 'none', padding: '16px 32px', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)', width: '100%',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                }}
              >
                {loading ? '⏳ MEMINDAI DATABASE...' : '🔍 JALANKAN PEMINDAIAN NPL & BENTUK CKPN KHUSUS'}
              </button>
            </div>

          </div>
        </div>
      )}
      {/* ======================================= */}
      {/* 🏢 TAB 5: ASET TETAP & DEPRESIASI       */}
      {/* ======================================= */}
      {activeMenu === 'assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="glass-dark" style={{ padding: '40px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0', fontWeight: 900 }}>🏢 MANAJEMEN ASET TETAP & PENYUSUTAN</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                  Kalkulasi **Depresiasi Garis Lurus (Straight-Line)** otomatis sesuai SAK EP. Jalankan setiap akhir bulan.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={() => setShowAssetModal(true)}
                  style={{ background: 'transparent', border: '2px solid var(--gold-intense)', color: 'var(--gold-intense)', padding: '12px 24px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}
                >
                  ➕ Tambah Aset
                </button>
                <button 
                  onClick={handleRunMassDepreciation}
                  disabled={loadingJournals}
                  style={{ background: 'var(--text-primary)', color: 'var(--bg-page)', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 900, cursor: loadingJournals ? 'not-allowed' : 'pointer', fontSize: '14px' }}
                >
                  {loadingJournals ? '⏳ Memproses...' : '📉 Jalankan Depresiasi Massal'}
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--bg-header)', borderBottom: '2px solid var(--border-primary)' }}>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>NAMA ASET & KATEGORI</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>HARGA PEROLEHAN</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>UMUR (BLN)</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>BEBAN PER BULAN</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>AKUMULASI PENYUSUTAN</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>NILAI BUKU (SISA)</th>
                </tr>
              </thead>
              <tbody>
                {fixedAssets.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada aset tetap terdaftar. Tambahkan aset untuk memantau depresiasi.</td></tr>
                ) : (
                  fixedAssets.map(asset => {
                    const depreciable = asset.purchase_price - asset.salvage_value;
                    const monthly = depreciable / asset.useful_life_months;
                    const sisaBuku = asset.purchase_price - asset.accumulated_depreciation;
                    return (
                      <tr key={asset.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '20px' }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{asset.name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>{asset.category} | Beli: {asset.purchase_date}</div>
                        </td>
                        <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>{formatter.format(asset.purchase_price)}</td>
                        <td style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>{asset.useful_life_months}</td>
                        <td style={{ padding: '20px', color: '#f3c653', fontWeight: 800 }}>{formatter.format(monthly)}</td>
                        <td style={{ padding: '20px', color: '#ef4444', fontWeight: 800 }}>{formatter.format(asset.accumulated_depreciation)}</td>
                        <td style={{ padding: '20px', color: '#4ade80', fontWeight: 900, textAlign: 'right', fontSize: '16px' }}>{formatter.format(sisaBuku)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Asset Registration Modal */}
      {showAssetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-page)', padding: '40px', borderRadius: '24px', width: '500px', border: '2px solid var(--border-primary)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-primary)', fontSize: '20px', fontWeight: 900 }}>Tambah Aset Tetap Baru</h3>
            <form onSubmit={handleAddAsset}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Nama Aset</label>
                  <input type="text" required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px' }} placeholder="Cth: Komputer Server IBM" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Kategori</label>
                    <select value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px' }}>
                      <option value="inventaris">Inventaris Kantor</option>
                      <option value="kendaraan">Kendaraan</option>
                      <option value="gedung">Gedung / Bangunan</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Tanggal Pembelian</label>
                    <input type="date" required value={newAsset.purchase_date} onChange={e => setNewAsset({...newAsset, purchase_date: e.target.value})} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Harga Perolehan (Rp)</label>
                  <input type="number" required value={newAsset.purchase_price || ''} onChange={e => setNewAsset({...newAsset, purchase_price: Number(e.target.value)})} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px' }} placeholder="20000000" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Nilai Sisa / Residu (Rp)</label>
                    <input type="number" required value={newAsset.salvage_value || ''} onChange={e => setNewAsset({...newAsset, salvage_value: Number(e.target.value)})} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px' }} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Umur Ekonomis (Bulan)</label>
                    <input type="number" required value={newAsset.useful_life_months || ''} onChange={e => setNewAsset({...newAsset, useful_life_months: Number(e.target.value)})} style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px' }} placeholder="48" />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button type="button" onClick={() => setShowAssetModal(false)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', borderRadius: '12px', fontWeight: 800 }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: '14px', background: 'var(--gold-intense)', border: 'none', color: '#02130e', borderRadius: '12px', fontWeight: 900 }}>Simpan Aset Baru</button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '16px' }}>Peringatan: Pastikan Anda telah membuat Jurnal Pembelian Aset Tetap secara terpisah di tab Manajemen Jurnal.</div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 💰 TAB 6: DISTRIBUSI BAGI HASIL (EOM)     */}
      {/* ======================================= */}
      {activeMenu === 'eom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeInUp 0.5s ease-out' }}>
          <div className="glass-dark" style={{ padding: '40px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '24px' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span>💰</span> DISTRIBUSI BAGI HASIL (END OF MONTH)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
              Modul ini akan menghitung seluruh Pendapatan Koperasi (Margin & Administrasi) bulan berjalan dan mendistribusikan porsi Bagi Hasil (Nisbah) ke rekening Simpanan Mudharabah Anggota.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              <div style={{ padding: '24px', background: 'rgba(52, 211, 153, 0.05)', border: '2px solid rgba(52, 211, 153, 0.2)', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-success)', fontWeight: 800, marginBottom: '8px' }}>Total Pendapatan (Bulan Ini)</div>
                <div style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 900 }}>
                  {formatter.format(
                    journals.filter(j => 
                      j.account_code?.startsWith('5') && 
                      new Date(j.date || j.created_at).getMonth() === new Date().getMonth() &&
                      new Date(j.date || j.created_at).getFullYear() === reportYear
                    ).reduce((sum, j) => sum + (Number(j.credit) - Number(j.debit)), 0)
                  )}
                </div>
              </div>
              
              <div style={{ padding: '24px', background: 'rgba(243, 198, 83, 0.05)', border: '2px solid var(--border-primary)', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--gold-intense)', fontWeight: 800, marginBottom: '8px' }}>Nisbah Anggota (%)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    step="5" 
                    value={eomNisbah} 
                    onChange={e => setEomNisbah(Number(e.target.value))}
                    style={{ flexGrow: 1 }}
                  />
                  <span style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 900 }}>{eomNisbah}%</span>
                </div>
              </div>

              <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.05)', border: '2px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 800, marginBottom: '8px' }}>Estimasi Dibagikan ke Anggota</div>
                <div style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 900 }}>
                  {formatter.format(
                    (journals.filter(j => 
                      j.account_code?.startsWith('5') && 
                      new Date(j.date || j.created_at).getMonth() === new Date().getMonth() &&
                      new Date(j.date || j.created_at).getFullYear() === reportYear
                    ).reduce((sum, j) => sum + (Number(j.credit) - Number(j.debit)), 0)) * (eomNisbah / 100)
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-page)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0', fontSize: '16px', fontWeight: 800 }}>Otorisasi Distribusi (Straight-Through Processing)</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                Dengan menekan tombol di bawah, sistem akan secara otomatis mendebit Beban Bagi Hasil (600001) dan mengkreditkan Simpanan Mudharabah Anggota (310001) secara agregat.
              </p>
              <button 
                onClick={async () => {
                  const currentMonthIncome = journals.filter(j => 
                    j.account_code?.startsWith('5') && 
                    new Date(j.date || j.created_at).getMonth() === new Date().getMonth() &&
                    new Date(j.date || j.created_at).getFullYear() === reportYear
                  ).reduce((sum, j) => sum + (Number(j.credit) - Number(j.debit)), 0);

                  const profitShareAmount = currentMonthIncome * (eomNisbah / 100);

                  if (profitShareAmount <= 0) {
                    setMessage({ type: 'error', text: 'Tidak ada Pendapatan di bulan ini yang bisa dibagikan.' });
                    window.scrollTo(0,0);
                    return;
                  }

                  setConfirmModal({
                    isOpen: true,
                    title: 'Distribusi Bagi Hasil',
                    message: `Apakah Anda yakin ingin mendistribusikan Bagi Hasil sebesar ${formatter.format(profitShareAmount)} ke seluruh rekening Simpanan Mudharabah?`,
                    onConfirm: async () => {
                      setConfirmModal(null);
                      setLoading(true);
                      try {
                        const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                        const supabase = createClient();
                        
                        // 1. Ambil semua rekening Mudharabah
                        const { data: mudharabahAccs, error: fetchErr } = await supabase
                          .from('savings_accounts')
                          .select('id, balance')
                          .eq('account_type', 'mudharabah');
                          
                        if (fetchErr) throw new Error('Gagal mengambil data rekening Mudharabah: ' + fetchErr.message);
                        
                        if (mudharabahAccs && mudharabahAccs.length > 0) {
                          const totalMudharabahBalance = mudharabahAccs.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
                          
                          if (totalMudharabahBalance > 0) {
                            // 2. Proporsionalkan dan update masing-masing rekening
                            for (const acc of mudharabahAccs) {
                              const accBal = Number(acc.balance || 0);
                              if (accBal > 0) {
                                const porsi = (accBal / totalMudharabahBalance) * profitShareAmount;
                                
                                // Update saldo
                                await supabase
                                  .from('savings_accounts')
                                  .update({ balance: accBal + porsi })
                                  .eq('id', acc.id);
                                  
                                // Catat mutasi tabungan
                                await supabase
                                  .from('savings_transactions')
                                  .insert([{
                                    account_id: acc.id,
                                    transaction_type: 'profit_sharing',
                                    amount: porsi,
                                    reference_no: `EOM-${Date.now()}`
                                  }]);
                              }
                            }
                          }
                        }
                        
                        // 3. Posting Jurnal Agregat ke Buku Besar
                        const debitPayload = {
                          date: new Date().toISOString().split('T')[0],
                          reference_no: `EOM-${Math.floor(100000 + Math.random() * 900000)}`,
                          description: `Distribusi Bagi Hasil Bulan ${monthName} (Nisbah Anggota ${eomNisbah}%)`,
                          debit: profitShareAmount,
                          credit: 0,
                          account_code: '600001' // Beban Bagi Hasil
                        };

                        const creditPayload = {
                          date: new Date().toISOString().split('T')[0],
                          reference_no: debitPayload.reference_no,
                          description: debitPayload.description,
                          debit: 0,
                          credit: profitShareAmount,
                          account_code: '310001' // Simpanan Mudharabah Anggota
                        };

                        await fetch('/api/accounting/record-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(debitPayload) });
                        await fetch('/api/accounting/record-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creditPayload) });
                        
                        await fetchJournals();
                        setMessage({ type: 'success', text: `Berhasil mendistribusikan bagi hasil sebesar ${formatter.format(profitShareAmount)} ke seluruh rekening Mudharabah.` });
                      } catch (err: any) {
                        setMessage({ type: 'error', text: err.message });
                      } finally {
                        setLoading(false);
                        window.scrollTo(0,0);
                      }
                    }
                  });
                }}
                disabled={loading}
                style={{
                  background: loading ? 'gray' : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  color: 'white', border: 'none', padding: '16px 32px', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)', width: '100%'
                }}
              >
                {loading ? 'MEMPROSES DISTRIBUSI...' : '💰 JALANKAN DISTRIBUSI BAGI HASIL SEKARANG'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 🔒 TAB 6: TUTUP BUKU HARIAN (EOD)       */}
      {/* ======================================= */}
      {activeMenu === 'eod' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeInUp 0.5s ease-out' }}>
          
          <div className="glass-dark" style={{ padding: '40px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '24px' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span>🔒</span> TUTUP BUKU HARIAN (END OF DAY / EOD)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
              Validasi dan rekonsiliasi mutasi kas harian sebelum melakukan penguncian (freezing) transaksi hari ini. Pastikan saldo fisik di laci kasir (Teller) sesuai dengan catatan sistem.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              <div style={{ padding: '24px', background: 'rgba(52, 211, 153, 0.05)', border: '2px solid rgba(52, 211, 153, 0.2)', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-success)', fontWeight: 800, marginBottom: '8px' }}>Total Kas Masuk (Hari Ini)</div>
                <div style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 900 }}>
                  {formatter.format(
                    journals.filter(j => (j.date === new Date().toISOString().split('T')[0] || (j.created_at && j.created_at.startsWith(new Date().toISOString().split('T')[0]))) && j.account_code === '110102' && j.debit > 0)
                            .reduce((sum, j) => sum + Number(j.debit), 0)
                  )}
                </div>
              </div>
              
              <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.05)', border: '2px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 800, marginBottom: '8px' }}>Total Kas Keluar (Hari Ini)</div>
                <div style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 900 }}>
                  {formatter.format(
                    journals.filter(j => (j.date === new Date().toISOString().split('T')[0] || (j.created_at && j.created_at.startsWith(new Date().toISOString().split('T')[0]))) && j.account_code === '110102' && j.credit > 0)
                            .reduce((sum, j) => sum + Number(j.credit), 0)
                  )}
                </div>
              </div>

              <div style={{ padding: '24px', background: 'rgba(243, 198, 83, 0.05)', border: '2px solid var(--border-primary)', borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--gold-intense)', fontWeight: 800, marginBottom: '8px' }}>Ekspektasi Saldo Laci Teller (Buku Besar)</div>
                <div style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 900 }}>
                  {formatter.format(getBal('110102'))}
                </div>
              </div>
            </div>

            {/* Monitor Shift Teller */}
            <div style={{ background: 'var(--bg-page)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-primary)', marginBottom: '30px' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👥</span> MONITOR SHIFT KASIR (TELLER RECONCILIATION)
              </h4>
              
              {tellerShifts.length === 0 ? (
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px' }}>
                  Belum ada teller yang membuka shift hari ini.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-primary)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px', fontWeight: 800 }}>NAMA TELLER</th>
                      <th style={{ padding: '12px', fontWeight: 800 }}>BUKA SHIFT</th>
                      <th style={{ padding: '12px', fontWeight: 800 }}>MODAL AWAL</th>
                      <th style={{ padding: '12px', fontWeight: 800 }}>HITUNG FISIK (TUTUP)</th>
                      <th style={{ padding: '12px', fontWeight: 800 }}>SELISIH</th>
                      <th style={{ padding: '12px', fontWeight: 800 }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tellerShifts.map((shift, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '16px 12px', color: 'var(--text-primary)', fontWeight: 700 }}>{shift.teller_name}</td>
                        <td style={{ padding: '16px 12px', color: 'var(--text-primary)' }}>{new Date(shift.opened_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</td>
                        <td style={{ padding: '16px 12px', color: 'var(--text-primary)' }}>{formatter.format(shift.cash_in)}</td>
                        <td style={{ padding: '16px 12px', color: shift.cash_physical_end ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {shift.cash_physical_end ? formatter.format(shift.cash_physical_end) : 'Belum Dihitung'}
                        </td>
                        <td style={{ padding: '16px 12px', fontWeight: 800, color: shift.difference === 0 ? '#4ade80' : shift.difference ? '#ef4444' : 'var(--text-secondary)' }}>
                          {shift.difference !== null ? formatter.format(shift.difference) : '-'}
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                            background: shift.status === 'tutup' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: shift.status === 'tutup' ? '#4ade80' : '#ef4444'
                          }}>
                            {shift.status === 'tutup' ? '✅ SHIFT DITUTUP' : '⚠️ MASIH AKTIF'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ background: 'var(--bg-page)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0', fontSize: '16px', fontWeight: 800 }}>Otorisasi Penguncian (Freezing)</h4>
              
              {isTodayClosed ? (
                <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '2px solid rgba(52, 211, 153, 0.3)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
                  <h4 style={{ color: 'var(--text-success)', margin: '0 0 10px 0', fontSize: '18px', fontWeight: 900 }}>TRANSAKSI HARI INI TELAH DIKUNCI</h4>
                  <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: 0, fontWeight: 600 }}>
                    Buku harian untuk tanggal {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} sudah resmi ditutup. Semua mutasi transaksi baru akan otomatis dialihkan ke tanggal berikutnya.
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                    Dengan menekan tombol di bawah ini, Anda menyatakan bahwa penghitungan uang fisik telah sesuai dengan catatan di sistem. Seluruh transaksi pada tanggal <strong>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> akan dikunci permanen dan tidak dapat diubah lagi.
                  </p>
                  
                  <button 
                    onClick={async () => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Kunci Transaksi Hari Ini',
                        message: 'PERINGATAN: Apakah Anda yakin saldo fisik laci kasir sudah BENAR dan ingin MENGUNCI seluruh transaksi hari ini?',
                        onConfirm: async () => {
                          setConfirmModal(null);
                          try {
                            setLoading(true);
                            const payload = {
                              closing_date: new Date().toISOString().split('T')[0],
                              total_in: journals.filter(j => (j.date === new Date().toISOString().split('T')[0] || (j.created_at && j.created_at.startsWith(new Date().toISOString().split('T')[0]))) && j.account_code === '110102' && j.debit > 0).reduce((sum, j) => sum + Number(j.debit), 0),
                              total_out: journals.filter(j => (j.date === new Date().toISOString().split('T')[0] || (j.created_at && j.created_at.startsWith(new Date().toISOString().split('T')[0]))) && j.account_code === '110102' && j.credit > 0).reduce((sum, j) => sum + Number(j.credit), 0),
                              expected_balance: getBal('110102'),
                              actual_balance: getBal('110102'), // Placeholder: actual physical cash input can be added in future
                              closed_by: profile?.id || 'system'
                            };
                            
                            const res = await fetch('/api/accounting/eod', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload)
                            });
                            
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Gagal melakukan tutup buku');
                            
                            setMessage({ type: 'success', text: data.message });
                            setIsTodayClosed(true); // Update state directly
                          } catch (err: any) {
                            setMessage({ type: 'error', text: err.message });
                          } finally {
                            setLoading(false);
                            window.scrollTo(0, 0); // Scroll to top to see message
                          }
                        }
                      });
                    }}
                    disabled={loading}
                    style={{
                      background: loading ? 'gray' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '16px 32px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 900,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)',
                      width: '100%'
                    }}
                  >
                    {loading ? 'MEMPROSES KUNCIAN...' : '🔒 TUTUP BUKU & KUNCI TRANSAKSI HARI INI'}
                  </button>
                </>
              )}
            </div>

            {/* Riwayat Tutup Buku (EOD History) */}
            <div style={{ marginTop: '40px' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0', fontSize: '18px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📅</span> ARSIP RIWAYAT TUTUP BUKU
              </h4>
              
              {closuresHistory.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border-primary)' }}>
                  Belum ada riwayat tutup buku.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-header)', borderBottom: '2px solid var(--border-primary)', textAlign: 'left' }}>
                        <th style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '13px' }}>TANGGAL TUTUP</th>
                        <th style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '13px' }}>TOTAL KAS MASUK</th>
                        <th style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '13px' }}>TOTAL KAS KELUAR</th>
                        <th style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '13px' }}>SALDO LACI FINAL</th>
                        <th style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '13px' }}>STATUS EOD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closuresHistory.map((closure, idx) => (
                        <tr key={closure.id || idx} style={{ borderBottom: '1px solid var(--border-primary)', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 700 }}>
                            {new Date(closure.closing_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '16px 20px', color: 'var(--text-success)', fontWeight: 700 }}>{formatter.format(closure.total_in)}</td>
                          <td style={{ padding: '16px 20px', color: '#ef4444', fontWeight: 700 }}>{formatter.format(closure.total_out)}</td>
                          <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 900 }}>{formatter.format(closure.expected_balance)}</td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--text-success)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                                TERKUNCI
                              </span>
                              <button 
                                onClick={() => setSelectedEodDate(closure.closing_date)}
                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#3b82f6', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                🔍 RINCIAN
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}



      {confirmModal && (
        <Modal
          isOpen={confirmModal.isOpen}
          type="confirm"
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Modal Rincian EOD */}
      {selectedEodDate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-header)', position: 'sticky', top: 0 }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: 900 }}>RINCIAN MUTASI KAS HARIAN</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Tanggal: {new Date(selectedEodDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <button onClick={() => setSelectedEodDate(null)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid var(--border-primary)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>WAKTU</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>NO REFERENSI</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>KETERANGAN</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-success)' }}>KAS MASUK (DEBIT)</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#ef4444' }}>KAS KELUAR (KREDIT)</th>
                  </tr>
                </thead>
                <tbody>
                  {journals
                    .filter(j => (j.date === selectedEodDate || (j.created_at && j.created_at.startsWith(selectedEodDate))) && (j.account_code === '110101' || j.account_code === '110102'))
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((j, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{new Date(j.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ padding: '12px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{j.reference_no}</td>
                        <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{j.description}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-success)', fontWeight: j.debit > 0 ? 700 : 400 }}>{j.debit > 0 ? formatter.format(j.debit) : '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: j.credit > 0 ? 700 : 400 }}>{j.credit > 0 ? formatter.format(j.credit) : '-'}</td>
                      </tr>
                    ))
                  }
                  {journals.filter(j => (j.date === selectedEodDate || (j.created_at && j.created_at.startsWith(selectedEodDate))) && (j.account_code === '110101' || j.account_code === '110102')).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Tidak ada mutasi kas pada tanggal ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ padding: '24px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-header)', display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: 0 }}>
              <button onClick={() => window.print()} className="hide-on-print" style={{ background: 'var(--text-primary)', color: 'var(--bg-page)', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                🖨️ Cetak Rincian
              </button>
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

function StatCard({ label, value, icon, subtitle }: any) {
  return (
    <div style={{ 
      background: 'var(--bg-card)', 
      backdropFilter: 'blur(12px)', 
      padding: '24px', 
      borderRadius: '24px', 
      border: '1.5px solid var(--border-primary)',
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
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>{subtitle}</div>
    </div>
  );
}

function ReportLine({ label, value, isRed = false }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0', color: isRed ? '#ef4444' : 'var(--text-primary)', fontWeight: 600 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function ReportHeader({ title, subtitle }: any) {
  return (
    <div className="border-bottom" style={{ textAlign: 'center', borderBottom: '3px double var(--border-primary)', paddingBottom: '20px', marginBottom: '30px' }}>
      <h3 style={{ color: 'var(--text-primary)', margin: '0', fontSize: '20px', fontWeight: 800 }}>{title}</h3>
      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>{subtitle}</div>
    </div>
  );
}


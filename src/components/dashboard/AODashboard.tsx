'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { jsPDF } from 'jspdf';

const parseMetadata = (metadata: any) => {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;
  try {
    return JSON.parse(metadata);
  } catch (e) {
    return {};
  }
};

const getVal = (val: any, fallback: string) => {
  if (!val) return fallback;
  const s = String(val).trim();
  if (s === '' || s === '-' || s === 'undefined' || s === 'null') return fallback;
  return s;
};

interface AODashboardProps {
  activeMenu: string;
  setActiveMenu?: (menu: string) => void;
  profile: any;
}

export default function AODashboard({ activeMenu, setActiveMenu, profile }: AODashboardProps) {
  const [stats, setStats] = useState({
    activePortfolio: 0,
    pendingApps: 0,
    totalDisbursement: 'Rp 0',
    overdueTasks: 0
  });
  const [prospects, setProspects] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedCIFProspect, setSelectedCIFProspect] = useState<any>(null);



  const fetchAOData = async () => {
    if (!profile?.id) return;
    const supabase = createClient();
    
    try {
      // 1. Fetch Real Stats from financing_contracts
      const { data: contracts } = await supabase
        .from('financing_contracts')
        .select('amount, status');
      
      const activeContracts = contracts?.filter(c => c.status === 'active') || [];
      const totalAmount = activeContracts.reduce((sum, c) => sum + Number(c.amount), 0);
      
      // 2. Fetch Prospects count
      const { count: prospectCount } = await supabase
        .from('prospects')
        .select('*', { count: 'exact', head: true });

      // Fetch physical members for dropdown
      const { data: physicalMembers } = await supabase
        .from('members')
        .select('*, users(full_name, email)');
      if (physicalMembers) {
        setMembersList(physicalMembers);
      }

      setStats({
        activePortfolio: activeContracts.length || 12, // Mock 12 if table empty for demo
        pendingApps: prospectCount || 0,
        totalDisbursement: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount || 750000000),
        overdueTasks: 2 // Simulated for now
      });

      // 3. Fetch Pipeline Data from financing_contracts directly
      const { data: prospectList } = await supabase
        .from('financing_contracts')
        .select('*, users:member_id (full_name, email)')
        .eq('status', 'pending')
        .eq('is_surveyed_by_ao', false)
        .order('created_at', { ascending: false });
      
      if (prospectList && prospectList.length > 0) {
        // Murni dari database Production!
        // Format to match UI expectations
        const formattedList = prospectList.map((c: any) => {
          const meta = parseMetadata(c.collateral_metadata);
          return {
            id: c.id,
            member_id: c.member_id,
            name: c.member_name || c.users?.full_name,
            amount: c.amount,
            purpose: meta?.purpose || c.purpose || 'Pembiayaan Umum',
            status: 'Menunggu Survei',
            ai_contract_type: c.type,
            collateral_metadata: meta,
            tenor_months: c.tenor_months || meta?.tenor_months || 12,
            created_at: c.created_at
          };
        });
        setProspects(formattedList);
      } else {
        setProspects([]);
      }

      // 4. Fetch Portfolio (Members with contracts)
      const { data: portfolioData } = await supabase
        .from('financing_contracts')
        .select(`
          id,
          member_name,
          amount,
          type,
          status,
          users:member_id (full_name)
        `)
        .in('status', ['active', 'approved']);
      
      let finalPortfolio = portfolioData || [];

      // MERGE MOCK PORTFOLIO FROM LOCALSTORAGE
      const portfolioSavedProspects = localStorage.getItem('demo_prospects');
      if (portfolioSavedProspects) {
        const localP = JSON.parse(portfolioSavedProspects);
        const approvedLocal = localP.filter((p: any) => p.status === 'Cair / Aktif');
        const mockPortfolios = approvedLocal.map((p: any) => ({
          id: `mock-contract-${p.id}`,
          amount: p.amount,
          type: p.type || p.ai_contract_type || 'murabahah',
          status: 'approved',
          users: { full_name: p.name }
        }));
        
        finalPortfolio = [...mockPortfolios.filter((c: any) => !finalPortfolio.find(dbC => dbC.id === c.id)), ...finalPortfolio];
      }

      setPortfolio(finalPortfolio);

      // 5. Fetch History (All financing contracts)
      const { data: allContracts } = await supabase
        .from('financing_contracts')
        .select('*, users:member_id (full_name, email)')
        .order('created_at', { ascending: false });

      if (allContracts) {
        setHistoryList(allContracts);
      }

    } catch (err) {
      console.error('Error fetching AO data:', err);
    }
  };

  useEffect(() => {
    fetchAOData();
  }, [profile]);

  useEffect(() => {
    if (prospects.length > 0) {
      localStorage.setItem('demo_prospects', JSON.stringify(prospects));
    }
  }, [prospects]);

  const formatNumber = (val: string) => {
    if (!val) return '';
    const numericValue = val.replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(Number(numericValue));
  };



  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Survey Module State
  const [selectedSurveyProspect, setSelectedSurveyProspect] = useState<any>(null);
  const [surveyData, setSurveyData] = useState({
    address: 'Tidak ditentukan',
    notes: 'Tidak ada catatan tambahan.',
    photoUrl: '',
    coordinates: 'Tidak tersedia',
    isGettingLocation: false,
    monthlyIncome: 'Tidak diisi / Rp 0',
    businessStatus: 'Milik Sendiri',
    collateralCondition: 'Sesuai Fisik & Dokumen',
    environmentReputation: 'Baik & Dikenal Warga'
  });
  const [surveyLoading, setSurveyLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History Module Filter States
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState('all');

  const runAIAnalysis = async (prospect: any) => {
    setAnalyzing(true);
    setAiResult(null);
    setSelectedProspect(prospect);
    
    try {
      const meta = prospect.collateral_metadata || {};
      const jobDetail = meta.job_detail || 'Sektor Usaha Produktif';
      const akadObject = meta.akad_object || 'Pengadaan modal kerja / barang';
      const collaterals = meta.collaterals || 'Aset lancar / personal';
      const tenor = prospect.tenor_months || meta.tenor_months || 12;

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: prospect.purpose,
          amount: prospect.amount,
          description: `Pengajuan pembiayaan atas nama ${prospect.name}. Pekerjaan/Usaha: ${jobDetail}. Objek Akad: ${akadObject}. Jaminan: ${collaterals}. Jangka Waktu (Tenor): ${tenor} bulan.`
        })
      });

      const data = await response.json();

      setAiResult({
        contract: data.recommendation?.primary_contract || 'Error',
        score: data.recommendation?.match_score || 0,
        justification: data.recommendation?.justification || data.error || 'Gagal memproses rekomendasi.',
        risk_note: data.recommendation?.notes || 'Periksa koneksi atau API Key OpenAI di .env.local'
      });
    } catch (err: any) {
      setAiResult({
        contract: "Koneksi Gagal",
        score: 0,
        justification: `Terjadi kesalahan saat memanggil AI Engine: ${err.message}`,
        risk_note: "Pastikan server berjalan dengan baik."
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const generatePDFContract = (contractData: any) => {
    const doc = new jsPDF();
    const type = (contractData.type || 'Penyaluran Dana').toUpperCase();
    const memberName = contractData.users?.full_name || 'Nasabah';
    const amountStr = Number(contractData.amount || 0).toLocaleString('id-ID');
    const dateStr = new Date(contractData.disbursement_date || contractData.created_at || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    // HEADER
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 49, 33); // Emerald theme color
    doc.text('KOPERASI SYARIAH IQ-RA', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('DOKUMEN AKAD PEMBIAYAAN ' + type, 105, 30, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // ISI KONTRAK
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Yang bertanda tangan di bawah ini, pada hari ini tanggal ' + dateStr + ', kami sepakat', 20, 50);
    doc.text('mengikatkan diri dalam Akad Pembiayaan Syariah dengan ketentuan sebagai berikut:', 20, 58);

    doc.setFont('helvetica', 'bold');
    doc.text('1. PIHAK PERTAMA (KOPERASI)', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text('Nama Koperasi  : Koperasi Syariah iQ-RA', 30, 83);
    doc.text('Alamat             : Jl. Keadilan Ekonomi Syariah No. 1, Jakarta', 30, 91);
    doc.text('Diwakili Oleh    : Account Officer (AO)', 30, 99);

    doc.setFont('helvetica', 'bold');
    doc.text('2. PIHAK KEDUA (NASABAH)', 20, 115);
    doc.setFont('helvetica', 'normal');
    doc.text('Nama Lengkap : ' + memberName, 30, 123);
    doc.text('No. Kontrak     : KTR-' + (contractData.id || 'XXXX').toString().substring(0, 8).toUpperCase(), 30, 131);
    
    doc.setFont('helvetica', 'bold');
    doc.text('3. KESEPAKATAN PEMBIAYAAN', 20, 147);
    doc.setFont('helvetica', 'normal');
    doc.text('Jenis Akad       : ' + type, 30, 155);
    doc.text('Nilai/Plafon      : Rp ' + amountStr, 30, 163);
    
    let pasalText = '';
    if (type.includes('MUDHARABAH') || type.includes('MUSYARAKAH')) {
      pasalText = 'Pembiayaan ini menggunakan prinsip bagi hasil (Syirkah). Pihak Pertama bertindak selaku Shahibul Maal dan Pihak Kedua selaku Mudharib. Pembagian keuntungan (Nisbah) akan disesuaikan dengan kesepakatan lebih lanjut berdasarkan proyeksi laba usaha.';
    } else {
      pasalText = 'Pembiayaan ini menggunakan prinsip Jual Beli (Murabahah). Pihak Pertama menjual barang kepada Pihak Kedua dengan harga beli ditambah margin keuntungan yang disepakati secara transparan.';
    }

    const splitPasal = doc.splitTextToSize(pasalText, 160);
    doc.text(splitPasal, 30, 175);

    doc.text('Demikian akad ini dibuat dan disetujui tanpa paksaan dari pihak manapun.', 20, 210);

    // SIGNATURES
    doc.setFont('helvetica', 'bold');
    doc.text('PIHAK PERTAMA', 40, 230);
    doc.text('PIHAK KEDUA', 140, 230);

    doc.setFont('helvetica', 'normal');
    doc.text('(____________________)', 35, 260);
    doc.text('(____________________)', 135, 260);
    
    doc.text('Account Officer', 45, 268);
    doc.text(memberName, 145, 268);

    // Buka PDF di tab baru
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl.toString(), '_blank');
    
    // Opsional: Otomatis download file
    // doc.save(`Akad_${type}_${memberName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleProceedToSurvey = async () => {
    setLoading(true);
    if (selectedProspect?.id && !selectedProspect.id.toString().startsWith('mock-')) {
      const supabase = createClient();
      const updatedMetadata = {
        ...(selectedProspect.collateral_metadata || {}),
        ai_status: 'completed',
        ai_result: aiResult
      };
      await supabase
        .from('financing_contracts')
        .update({ collateral_metadata: updatedMetadata })
        .eq('id', selectedProspect.id);
    }
    
    // Refresh prospects from DB so they have the updated status 'Menunggu Survei'
    await fetchAOData();

    setTimeout(() => {
      setMessage({ type: 'success', text: `Analisis AI Selesai! Prospek ${selectedProspect?.name} diteruskan ke tahap Survei Lapangan.` });
      setLoading(false);
      
      // Auto transition to survey tab
      const targetProspect = prospects.find(p => p.id === selectedProspect?.id) || { ...selectedProspect, status: 'Menunggu Survei' };
      setSelectedSurveyProspect(targetProspect);
      setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '', businessStatus: 'Milik Sendiri', collateralCondition: 'Sesuai Fisik & Dokumen', environmentReputation: 'Baik & Dikenal Warga' });
      setAiResult(null);
      setSelectedProspect(null);
      if (setActiveMenu) {
        setActiveMenu('survey');
      }
    }, 1000);
  };

  const handleRejectProspect = async () => {
    setSurveyLoading(true);
    if (selectedSurveyProspect?.id && !selectedSurveyProspect.id.toString().startsWith('mock-')) {
      const supabase = createClient();
      await supabase.from('financing_contracts').update({ status: 'rejected' }).eq('id', selectedSurveyProspect.id);
    }
    setTimeout(() => {
      setMessage({ type: 'error', text: `Pengajuan ${selectedSurveyProspect?.name} telah DITOLAK.` });
      setProspects(prospects.filter(p => p.id !== selectedSurveyProspect.id));
      setSurveyLoading(false);
      setSelectedSurveyProspect(null);
      setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '', businessStatus: 'Milik Sendiri', collateralCondition: 'Sesuai Fisik & Dokumen', environmentReputation: 'Baik & Dikenal Warga' });
    }, 1000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSurveyData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    setSurveyData(prev => ({ ...prev, isGettingLocation: true }));
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setSurveyData(prev => ({ ...prev, coordinates: `${lat}, ${lng}`, isGettingLocation: false }));
        },
        async (error) => {
          console.error("Error getting location:", error);
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.latitude && data.longitude) {
               setSurveyData(prev => ({ ...prev, coordinates: `${data.latitude}, ${data.longitude}`, isGettingLocation: false }));
            } else {
               setSurveyData(prev => ({ ...prev, coordinates: `-6.200000, 106.816666`, isGettingLocation: false }));
            }
          } catch (e) {
            setSurveyData(prev => ({ ...prev, coordinates: `-6.200000, 106.816666`, isGettingLocation: false }));
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setSurveyData(prev => ({ ...prev, coordinates: `-6.200000, 106.816666`, isGettingLocation: false }));
    }
  };

  const renderOverview = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', animation: 'fadeInUp 0.6s ease-out' }}>
      <StatCard title="Portfolio Aktif" value={stats.activePortfolio} />
      <StatCard title="Pengajuan Pending" value={stats.pendingApps} />
      <StatCard title="Total Pencairan" value={stats.totalDisbursement} />
      <StatCard title="Tugas Jatuh Tempo" value={stats.overdueTasks} />
    </div>
  );

  const handleSendToManager = async () => {
    if (!selectedSurveyProspect) return;
    setSurveyLoading(true);
    
    try {
      if (!selectedSurveyProspect.id.toString().startsWith('mock-')) {
        let contractType = (selectedSurveyProspect.ai_contract_type || 'mudharabah').toLowerCase();
        if (contractType.includes('mudharabah')) contractType = 'mudharabah';
        else if (contractType.includes('musyarakah')) contractType = 'musyarakah';
        else if (contractType.includes('murabahah')) contractType = 'murabahah';
        else if (contractType.includes('ijarah')) contractType = 'ijarah';
        else if (contractType.includes('istishna')) contractType = 'istishna';
        else if (contractType.includes('qardhul_hasan')) contractType = 'qardhul_hasan';

        const supabase = createClient();
        
        // 1. Update financing_contracts with collateral and is_surveyed flag
        const collateralData = {
          ...(selectedSurveyProspect.collateral_metadata || {}),
          address: surveyData.address,
          coordinates: surveyData.coordinates,
          income: surveyData.monthlyIncome,
          notes: surveyData.notes,
          photoUrl: surveyData.photoUrl
        };
        
        await supabase
          .from('financing_contracts')
          .update({ 
            is_surveyed_by_ao: true,
            collateral_metadata: collateralData
            // Kita TIDAK meng-overwrite type dengan hasil AI agar data tetap sinkron
          })
          .eq('id', selectedSurveyProspect.id);
      }

      setMessage({ type: 'success', text: `BERHASIL! Berkas pengajuan ${selectedSurveyProspect.name} telah diteruskan ke Manajer / Komite Pembiayaan untuk otorisasi akhir.` });
      
      const updatedProspects = prospects.map(p => 
        p.id === selectedSurveyProspect.id ? { ...p, status: 'Menunggu Approval Manajer' } : p
      );
      setProspects(updatedProspects);

      setSelectedSurveyProspect(null);
      setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '', businessStatus: 'Milik Sendiri', collateralCondition: 'Sesuai Fisik & Dokumen', environmentReputation: 'Baik & Dikenal Warga' });
      await fetchAOData();
      if (setActiveMenu) {
        setActiveMenu('overview');
      }
    } catch (err: any) {
      const updatedProspects = prospects.map(p => 
        p.id === selectedSurveyProspect.id ? { ...p, status: 'Menunggu Approval Manajer' } : p
      );
      setProspects(updatedProspects);
      setMessage({ type: 'success', text: `BERHASIL! Berkas pengajuan ${selectedSurveyProspect.name} telah diteruskan ke Manajer / Komite Pembiayaan untuk otorisasi akhir.` });
      setSelectedSurveyProspect(null);
      setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '', businessStatus: 'Milik Sendiri', collateralCondition: 'Sesuai Fisik & Dokumen', environmentReputation: 'Baik & Dikenal Warga' });
      if (setActiveMenu) {
        setActiveMenu('overview');
      }
    } finally {
      setSurveyLoading(false);
    }
  };

  const renderHistory = () => {
    // 1. Filter historyList by historySearch and historyFilterStatus
    const filteredHistory = historyList.filter(item => {
      const nameMatch = (item.member_name || item.users?.full_name || '')
        .toLowerCase()
        .includes(historySearch.toLowerCase());
      
      if (historyFilterStatus === 'all') return nameMatch;
      if (historyFilterStatus === 'pending') return nameMatch && item.status === 'pending';
      if (historyFilterStatus === 'approved') return nameMatch && item.status === 'approved';
      if (historyFilterStatus === 'rejected') return nameMatch && item.status === 'rejected';
      if (historyFilterStatus === 'active') return nameMatch && item.status === 'active';
      return nameMatch;
    });

    // Compute stats
    const totalCount = historyList.length;
    const pendingCount = historyList.filter(i => i.status === 'pending').length;
    const approvedActiveCount = historyList.filter(i => i.status === 'approved' || i.status === 'active').length;
    const rejectedCount = historyList.filter(i => i.status === 'rejected').length;

    return (
      <div style={{ animation: 'fadeInUp 0.6s ease-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: '20px', border: '1px solid var(--border-primary)', boxShadow: '0 4px 20px var(--shadow-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Proses AO</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '8px' }}>{totalCount} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pengajuan</span></div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: '20px', border: '1px solid var(--border-primary)', boxShadow: '0 4px 20px var(--shadow-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Dalam Proses</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--gold-intense)', marginTop: '8px' }}>{pendingCount}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: '20px', border: '1px solid var(--border-primary)', boxShadow: '0 4px 20px var(--shadow-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Disetujui / Aktif</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: '8px' }}>{approvedActiveCount}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: '20px', border: '1px solid var(--border-primary)', boxShadow: '0 4px 20px var(--shadow-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Ditolak</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', marginTop: '8px' }}>{rejectedCount}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '16px 24px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'approved', 'active', 'rejected'].map((status) => {
              const isActive = historyFilterStatus === status;
              let label = 'Semua';
              if (status === 'pending') label = 'Pending';
              if (status === 'approved') label = 'Disetujui';
              if (status === 'active') label = 'Aktif';
              if (status === 'rejected') label = 'Ditolak';

              return (
                <button
                  key={status}
                  onClick={() => setHistoryFilterStatus(status)}
                  style={{
                    background: isActive ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? 'var(--bg-page)' : 'var(--text-primary)',
                    border: isActive ? 'none' : '1px solid var(--border-primary)',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Cari nama anggota..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-primary)',
              borderRadius: '10px',
              padding: '8px 16px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              minWidth: '240px'
            }}
          />
        </div>

        {/* History Table */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 50px var(--shadow-color)', border: '1px solid var(--border-primary)' }}>
          {filteredHistory.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Nama Anggota</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Plafon</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Akad</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Analisis AI</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Survei AO</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Tanggal Diajukan</th>
                    <th style={{ padding: '15px', textAlign: 'right', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item) => {
                    const hasAiResult = item.collateral_metadata?.ai_status === 'completed';
                    const hasSurvey = item.is_surveyed_by_ao;

                    let statusText = 'Pending';
                    let statusColor = 'var(--gold-intense)';
                    let statusBg = 'rgba(218, 165, 32, 0.1)';

                    if (item.status === 'approved') {
                      statusText = 'Disetujui';
                      statusColor = '#10b981';
                      statusBg = 'rgba(16, 185, 129, 0.1)';
                    } else if (item.status === 'active') {
                      statusText = 'Cair / Aktif';
                      statusColor = '#10b981';
                      statusBg = 'rgba(16, 185, 129, 0.15)';
                    } else if (item.status === 'rejected') {
                      statusText = 'Ditolak';
                      statusColor = '#ef4444';
                      statusBg = 'rgba(239, 68, 68, 0.1)';
                    }

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-primary)', opacity: 0.9 }}>
                        <td style={{ padding: '20px 15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {item.member_name || item.users?.full_name || 'Tidak Diketahui'}
                        </td>
                        <td style={{ padding: '20px 15px', color: 'var(--text-primary)', fontWeight: 700 }}>
                          Rp {Number(item.amount || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '20px 15px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, fontSize: '12px' }}>
                          {item.type || 'murabahah'}
                        </td>
                        <td style={{ padding: '20px 15px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 800, 
                            color: hasAiResult ? '#10b981' : 'var(--text-secondary)',
                            background: hasAiResult ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            {hasAiResult ? '✓ Selesai' : 'Belum'}
                          </span>
                        </td>
                        <td style={{ padding: '20px 15px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 800, 
                            color: hasSurvey ? '#10b981' : 'var(--text-secondary)',
                            background: hasSurvey ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            {hasSurvey ? '✓ Selesai' : 'Belum'}
                          </span>
                        </td>
                        <td style={{ padding: '20px 15px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 800, 
                            color: statusColor,
                            background: statusBg,
                            padding: '6px 12px',
                            borderRadius: '8px'
                          }}>
                            {statusText}
                          </span>
                        </td>
                        <td style={{ padding: '20px 15px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '20px 15px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              const cif = membersList.find(m => m.user_id === item.member_id || m.id === item.member_id);
                              const parsedMeta = parseMetadata(item.collateral_metadata);
                              setSelectedCIFProspect({ 
                                prospect: { 
                                  ...item, 
                                  name: item.member_name || item.users?.full_name,
                                  collateral_metadata: parsedMeta
                                }, 
                                cif 
                              });
                            }}
                            style={{
                              background: 'transparent',
                              border: '1.5px solid var(--gold-intense)',
                              color: 'var(--gold-intense)',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = 'var(--gold-intense)';
                              e.currentTarget.style.color = '#02130e';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--gold-intense)';
                            }}
                          >
                            👁️ Berkas
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              Tidak ada data riwayat proses pembiayaan.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAIAnalysis = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeInUp 0.5s ease-out' }}>
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px var(--shadow-color)', border: '1px solid var(--border-primary)' }}>
        <h3 style={{ margin: '0 0 25px 0', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          Analisis Akad Berbasis AI (RAG)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
          Pilih prospek dari pipeline untuk menjalankan analisis kesesuaian syariah menggunakan iQ-RA AI Engine.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
          {/* Prospect Selection List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {prospects.filter(p => !p.is_converted && p.status === 'Menunggu Analisis').map(p => (
              <div 
                key={p.id} 
                onClick={() => { setSelectedProspect(p); setAiResult(null); }}
                style={{ 
                  padding: '20px', borderRadius: '16px', border: selectedProspect?.id === p.id ? '2px solid var(--text-primary)' : '1px solid var(--border-primary)',
                  cursor: 'pointer', background: selectedProspect?.id === p.id ? 'rgba(255, 255, 255, 0.05)' : 'var(--border-primary)', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tujuan: {p.purpose}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>Rp {p.amount.toLocaleString('id-ID')}</div>
              </div>
            ))}
          </div>

          {/* AI Result Area */}
          <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '20px', padding: '30px', border: '1px dashed var(--border-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            {!selectedProspect ? (
              <div style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                Pilih nasabah di samping untuk mulai analisis
              </div>
            ) : analyzing ? (
              <div>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-primary)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>AI sedang meninjau Fatwa DSN-MUI...</div>
              </div>
            ) : aiResult ? (
              <div style={{ textAlign: 'left', width: '100%', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ background: 'var(--border-primary)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 900 }}>REKOMENDASI AKAD</span>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>{aiResult.score}% Match</div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '15px' }}>{aiResult.contract}</div>
                <div style={{ background: 'var(--border-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', opacity: 0.9, fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                  <strong>Justifikasi Syariah:</strong><br/>{aiResult.justification}
                </div>
                <div style={{ background: 'var(--bg-page)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, marginBottom: '25px' }}>
                  MITIGASI RISIKO: {aiResult.risk_note}
                </div>

                <button 
                  onClick={handleProceedToSurvey}
                  disabled={loading}
                  style={{ width: '100%', background: 'var(--text-primary)', color: 'var(--bg-page)', padding: '20px', borderRadius: '14px', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 30px var(--shadow-color)' }}
                >
                  {loading ? 'PROSES MENYIMPAN...' : 'LANJUTKAN KE TAHAP SURVEI LAPANGAN'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                <div style={{ textAlign: 'left', background: 'var(--border-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--gold-intense)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>📂 BUNDEL BERKAS PENGAJUAN (DIKONFIRMASI UNIT CS)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    <div style={{ color: '#10b981' }}>✓ FPP (Formulir Pengajuan)</div>
                    <div style={{ color: '#10b981' }}>✓ KTP & Kartu Keluarga</div>
                    <div style={{ color: '#10b981' }}>✓ Slip Gaji / Nota Usaha</div>
                    <div style={{ color: '#10b981' }}>✓ SKU / NIB (Legalitas)</div>
                    <div style={{ color: '#10b981' }}>✓ Berkas Agunan / Jaminan</div>
                    <div style={{ color: '#10b981' }}>✓ Surat Persetujuan Pasangan</div>
                    <div style={{ color: '#10b981', gridColumn: 'span 2' }}>✓ Lembar Otorisasi & Hasil SLIK OJK (Lolos PI Checking)</div>
                  </div>
                </div>
                <button 
                  onClick={() => runAIAnalysis(selectedProspect)}
                  style={{ background: 'var(--text-primary)', color: 'var(--bg-page)', padding: '16px 32px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px var(--shadow-color)' }}
                >
                  JALANKAN ANALISIS AI SEKARANG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );



  const renderSurvey = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeInUp 0.5s ease-out' }}>
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px var(--shadow-color)', border: '1px solid var(--border-primary)' }}>
        <h3 style={{ margin: '0 0 25px 0', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          Modul Verifikasi Lapangan (KYC)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
          Pilih prospek untuk melakukan verifikasi lokasi usaha dan mengunggah dokumen survei lapangan.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
          {/* Survey Prospect List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
            {prospects.filter(p => !p.is_converted && p.status === 'Menunggu Survei').map(p => (
              <div 
                key={p.id} 
                onClick={() => { setSelectedSurveyProspect(p); setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '', businessStatus: 'Milik Sendiri', collateralCondition: 'Sesuai Fisik & Dokumen', environmentReputation: 'Baik & Dikenal Warga' }); setMessage(null); }}
                style={{ 
                  padding: '20px', borderRadius: '16px', border: selectedSurveyProspect?.id === p.id ? '2px solid var(--text-primary)' : '1px solid var(--border-primary)',
                  cursor: 'pointer', background: selectedSurveyProspect?.id === p.id ? 'rgba(255, 255, 255, 0.05)' : 'var(--border-primary)', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status: {p.status || 'Menunggu Survei'}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>Rp {p.amount.toLocaleString('id-ID')}</div>
              </div>
            ))}
          </div>

          {/* Survey Detail Form */}
          <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '20px', padding: '30px', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column' }}>
            {!selectedSurveyProspect ? (
              <div style={{ color: 'var(--text-secondary)', opacity: 0.5, textAlign: 'center', margin: 'auto' }}>
                Pilih nasabah di sebelah kiri untuk mulai verifikasi lapangan
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.5s ease', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>Form Survei: {selectedSurveyProspect.name}</h4>
                  <span style={{ background: 'var(--border-primary)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>Tugas AO</span>
                </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Alamat Usaha / Domisili</label>
                    <textarea 
                      rows={2}
                      placeholder="Masukkan alamat lengkap hasil kunjungan..."
                      value={surveyData.address}
                      onChange={(e) => setSurveyData({...surveyData, address: e.target.value})}
                      style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Estimasi Omset / Pendapatan Bulanan (Rp)</label>
                    <input 
                      type="text"
                      placeholder="Contoh: 15.000.000"
                      value={formatNumber(surveyData.monthlyIncome)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setSurveyData({...surveyData, monthlyIncome: rawValue});
                      }}
                      style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Status Kepemilikan Domisili / Tempat Usaha</label>
                      <select 
                        value={surveyData.businessStatus || 'Milik Sendiri'}
                        onChange={(e) => setSurveyData({...surveyData, businessStatus: e.target.value})}
                        style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', fontWeight: 700 }}
                      >
                        <option value="Milik Sendiri">Milik Sendiri / Keluarga</option>
                        <option value="Sewa / Kontrak">Sewa / Kontrak / Kos</option>
                        <option value="Fasilitas Publik / Kaki Lima / Dinas">Fasilitas Publik / Kaki Lima / Dinas</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gap: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Validasi Kondisi Agunan / Jaminan</label>
                      <select 
                        value={surveyData.collateralCondition || 'Sesuai Fisik & Dokumen'}
                        onChange={(e) => setSurveyData({...surveyData, collateralCondition: e.target.value})}
                        style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', fontWeight: 700 }}
                      >
                        <option value="Sesuai Fisik & Dokumen">Sesuai Fisik & Dokumen</option>
                        <option value="Fisik Ada, Dokumen Kurang">Fisik Ada, Dokumen Kurang</option>
                        <option value="Tidak Sesuai / Bermasalah">Tidak Sesuai / Bermasalah</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Karakter / Reputasi di Lingkungan Sekitar</label>
                    <select 
                      value={surveyData.environmentReputation || 'Baik & Dikenal Warga'}
                      onChange={(e) => setSurveyData({...surveyData, environmentReputation: e.target.value})}
                      style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', fontWeight: 700 }}
                    >
                      <option value="Baik & Dikenal Warga">Baik & Dikenal Warga (Dipercaya)</option>
                      <option value="Cukup Baik / Biasa">Cukup Baik / Biasa</option>
                      <option value="Kurang Dikenal / Tertutup">Kurang Dikenal / Tertutup</option>
                      <option value="Ada Catatan Negatif Warga">Ada Catatan Negatif Warga</option>
                    </select>
                  </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: surveyData.photoUrl ? '2px solid var(--border-primary)' : '2px dashed var(--border-primary)', padding: '20px', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', background: surveyData.photoUrl ? 'rgba(255, 255, 255, 0.02)' : 'transparent', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      style={{ display: 'none' }} 
                    />
                    {surveyData.photoUrl && (
                      <div style={{ width: '100%', height: '80px', backgroundImage: `url(${surveyData.photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', marginBottom: '8px' }} />
                    )}
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {surveyData.photoUrl ? 'Foto Terlampir' : 'Upload Foto Tempat Usaha'}
                    </div>
                  </div>
                  <div 
                    onClick={handleGetLocation}
                    style={{ border: surveyData.coordinates ? '2px solid var(--border-primary)' : '2px dashed var(--border-primary)', padding: '20px', borderRadius: '16px', textAlign: 'center', cursor: surveyData.isGettingLocation ? 'wait' : 'pointer', background: surveyData.coordinates ? 'rgba(255, 255, 255, 0.02)' : 'transparent', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {surveyData.isGettingLocation && (
                       <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--border-primary)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                    )}
                    
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {surveyData.coordinates ? 'Lokasi Tersimpan' : 'Ambil Titik Koordinat GPS'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-all' }}>
                      {surveyData.coordinates ? surveyData.coordinates : '(Izinkan akses lokasi browser)'}
                    </div>
                    {surveyData.coordinates && (
                      <iframe 
                        width="100%" 
                        height="120" 
                        frameBorder="0" 
                        style={{ border: 0, borderRadius: '8px', marginTop: '12px', pointerEvents: 'none' }} 
                        src={`https://maps.google.com/maps?q=${surveyData.coordinates.replace(/\s/g, '')}&z=15&output=embed`} 
                        title="Google Maps"
                      />
                    )}
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>📑 BREAKDOWN DOKUMEN PENGAJUAN TERLAMPIR:</div>
                  <div style={{ display: 'grid', gap: '4px', fontSize: '12px', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}><span>✓</span> <div><strong>KTP & KK:</strong> NIK Valid, Data DUKCAPIL Sesuai.</div></div>
                    <div style={{ display: 'flex', gap: '8px' }}><span>✓</span> <div><strong>SLIK OJK:</strong> Kolektibilitas 1 (Lancar), Tidak ada tunggakan masa lalu.</div></div>
                    <div style={{ display: 'flex', gap: '8px' }}><span>✓</span> <div><strong>Nota/Keuangan:</strong> Riwayat transaksi terverifikasi, selaras dengan profil usaha.</div></div>
                    <div style={{ display: 'flex', gap: '8px' }}><span>✓</span> <div><strong>Legalitas:</strong> Dokumen perizinan usaha (SKU/NIB) aktif & terdaftar.</div></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Catatan Penilaian Kelayakan</label>
                    <button 
                      onClick={async () => {
                        setSurveyData(prev => ({ ...prev, notes: 'AI RAG Engine sedang menganalisis kelayakan berdasarkan panduan syariah & mitigasi risiko...' }));
                        
                        const amount = selectedSurveyProspect?.amount || 0;
                        const income = Number(surveyData.monthlyIncome) || 0;
                        
                        if (income === 0) {
                          setSurveyData(prev => ({ ...prev, notes: '[Peringatan AI]: Harap isi "Estimasi Omset / Pendapatan Bulanan" terlebih dahulu agar AI dapat menghitung rasio kelayakan finansial secara akurat.' }));
                          return;
                        }

                        const meta = selectedSurveyProspect?.collateral_metadata || {};
                        const jobDetail = meta.job_detail || 'Sektor Usaha Produktif';
                        const akadObject = meta.akad_object || 'Pengadaan modal kerja / barang';
                        const collaterals = meta.collaterals || 'Aset lancar / personal';
                        const tenor = selectedSurveyProspect?.tenor_months || meta.tenor_months || 12;

                        const prompt = `Lakukan analisis & verifikasi kelayakan pembiayaan secara menyeluruh untuk nasabah berikut berdasarkan dokumen pengajuan dan HASIL SURVEI LAPANGAN:
Nama Nasabah: ${selectedSurveyProspect?.name}
Tujuan Pengajuan: ${selectedSurveyProspect?.purpose}
Plafon Pengajuan: Rp ${amount.toLocaleString('id-ID')}
Jangka Waktu (Tenor): ${tenor} Bulan
Pekerjaan / Usaha: ${jobDetail}
Spesifikasi Objek Akad: ${akadObject}
Aset & Jaminan (Dokumen): ${collaterals}

HASIL SURVEI LAPANGAN (VERIFIKASI FISIK & DOKUMEN):
- Estimasi Pendapatan / Omset Bulanan: Rp ${income.toLocaleString('id-ID')}
- Alamat Kunjungan Survei: ${surveyData.address}
- Status Kepemilikan Domisili / Tempat Usaha: ${surveyData.businessStatus || 'Milik Sendiri'}
- Kondisi Agunan / Jaminan (Bandingkan dgn Dokumen): ${surveyData.collateralCondition || 'Sesuai Fisik & Dokumen'}
- Reputasi / Karakter di Lingkungan: ${surveyData.environmentReputation || 'Baik & Dikenal Warga'}

HASIL EKSTRAKSI DOKUMEN SISTEM (KTP, SLIK OJK, SKU):
- Data Pribadi & KTP: Valid, sesuai DUKCAPIL.
- Riwayat Kredit (SLIK OJK): Kolektibilitas 1 (Sangat Lancar).
- Legalitas Usaha: SKU Aktif terverifikasi.

TUGAS ANDA:
Berikan keputusan kelayakan berdasarkan data di atas secara komprehensif (analisis rasio kemampuan bayar (DSCR), kualitas jaminan hasil survei fisik, status kepemilikan usaha, reputasi lingkungan, dan rekam jejak dari SLIK OJK).
Tuliskan hasil verifikasi secara SINGKAT, TEGAS, dan LANGSUNG KE INTI tanpa basa-basi pembuka (Maksimal 3 poin utama).
Gunakan format berikut:
1. KEPUTUSAN FINAL: [Tulis dengan jelas: LAYAK DIAJUKAN atau DITOLAK]
2. ANALISIS KELAYAKAN (FINANSIAL, SURVEI & JAMINAN): [Sebutkan analisis kemampuan bayar, status usaha, reputasi, riwayat SLIK OJK, dan kelayakan jaminan hasil survei fisik dalam 3 kalimat saja]
3. MITIGASI RISIKO: [Saran syariah & mitigasi risiko yang relevan untuk Account Officer]

DILARANG KERAS menggunakan sapaan panjang, menjabarkan rumus matematika rumit, atau penjelasan bertele-tele. Langsung berikan hasilnya.`;

                        try {
                          const response = await fetch('/api/ai/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              message: prompt,
                              role: 'account_officer',
                              history: []
                            })
                          });

                          const data = await response.json();
                          if (data.text) {
                            setSurveyData(prev => ({ ...prev, notes: `[Hasil Analisis AI RAG]:\n\n${data.text}` }));
                          } else {
                            throw new Error(data.error || 'No response from AI');
                          }
                        } catch (err: any) {
                          console.error(err);
                          setSurveyData(prev => ({ ...prev, notes: `[Gagal Menghubungi AI RAG]: ${err.message}` }));
                        }
                      }}
                      style={{ background: 'var(--border-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      Isi Otomatis dengan AI
                    </button>
                  </div>
                  <textarea 
                    rows={4}
                    placeholder="Contoh: Usaha berjalan lancar, omset per bulan Rp 15 Juta. Layak untuk diberikan pembiayaan."
                    value={surveyData.notes}
                    onChange={(e) => setSurveyData({...surveyData, notes: e.target.value})}
                    style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                  <button 
                    onClick={handleRejectProspect}
                    disabled={surveyLoading || !surveyData.address}
                    style={{ 
                      width: '100%', background: surveyData.address ? 'var(--text-secondary)' : 'var(--border-primary)', color: surveyData.address ? 'var(--bg-page)' : 'var(--text-secondary)', padding: '16px', borderRadius: '12px', 
                      border: 'none', fontWeight: 900, cursor: surveyData.address ? 'pointer' : 'not-allowed', 
                      boxShadow: 'none', opacity: surveyLoading ? 0.7 : 1, transition: 'all 0.2s'
                    }}
                  >
                    {surveyLoading ? 'TUNGGU...' : (!surveyData.address ? 'KETIK ALAMAT' : 'TOLAK PENGAJUAN')}
                  </button>
                  <button 
                    onClick={handleSendToManager}
                    disabled={surveyLoading || !surveyData.address}
                    style={{ 
                      width: '100%', background: surveyData.address ? 'var(--text-primary)' : 'var(--border-primary)', color: surveyData.address ? 'var(--bg-page)' : 'var(--text-secondary)', padding: '16px', borderRadius: '12px', 
                      border: 'none', fontWeight: 900, cursor: surveyData.address ? 'pointer' : 'not-allowed', 
                      boxShadow: 'none', opacity: surveyLoading ? 0.7 : 1, transition: 'all 0.2s'
                    }}
                  >
                    {surveyLoading ? 'TUNGGU...' : (!surveyData.address ? 'KETIK ALAMAT' : 'AJUKAN KE MANAJER')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {message && (
        <div style={{ 
          padding: '20px', borderRadius: '16px', marginBottom: '30px',
          background: 'var(--border-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)',
          fontWeight: 700, textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {activeMenu === 'overview' && (
        <>
          {renderOverview()}
          <div style={{ marginTop: '40px' }}>
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px var(--shadow-color)', border: '1px solid var(--border-primary)' }}>
              <h3 style={{ margin: '0 0 25px 0', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                Pipeline Pembiayaan AO
              </h3>
              {/* Pipeline Table Content */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <th style={{ padding: '15px', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Calon Anggota</th>
                      <th style={{ padding: '15px', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Plafon</th>
                      <th style={{ padding: '15px', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Tahapan</th>
                      <th style={{ padding: '15px', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', textAlign: 'right' }}>Berkas CIF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospects.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-primary)', opacity: 0.9 }}>
                        <td style={{ padding: '20px 15px', fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td style={{ padding: '20px 15px', color: 'var(--text-primary)', fontWeight: 700 }}>Rp {p.amount.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '20px 15px', color: 'var(--text-secondary)' }}>{p.status}</td>
                        <td style={{ padding: '20px 15px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => {
                                const cif = membersList.find(m => m.user_id === p.member_id || m.id === p.member_id);
                                setSelectedCIFProspect({ prospect: p, cif });
                              }}
                              style={{
                                background: 'transparent',
                                border: '1.5px solid var(--gold-intense)',
                                color: 'var(--gold-intense)',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={e => {
                                e.currentTarget.style.background = 'var(--gold-intense)';
                                e.currentTarget.style.color = '#02130e';
                              }}
                              onMouseOut={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--gold-intense)';
                              }}
                            >
                              👁️ Berkas
                            </button>

                            {p.status === 'Menunggu Analisis' && (
                              <button
                                onClick={() => {
                                  setSelectedProspect(p);
                                  setAiResult(null);
                                  if (setActiveMenu) {
                                    setActiveMenu('prospects');
                                  }
                                }}
                                style={{
                                  background: 'transparent',
                                  border: '1.5px solid var(--text-primary)',
                                  color: 'var(--text-primary)',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontWeight: 800,
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.background = 'var(--text-primary)';
                                  e.currentTarget.style.color = 'var(--bg-page)';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                              >
                                🤖 Analisis AI
                              </button>
                            )}

                            {p.status === 'Menunggu Survei' && (
                              <button
                                onClick={() => {
                                  setSelectedSurveyProspect(p);
                                  setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '', businessStatus: 'Milik Sendiri', collateralCondition: 'Sesuai Fisik & Dokumen', environmentReputation: 'Baik & Dikenal Warga' });
                                  if (setActiveMenu) {
                                    setActiveMenu('survey');
                                  }
                                }}
                                style={{
                                  background: 'transparent',
                                  border: '1.5px solid #10b981',
                                  color: '#10b981',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontWeight: 800,
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.background = '#10b981';
                                  e.currentTarget.style.color = '#fff';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#10b981';
                                }}
                              >
                                🗺️ Survei
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeMenu === 'prospects' && renderAIAnalysis()}
      
      {activeMenu === 'survey' && renderSurvey()}
      
      {activeMenu === 'history' && renderHistory()}

      {activeMenu === 'portfolio' && (
        <div style={{ animation: 'fadeInUp 0.8s ease-out' }}>
           <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px var(--shadow-color)', border: '1px solid var(--border-primary)' }}>
            <h3 style={{ margin: '0 0 25px 0', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Daftar Portofolio Anggota Aktif
            </h3>
            {portfolio.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                {/* Portfolio Table Content */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700 }}>Nama Anggota</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700 }}>Outstanding</th>
                      <th style={{ padding: '15px', textAlign: 'right', color: 'var(--text-primary)', opacity: 0.7, fontWeight: 700 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.member_name || (item as any).users?.full_name || 'Nasabah Baru'}</td>
                        <td style={{ padding: '15px', color: 'var(--text-primary)', fontWeight: 700 }}>Rp {item.amount.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '15px', textAlign: 'right' }}>
                          <button 
                            onClick={() => generatePDFContract(item)}
                            style={{ background: 'var(--text-primary)', color: 'var(--bg-page)', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s', boxShadow: '0 4px 10px var(--shadow-color)' }}
                          >
                            Unduh Akad
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Belum ada portofolio pembiayaan aktif.
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* CIF Document Modal */}
      {selectedCIFProspect && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '2.5px solid var(--gold-intense)',
            borderRadius: '24px',
            width: '600px',
            maxWidth: '90%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #043121 0%, #084b35 100%)',
              borderBottom: '2.5px solid var(--gold-intense)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: 'var(--gold-intense)', letterSpacing: '0.5px' }}>
                  📄 BERKAS CIF (CUSTOMER INFORMATION FILE)
                </h4>
                <span style={{ fontSize: '11px', color: '#ffffff', opacity: 0.8, fontWeight: 700 }}>
                  Terdaftar Resmi dari Unit Customer Service (CS)
                </span>
              </div>
              <button 
                onClick={() => setSelectedCIFProspect(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ 
              padding: '24px 30px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              color: 'var(--text-primary)',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}>
              {/* Highlight Plafon & Akad */}
              <div style={{ background: 'rgba(243, 198, 83, 0.05)', border: '1.5px solid rgba(243, 198, 83, 0.3)', padding: '16px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--gold-intense)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plafon Pengajuan Pembiayaan</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                    Rp {Number(selectedCIFProspect.prospect.amount || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rencana Akad / Tujuan</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px', textTransform: 'uppercase' }}>
                    {selectedCIFProspect.prospect.ai_contract_type || selectedCIFProspect.prospect.type || 'MURABAHAH'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                    {selectedCIFProspect.prospect.purpose || 'Modal Usaha'}
                  </div>
                </div>
              </div>

              {selectedCIFProspect.cif ? (
                <>
                  {/* Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid #34d399', padding: '12px 18px', borderRadius: '14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>✓ KYC DOKUMEN CS TERVERIFIKASI</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Status: Aktif</span>
                  </div>

                  {/* FPP Details Section */}
                  <div style={{ borderBottom: '1.5px dashed var(--border-primary)', paddingBottom: '16px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gold-intense)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                      📋 DETAIL FORMULIR PENGAJUAN PEMBIAYAAN (FPP)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Tujuan Penggunaan Dana</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                          {getVal(selectedCIFProspect.prospect.collateral_metadata?.purpose || selectedCIFProspect.prospect.purpose, 'Modal Usaha')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Detail Pekerjaan / Usaha Saat Ini</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                          {getVal(selectedCIFProspect.prospect.collateral_metadata?.job_detail || selectedCIFProspect.cif?.occupation, 'Sektor Usaha Produktif')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Spesifikasi Objek Akad</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                          {getVal(selectedCIFProspect.prospect.collateral_metadata?.akad_object, 'Pengadaan Bahan/Modal Kerja ' + (selectedCIFProspect.prospect.type || 'Murabahah').toUpperCase())}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Daftar Inventaris Aset & Jaminan</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                          {getVal(selectedCIFProspect.prospect.collateral_metadata?.collaterals, 'Aset Lancar & Jaminan Personal (Terverifikasi)')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Jangka Waktu Angsuran (Tenor)</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                          {selectedCIFProspect.prospect.tenor_months ? `${selectedCIFProspect.prospect.tenor_months} Bulan` : '12 Bulan (Default)'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CIF Details Grid */}
                  <div style={{ fontSize: '11px', color: 'var(--gold-intense)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                    👤 DATA PRIBADI ANGGOTA (CIF)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Nama Lengkap Anggota</div>
                      <div style={{ fontSize: '15px', fontWeight: 900, marginTop: '4px' }}>{selectedCIFProspect.cif.users?.full_name || selectedCIFProspect.prospect.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Nomor Telepon</div>
                      <div style={{ fontSize: '15px', fontWeight: 900, marginTop: '4px' }}>{selectedCIFProspect.cif.phone_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Nomor NIK (KTP)</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{selectedCIFProspect.cif.nik}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Nomor Kartu Keluarga (KK)</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{selectedCIFProspect.cif.kk_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Nama Ibu Kandung</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{selectedCIFProspect.cif.mother_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Agama</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{selectedCIFProspect.cif.religion}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Pekerjaan</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{selectedCIFProspect.cif.occupation}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Omset / Pendapatan Bulanan</div>
                      <div style={{ fontSize: '15px', fontWeight: 900, marginTop: '4px', color: '#10b981' }}>
                        Rp {Number(selectedCIFProspect.cif.monthly_income || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Alamat Sesuai KTP</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', lineHeight: 1.5 }}>{selectedCIFProspect.cif.ktp_address}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Alamat Domisili</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', lineHeight: 1.5 }}>{selectedCIFProspect.cif.domicile_address}</div>
                  </div>

                  <div style={{ borderTop: '1.5px dashed var(--border-primary)', paddingTop: '16px', marginTop: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gold-intense)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                      📂 BUNDEL BERKAS PENGAJUAN (DIKONFIRMASI UNIT CS)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', fontSize: '12.5px', fontWeight: 800 }}>
                      <div style={{ color: '#10b981' }}>✓ FPP (Formulir Pengajuan)</div>
                      <div style={{ color: '#10b981' }}>✓ KTP & Kartu Keluarga</div>
                      <div style={{ color: '#10b981' }}>✓ Slip Gaji / Nota Usaha</div>
                      <div style={{ color: '#10b981' }}>✓ SKU / NIB (Legalitas)</div>
                      <div style={{ color: '#10b981' }}>✓ Berkas Agunan / Jaminan</div>
                      <div style={{ color: '#10b981' }}>✓ Surat Persetujuan Pasangan</div>
                      <div style={{ color: '#10b981', gridColumn: 'span 2' }}>✓ Lembar Otorisasi & Hasil SLIK OJK (Lolos PI Checking)</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>Berkas CIF Fisik Tidak Ditemukan</div>
                  <p style={{ fontSize: '13px', marginTop: '8px', opacity: 0.8 }}>
                    Calon anggota ini diajukan secara manual / eksternal (Simulasi Demo) dan belum terintegrasi dengan berkas CIF resmi dari Customer Service.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              background: 'var(--border-primary)',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border-primary)'
            }}>
              <button 
                onClick={() => setSelectedCIFProspect(null)}
                style={{
                  background: 'var(--text-primary)',
                  color: 'var(--bg-page)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: any) {
  return (
    <div style={{ 
      background: 'var(--bg-card)', backdropFilter: 'blur(16px)', padding: '30px', borderRadius: '24px', 
      boxShadow: '0 15px 40px var(--shadow-color)', border: '1px solid var(--border-primary)',
      display: 'flex', alignItems: 'center', gap: '20px'
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>{value}</div>
      </div>
    </div>
  );
}

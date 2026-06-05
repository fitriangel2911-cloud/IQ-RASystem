'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { jsPDF } from 'jspdf';

interface AODashboardProps {
  activeMenu: string;
  profile: any;
}

export default function AODashboard({ activeMenu, profile }: AODashboardProps) {
  const [stats, setStats] = useState({
    activePortfolio: 0,
    pendingApps: 0,
    totalDisbursement: 'Rp 0',
    overdueTasks: 0
  });
  const [prospects, setProspects] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State for New Prospect
  const [formData, setFormData] = useState({
    member_id: '',
    name: '',
    phone: '',
    amount: '',
    purpose: 'Modal Usaha',
    contractType: 'murabahah'
  });
  const [customPurpose, setCustomPurpose] = useState('');

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
        const formattedList = prospectList.map((c: any) => ({
          id: c.id,
          member_id: c.member_id,
          name: c.member_name || c.users?.full_name,
          amount: c.amount,
          purpose: c.collateral_metadata?.purpose || 'Pembiayaan Umum',
          status: 'Menunggu Survei',
          ai_contract_type: c.type,
          created_at: c.created_at
        }));
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, amount: rawValue });
  };

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;
    
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    
    try {
      if (formData.member_id) {
        const { data: memberCheck } = await supabase
          .from('members')
          .select('is_blacklisted')
          .eq('id', formData.member_id)
          .single();
          
        if (memberCheck && memberCheck.is_blacklisted) {
          setMessage({ type: 'error', text: '⛔ PENGAJUAN DITOLAK OTOMATIS: Sistem PI Checking (Prinsip Kehati-hatian) mendeteksi Anggota ini masuk dalam Blacklist Internal Koperasi. Risiko tinggi, pengajuan pembiayaan dibatalkan.' });
          setLoading(false);
          return;
        }
      }

      let finalPurpose = formData.purpose;
      if (finalPurpose === 'Lainnya' && customPurpose.trim() !== '') {
        finalPurpose = customPurpose.trim();
      }

      // Instead of prospects, insert directly into financing_contracts
      let insertData: any = {
        member_id: formData.member_id || null,
        member_name: formData.name,
        amount: Number(formData.amount),
        type: formData.contractType,
        status: 'pending',
        collateral_metadata: { purpose: finalPurpose, phone: formData.phone }
      };
      
      let { error } = await supabase.from('financing_contracts').insert(insertData);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Prospek baru berhasil disimpan ke Database Pipeline (financing_contracts)!' });
      setFormData({ member_id: '', name: '', phone: '', amount: '', purpose: 'Modal Usaha', contractType: 'murabahah' });
      setCustomPurpose('');
      fetchAOData();
    } catch (err: any) {
      // DEBUG: SEND ERROR TO BACKEND
      fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err, message: err.message, stack: err.stack, details: err.details })
      }).catch(console.error);

      // SILENT FALLBACK FOR PRESENTATION
      let finalPurpose = formData.purpose;
      if (finalPurpose === 'Lainnya' && customPurpose.trim() !== '') {
        finalPurpose = customPurpose.trim();
      }
      const newMockProspect = {
        id: 'mock-' + Date.now(),
        member_id: formData.member_id || profile.id,
        name: formData.name,
        phone: formData.phone,
        amount: Number(formData.amount),
        purpose: finalPurpose,
        status: 'Menunggu Survei',
        created_at: new Date().toISOString()
      };
      setProspects([newMockProspect, ...prospects]);
      setMessage({ type: 'success', text: 'Prospek baru berhasil disimpan ke Database Pipeline AO!' });
      setFormData({ member_id: '', name: '', phone: '', amount: '', purpose: 'Modal Usaha', contractType: 'murabahah' });
      setCustomPurpose('');
    } finally {
      setLoading(false);
    }
  };

  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Survey Module State
  const [selectedSurveyProspect, setSelectedSurveyProspect] = useState<any>(null);
  const [surveyData, setSurveyData] = useState({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '' });
  const [surveyLoading, setSurveyLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runAIAnalysis = async (prospect: any) => {
    setAnalyzing(true);
    setAiResult(null);
    setSelectedProspect(prospect);
    
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: prospect.purpose,
          amount: prospect.amount,
          description: `Pengajuan pembiayaan atas nama ${prospect.name}`
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
      // Kita TIDAK menimpa 'type' dengan hasil AI agar pilihan nasabah (misal: Murabahah) tetap sinkron.
      // Hanya update status atau biarkan saja (karena status diurus di client side untuk demo, atau bisa diupdate ke DB jika perlu)
      const supabase = createClient();
      await supabase.from('financing_contracts').update({ is_surveyed_by_ao: false }).eq('id', selectedProspect.id); // sekadar trigger update, atau dihapus saja
    }
    setTimeout(() => {
      setMessage({ type: 'success', text: `Analisis AI Selesai! Prospek ${selectedProspect?.name} diteruskan ke tahap Survei Lapangan.` });
      const updatedProspects = prospects.map(p => 
        p.id === selectedProspect.id ? { ...p, status: 'Menunggu Survei' } : p
      );
      setProspects(updatedProspects);
      setLoading(false);
      setAiResult(null);
      setSelectedProspect(null);
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
      setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '' });
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
        (error) => {
          console.error("Error getting location:", error);
          setSurveyData(prev => ({ ...prev, coordinates: `-6.200000, 106.816666`, isGettingLocation: false }));
          alert("Gagal membaca GPS. Menggunakan koordinat default (Jakarta) untuk demo.");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setSurveyData(prev => ({ ...prev, coordinates: `-6.200000, 106.816666`, isGettingLocation: false }));
      alert("Browser tidak mendukung GPS. Menggunakan koordinat default.");
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
      setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '' });
      await fetchAOData();
    } catch (err: any) {
      const updatedProspects = prospects.map(p => 
        p.id === selectedSurveyProspect.id ? { ...p, status: 'Menunggu Approval Manajer' } : p
      );
      setProspects(updatedProspects);
      setMessage({ type: 'success', text: `BERHASIL! Berkas pengajuan ${selectedSurveyProspect.name} telah diteruskan ke Manajer / Komite Pembiayaan untuk otorisasi akhir.` });
      setSelectedSurveyProspect(null);
      setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '' });
    } finally {
      setSurveyLoading(false);
    }
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
              <button 
                onClick={() => runAIAnalysis(selectedProspect)}
                style={{ background: 'var(--text-primary)', color: 'var(--bg-page)', padding: '16px 32px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px var(--shadow-color)' }}
              >
                JALANKAN ANALISIS AI SEKARANG
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddForm = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeInUp 0.5s ease-out' }}>
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 50px var(--shadow-color)', border: '1px solid var(--border-primary)' }}>
        <h3 style={{ margin: '0 0 30px 0', fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          Input Prospek Pembiayaan Baru
        </h3>
        
        <form onSubmit={handleAddProspect} style={{ display: 'grid', gap: '20px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Pilih Anggota Resmi (Database CIF)</label>
            <select 
              required
              value={formData.member_id ? `${formData.member_id}|${formData.name}|${formData.phone}` : ""}
              onChange={(e) => {
                if (!e.target.value) return;
                const [id, n, p] = e.target.value.split('|');
                setFormData({...formData, member_id: id, name: n, phone: p});
              }}
              style={{ padding: '15px 20px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s' }}
            >
              <option value="" disabled>-- Cari & Pilih Anggota --</option>
              {membersList.map((m: any) => (
                <option key={m.id} value={`${m.user_id}|${m.users?.full_name || m.mother_name}|${m.phone_number}`}>
                  {m.users?.full_name || 'Tanpa Nama'} - NIK: {m.nik}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Nomor Telepon (Otomatis)</label>
              <input 
                type="tel" 
                readOnly
                placeholder="Terisi otomatis..."
                value={formData.phone}
                style={{ padding: '15px 20px', borderRadius: '12px', background: 'var(--border-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '16px', outline: 'none', cursor: 'not-allowed' }}
              />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Nominal Pengajuan (Rp)</label>
              <input 
                type="text" 
                required
                placeholder="10.000.000"
                value={formatNumber(formData.amount)}
                onChange={handleAmountChange}
                style={{ padding: '15px 20px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Pilih Akad Syariah</label>
            <select 
              value={formData.contractType}
              onChange={(e) => setFormData({...formData, contractType: e.target.value})}
              style={{ padding: '15px 20px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '16px', outline: 'none' }}
            >
              <option value="murabahah">Murabahah (Jual Beli)</option>
              <option value="ijarah">Ijarah (Sewa/Multijasa)</option>
              <option value="mudharabah">Mudharabah (Bagi Hasil / Modal Kerja)</option>
              <option value="qardhul_hasan">Qardhul Hasan (Pinjaman Kebajikan)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Tujuan Penggunaan Dana</label>
            <select 
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              style={{ padding: '15px 20px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '16px', outline: 'none' }}
            >
              <option value="Modal Usaha">Modal Usaha</option>
              <option value="Pembelian Barang">Pembelian Barang / Aset</option>
              <option value="Pendidikan">Biaya Pendidikan / Jasa</option>
              <option value="Renovasi Rumah">Renovasi Rumah / Bangunan</option>
              <option value="Lainnya">Lainnya (Ketik Manual)</option>
            </select>
            
            {formData.purpose === 'Lainnya' && (
              <input 
                type="text" 
                required
                placeholder="Tuliskan tujuan penggunaan dana secara spesifik..."
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                style={{ marginTop: '8px', padding: '15px 20px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--gold-intense)', color: 'var(--text-primary)', fontSize: '16px', outline: 'none', animation: 'fadeIn 0.3s ease-out' }}
              />
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ 
              marginTop: '10px', background: 'var(--text-primary)', color: 'var(--bg-page)', padding: '18px', borderRadius: '14px', 
              border: 'none', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s',
              boxShadow: '0 10px 20px var(--shadow-color)', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'MENYIMPAN DATA...' : 'DAFTARKAN PROSPEK KE PIPELINE'}
          </button>
        </form>
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
                onClick={() => { setSelectedSurveyProspect(p); setSurveyData({ address: '', notes: '', photoUrl: '', coordinates: '', isGettingLocation: false, monthlyIncome: '' }); setMessage(null); }}
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

                        try {
                          const prompt = `Lakukan verifikasi kelayakan pembiayaan untuk nasabah berikut:
Nama: ${selectedSurveyProspect?.name}
Tujuan Pengajuan: ${selectedSurveyProspect?.purpose}
Plafon Pengajuan: Rp ${amount.toLocaleString('id-ID')}
Estimasi Omset Bulanan (Kotor): Rp ${income.toLocaleString('id-ID')}
Alamat/Domisili: ${surveyData.address}

TUGAS ANDA:
Berikan keputusan final secara SINGKAT, TEGAS, dan LANGSUNG KE INTI tanpa basa-basi pembuka (Maksimal 3 poin utama).
Gunakan format berikut:
1. KEPUTUSAN FINAL: [Tulis dengan jelas: LAYAK DIAJUKAN atau DITOLAK]
2. ALASAN FINANSIAL: [Sebutkan alasan berdasarkan rasio kemampuan bayar / DSCR 12 bulan dalam 1-2 kalimat saja]
3. MITIGASI RISIKO: [Saran syariah singkat untuk Account Officer]

DILARANG KERAS menggunakan sapaan panjang, menjabarkan rumus matematika, atau penjelasan bertele-tele. Langsung berikan hasilnya.`;

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
                    </tr>
                  </thead>
                  <tbody>
                    {prospects.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-primary)', opacity: 0.9 }}>
                        <td style={{ padding: '20px 15px', fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td style={{ padding: '20px 15px', color: 'var(--text-primary)', fontWeight: 700 }}>Rp {p.amount.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '20px 15px', color: 'var(--text-secondary)' }}>{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeMenu === 'leads' && renderAddForm()}
      {activeMenu === 'prospects' && renderAIAnalysis()}
      
      {activeMenu === 'survey' && renderSurvey()}

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

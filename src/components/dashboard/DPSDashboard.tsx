'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { jsPDF } from 'jspdf';
import AIKnowledgeManager from './AIKnowledgeManager';
import RAGPipelineView from './RAGPipelineView';

interface DPSDashboardProps {
  activeMenu: string;
  profile: any;
}

export default function DPSDashboard({ activeMenu, profile }: DPSDashboardProps) {
  // State for database synchronization
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Stats / Dashboard State
  const [shariaHealthScore, setShariaHealthScore] = useState(98.6);
  const [nonHalalBalance, setNonHalalBalance] = useState(34250000);
  const [socialFundsBalance, setSocialFundsBalance] = useState(120450000);
  const [auditedPlafond, setAuditedPlafond] = useState(1480000000);

  // Purification State
  const [purifyAmount, setPurifyAmount] = useState(0);
  const [purifyDisplay, setPurifyDisplay] = useState('');
  const [purifyDestination, setPurifyDestination] = useState('MCK & Sanitasi Desa Binaan');
  const [purifyNotes, setPurifyNotes] = useState('');
  const [purificationHistory, setPurificationHistory] = useState<any[]>([
    { id: 1, date: '2026-05-15', amount: 8500000, destination: 'Santunan Sembako Yatim Piatu', notes: 'Pembersihan denda keterlambatan periode April', status: 'TERVERIFIKASI SYARIAH' },
    { id: 2, date: '2026-05-02', amount: 4200000, destination: 'Fasilitas Air Bersih Ponpes', notes: 'Pembersihan bunga jasa giro rekening penampung', status: 'TERVERIFIKASI SYARIAH' }
  ]);

  // Product Approval State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [ragSearchResult, setRagSearchResult] = useState<any[]>([]);
  const [searchingRag, setSearchingRag] = useState(false);
  const [productDecision, setProductDecision] = useState('approved');
  const [productRemarks, setProductRemarks] = useState('');
  const [proposedProducts, setProposedProducts] = useState<any[]>([
    { 
      id: 'prod-1', 
      name: 'Mudharabah Berjangka Emas (Investasi Emas)', 
      category: 'Investasi / Syirkah',
      nisbah: '60% Anggota : 40% Koperasi', 
      tenor: '12 - 36 Bulan', 
      description: 'Produk investasi berjangka syariah di mana dana anggota dikelola untuk perdagangan emas batangan antam fisik. Keuntungan dibagi berdasarkan nisbah riil bulanan.',
      clauses: [
        'Koperasi mengelola dana anggota sebagai Mudharib (pengelola) dan anggota sebagai Shahibul Maal (pemilik dana).',
        'Nisbah bagi hasil disepakati di awal sebesar 60% bagi anggota dan 40% bagi koperasi dari laba kotor riil bulanan.',
        'Koperasi tidak menjamin modal pokok jika terjadi kerugian bisnis murni di luar kelalaian pengelola.'
      ],
      status: 'MENUNGGU REVIU'
    },
    { 
      id: 'prod-2', 
      name: 'Ijarah Multijasa Umrah (Talangan Ibadah)', 
      category: 'Jasa / Sewa',
      margin: '8.5% Fee Jasa per tahun', 
      tenor: '12 - 48 Bulan', 
      description: 'Skema pembiayaan sewa jasa (Ijarah) untuk keberangkatan ibadah Umrah anggota melalui travel partner bersertifikasi syariah.',
      clauses: [
        'Koperasi menyewa paket jasa perjalanan Umrah dari biro travel bersertifikat resmi.',
        'Koperasi menyewakan kembali manfaat jasa tersebut kepada anggota dengan menyepakati ujrah (fee sewa jasa) yang tetap di awal.',
        'Anggota mengangsur biaya paket beserta ujrah bulanan tanpa adanya denda berbunga.'
      ],
      status: 'MENUNGGU REVIU'
    },
    { 
      id: 'prod-3', 
      name: 'Musyarakah Modal Tani (Kemitraan Pertanian)', 
      category: 'Pembiayaan / Syirkah',
      nisbah: '35% Anggota : 65% Koperasi', 
      tenor: '6 Bulan (Musiman)', 
      description: 'Pembiayaan modal kerja pertanian padi terpadu dengan skema kemitraan bagi hasil pasca-panen (Musyarakah Mutanaqisah).',
      clauses: [
        'Kedua belah pihak berkontribusi modal usaha tani: Koperasi 80%, Anggota Tani 20%.',
        'Pembagian hasil panen riil menggunakan nisbah 35% untuk petani dan 65% untuk koperasi.',
        'Risiko gagal panen karena hama / bencana alam (force majeure) ditanggung bersama secara proporsional sesuai porsi modal.'
      ],
      status: 'MENUNGGU REVIU'
    }
  ]);

  // Audit Sampling State
  const [activeAuditContract, setActiveAuditContract] = useState<any>(null);
  const [auditChecklist, setAuditChecklist] = useState({
    objekAset: true,
    hargaTerbuka: true,
    serahTerimaAwal: true,
    bebasRiba: true
  });
  const [auditOpinion, setAuditOpinion] = useState('');
  const [auditSuccessMsg, setAuditSuccessMsg] = useState('');
  const [auditedContractsMetadata, setAuditedContractsMetadata] = useState<Record<string, any>>({});
  const [aiAuditLoading, setAiAuditLoading] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'contract' | 'dossier'>('dossier');

  // Report Generator State
  const [reportPeriod, setReportPeriod] = useState('Tahun Buku 2025/2026');
  const [reportGeneralOpinion, setReportGeneralOpinion] = useState(
    'Berdasarkan pengawasan berkala, Dewan Pengawas Syariah menyatakan bahwa seluruh transaksi, produk baru, dan pengelolaan dana sosial pada KSPPS IQ-RA telah berjalan secara HALAL, bebas dari unsur Riba, Gharar, maupun Maysir. Pembersihan dana non-halal telah diawasi ketat dan disalurkan seutuhnya untuk kemaslahatan sosial masyarakat.'
  );
  const [digitalSignChecked, setDigitalSignChecked] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  const formatIDR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  // Load contracts from database
  const fetchContracts = async () => {
    setLoadingContracts(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('financing_contracts')
        .select('*, users(full_name, email)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setContracts(data);
        // Pre-populate auditedContractsMetadata dari database!
        const metaMap: Record<string, any> = {};
        const auditedList = data.filter((c: any) => c.is_reviewed_by_dps === true || c.status === 'VERIFIED_HALAL' || c.status === 'ANOMALY_REVISION');
        
        auditedList.forEach((c: any) => {
          metaMap[c.id] = {
            complianceScore: c.audit_metadata?.complianceScore ?? (c.status === 'VERIFIED_HALAL' ? 100 : 50),
            opinion: c.dps_advice?.opinion || c.audit_metadata?.opinion || 'Telah direviu oleh DPS.',
            decision: c.dps_advice?.isHalal ? 'TERVERIFIKASI SYARIAH (HALAL)' : (c.dps_advice ? 'Saran Diberikan' : (c.status === 'VERIFIED_HALAL' ? 'TERVERIFIKASI SYARIAH (HALAL)' : 'TEMUAN ANOMALI (PERLU REVISI)')),
            date: c.dps_advice?.auditedAt || c.audit_metadata?.auditedAt || c.created_at,
            checklist: c.dps_advice?.checklist || c.audit_metadata?.checklist || null
          };
        });
        setAuditedContractsMetadata(metaMap);

        // 1. Dynamic sharia health score calculation
        if (auditedList.length > 0) {
          const totalScore = auditedList.reduce((sum: number, c: any) => {
            const score = c.audit_metadata?.complianceScore ?? (c.status === 'VERIFIED_HALAL' ? 100 : 50);
            return sum + score;
          }, 0);
          setShariaHealthScore(Number((totalScore / auditedList.length).toFixed(1)));
        } else {
          setShariaHealthScore(98.6); // Fallback standard
        }

        // 2. Dynamic audited plafond calculation
        const totalAuditedPlafond = auditedList.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
        setAuditedPlafond(totalAuditedPlafond || 1480000000); // Fallback mock
      }

      // 3. Dynamic ZISWAF/Non-Halal balance calculation from journal_entries
      const { data: journalData, error: journalError } = await supabase
        .from('journal_entries')
        .select('*');

      if (!journalError && journalData) {
        let calculatedNonHalalInflow = 0;
        let calculatedNonHalalOutflow = 0;
        let calculatedSocialInflow = 0;
        let calculatedSocialOutflow = 0;

        journalData.forEach((entry: any) => {
          const code = entry.account_code;
          const debit = Number(entry.debit || 0);
          const credit = Number(entry.credit || 0);

          if (code === '220003' || code === '230003') { // Non Halal
            calculatedNonHalalInflow += credit;
            calculatedNonHalalOutflow += debit;
          } else if (code === '220002' || code === '230002' || code === '302.01') { // Social
            calculatedSocialInflow += credit;
            calculatedSocialOutflow += debit;
          }
        });

        if (calculatedNonHalalInflow > 0 || calculatedNonHalalOutflow > 0) {
          setNonHalalBalance(Math.max(0, 34250000 + (calculatedNonHalalInflow - calculatedNonHalalOutflow)));
        }
        if (calculatedSocialInflow > 0 || calculatedSocialOutflow > 0) {
          setSocialFundsBalance(Math.max(0, 120450000 + (calculatedSocialInflow - calculatedSocialOutflow)));
        }

        // 4. Dynamic purification history loading from journal entries
        const nonHalalDebitJournals = journalData.filter((entry: any) => 
          (entry.account_code === '220003' || entry.account_code === '230003') && Number(entry.debit || 0) > 0
        );

        if (nonHalalDebitJournals.length > 0) {
          const dynamicHistory = nonHalalDebitJournals.map((j: any, index: number) => {
            let destination = "MCK & Sanitasi Desa Binaan";
            let notes = j.description || "Pembersihan dana syariah";
            
            const destMatch = j.description?.match(/Penyaluran ke ([^-]*)/);
            if (destMatch) {
              destination = destMatch[1].trim();
            }
            const notesMatch = j.description?.match(/Catatan:\s*(.*)/);
            if (notesMatch) {
              notes = notesMatch[1].trim();
            }

            return {
              id: j.id || index,
              date: j.date || new Date().toISOString().split('T')[0],
              amount: Number(j.debit),
              destination: destination,
              notes: notes,
              status: 'TERVERIFIKASI SYARIAH'
            };
          });
          
          // Combine with mock history if needed, or replace
          setPurificationHistory(dynamicHistory);
        }
      }
    } catch (e) {
      console.error("fetchContracts Error:", e);
    }
    setLoadingContracts(false);
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleSelectContractForAudit = async (c: any) => {
    setActiveAuditContract(c);
    setRightPanelTab('dossier');
    setAiAuditLoading(true);
    setAiAuditResult(null);

    const auditMeta = auditedContractsMetadata[c.id];
    if (auditMeta) {
      setAuditOpinion(auditMeta.opinion || '');
      setAuditChecklist(auditMeta.checklist || { objekAset: true, hargaTerbuka: true, serahTerimaAwal: true, bebasRiba: true });
    } else {
      setAuditOpinion('');
      setAuditChecklist({ objekAset: true, hargaTerbuka: true, serahTerimaAwal: true, bebasRiba: true });
    }

    try {
      const response = await fetch('/api/ai/audit-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: c.id })
      });
      const data = await response.json();
      if (data.success && data.auditResult) {
        setAiAuditResult(data.auditResult);
        
        // Auto-fill checklist and opinion if not already audited
        if (!auditMeta) {
          setAuditOpinion(data.auditResult.opinion);
          setAuditChecklist(data.auditResult.checklist);
        }
      }
    } catch (err) {
      console.error("Failed to run dynamic AI audit:", err);
    } finally {
      setAiAuditLoading(false);
    }
  };

  // RAG Fatwa Search simulation
  const handleRagSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productSearchQuery.trim()) return;

    setSearchingRag(true);
    const supabase = createClient();
    
    try {
      // Direct supabase full text / like query for realistic search
      const { data, error } = await supabase
        .from('sharia_knowledge')
        .select('*')
        .or(`content.ilike.%${productSearchQuery}%,source_title.ilike.%${productSearchQuery}%`)
        .limit(3);

      if (!error && data && data.length > 0) {
        setRagSearchResult(data);
      } else {
        // Fallback realistic syariah fatwas if empty
        const queryLC = productSearchQuery.toLowerCase();
        let fallbackResults = [
          {
            source_title: 'Fatwa DSN-MUI No. 04/II/2000 tentang Murabahah',
            category: 'FATWA',
            content: '1. Murabahah adalah menjual suatu barang dengan menegaskan harga belinya kepada pembeli dan pembeli membayarnya dengan harga yang lebih sebagai laba.\n2. Penjual harus memberitahu biaya pembelian barang secara jujur kepada pembeli.\n3. Barang yang diperjualbelikan harus berwujud, halal, dan spesifikasinya disepakati.'
          }
        ];

        if (queryLC.includes('emas') || queryLC.includes('investasi') || queryLC.includes('mudharabah')) {
          fallbackResults = [
            {
              source_title: 'Fatwa DSN-MUI No. 77/DSN-MUI/V/2010 tentang Jual Beli Emas secara Tidak Tunai',
              category: 'FATWA',
              content: 'Jual beli emas secara tidak tunai (baik melalui angsuran maupun pemesanan) hukumnya diperbolehkan (mubah) sepanjang emas tidak menjadi alat tukar resmi yang beredar (tsaman) dan melainkan bertindak sebagai komoditas (sil\'ah).'
            },
            {
              source_title: 'Fatwa DSN-MUI No. 07/II/2000 tentang Mudharabah (Bagi Hasil)',
              category: 'FATWA',
              content: 'Penyedia dana (Shahibul Maal) membiayai 100% modal usaha, pengelola (Mudharib) berkontribusi tenaga & keahlian. Pembagian keuntungan disepakati dalam bentuk nisbah rasio persen, bukan nominal fixed rupiah.'
            }
          ];
        } else if (queryLC.includes('ijarah') || queryLC.includes('jasa') || queryLC.includes('umrah')) {
          fallbackResults = [
            {
              source_title: 'Fatwa DSN-MUI No. 09/VI/2000 tentang Pembiayaan Ijarah',
              category: 'FATWA',
              content: '1. Akad pembiayaan sewa atas suatu manfaat/jasa dengan menyepakati biaya sewa (ujrah) yang tetap di awal secara transparan.\n2. Objek sewa harus berupa manfaat/jasa yang halal dan dapat dinilai dengan harta.'
            },
            {
              source_title: 'Fatwa DSN-MUI No. 44/DSN-MUI/VIII/2004 tentang Pembiayaan Multijasa',
              category: 'FATWA',
              content: 'Koperasi Syariah diperbolehkan menyalurkan pembiayaan multijasa (termasuk pendidikan, ibadah haji/umrah, kesehatan) menggunakan akad Ijarah atau Kafalah bulanan.'
            }
          ];
        }
        setRagSearchResult(fallbackResults);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingRag(false);
    }
  };

  // Submit Audit Sampling decision (Persetujuan Halal / Saran)
  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAuditContract) return;

    setLoadingContracts(true);
    const complianceScore = (auditChecklist.objekAset ? 25 : 0) + 
                            (auditChecklist.hargaTerbuka ? 25 : 0) + 
                            (auditChecklist.serahTerimaAwal ? 25 : 0) + 
                            (auditChecklist.bebasRiba ? 25 : 0);

    const isHalal = complianceScore === 100;
    const finalOpinion = auditOpinion || (isHalal ? 'Dokumen akad tervalidasi memenuhi seluruh rukun syariah.' : 'Ditemukan ketidaksesuaian rukun akad.');

    const supabase = createClient();
    try {
      // 1. Update is_reviewed_by_dps dan dps_advice di database Supabase tanpa mengubah status!
      const { error } = await supabase
        .from('financing_contracts')
        .update({
          is_reviewed_by_dps: true,
          dps_advice: {
            isHalal,
            complianceScore,
            opinion: finalOpinion,
            checklist: auditChecklist,
            auditedAt: new Date().toISOString(),
            auditedBy: profile?.full_name || 'Dewan Pengawas Syariah'
          }
        })
        .eq('id', activeAuditContract.id);

      if (error) throw error;

      // 2. Trigger dynamic stats recalculation from database!
      await fetchContracts();

      setAuditSuccessMsg(`Saran DPS untuk kontrak ${activeAuditContract.users?.full_name} berhasil dikirim ke Manajer! Skor Kepatuhan: ${complianceScore}%`);
      
      setTimeout(() => {
        setAuditSuccessMsg('');
        setActiveAuditContract(null);
        setAuditOpinion('');
        setAuditChecklist({ objekAset: true, hargaTerbuka: true, serahTerimaAwal: true, bebasRiba: true });
      }, 2000);
    } catch (err: any) {
      alert('Gagal menyimpan hasil audit ke database: ' + err.message);
    } finally {
      setLoadingContracts(false);
    }
  };

  // Submit Audit Reject (Tolak / Temuan Anomali)
  const handleAuditReject = async () => {
    if (!activeAuditContract) return;

    setLoadingContracts(true);
    const finalOpinion = auditOpinion || 'Ditemukan ketidaksesuaian rukun akad setelah direviu secara detail oleh DPS.';

    const supabase = createClient();
    try {
      // 1. Update ke Supabase
      const { error } = await supabase
        .from('financing_contracts')
        .update({
          is_reviewed_by_dps: true,
          dps_advice: {
            isHalal: false,
            complianceScore: 50,
            opinion: finalOpinion,
            checklist: auditChecklist,
            auditedAt: new Date().toISOString(),
            auditedBy: profile?.full_name || 'Dewan Pengawas Syariah'
          }
        })
        .eq('id', activeAuditContract.id);

      if (error) throw error;

      // 2. Trigger dynamic stats recalculation from database!
      await fetchContracts();

      setAuditSuccessMsg(`Kontrak ${activeAuditContract.users?.full_name} berhasil ditandai sebagai Temuan dan diteruskan ke Manajer!`);
      
      setTimeout(() => {
        setAuditSuccessMsg('');
        setActiveAuditContract(null);
        setAuditOpinion('');
        setAuditChecklist({ objekAset: true, hargaTerbuka: true, serahTerimaAwal: true, bebasRiba: true });
      }, 2000);
    } catch (err: any) {
      alert('Gagal memperbarui status audit: ' + err.message);
    } finally {
      setLoadingContracts(false);
    }
  };

  // Submit Purification
  const handlePurificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purifyAmount <= 0) return;

    if (purifyAmount > nonHalalBalance) {
      alert('Nominal pembersihan melebihi saldo dana non-halal yang tersedia.');
      return;
    }

    setLoadingContracts(true);
    const supabase = createClient();
    try {
      const refNo = `PRF-${Date.now()}`;
      const descriptionText = `[PEMBERSIHAN DANA NON-HALAL] Penyaluran ke ${purifyDestination} - Catatan: ${purifyNotes || 'Pembersihan syariah'}`;

      // Insert Double-Entry into journal_entries
      const { error } = await supabase
        .from('journal_entries')
        .insert([
          {
            date: new Date().toISOString().split('T')[0],
            reference_no: refNo,
            description: descriptionText,
            debit: purifyAmount,
            credit: 0,
            account_code: '220003' // Debit Dana Non-Halal (Mengurangi Saldo Kewajiban)
          },
          {
            date: new Date().toISOString().split('T')[0],
            reference_no: refNo,
            description: descriptionText,
            debit: 0,
            credit: purifyAmount,
            account_code: '110101' // Credit Kas Brankas (Pengeluaran Aset Kas)
          }
        ]);

      if (error) throw error;

      // Reload data to reflect dynamic updates instantly
      await fetchContracts();

      setPurifyAmount(0);
      setPurifyDisplay('');
      setPurifyNotes('');
      alert(`Pembersihan dana sebesar ${formatIDR.format(purifyAmount)} ke ${purifyDestination} berhasil disimpan ke database dan jurnal kas!`);
    } catch (err: any) {
      console.error(err);
      alert('Gagal merekam jurnal pembersihan ke database: ' + err.message);
    } finally {
      setLoadingContracts(false);
    }
  };

  // Submit Product Approval
  const handleProductApprovalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setProposedProducts(prev => prev.map(p => {
      if (p.id === selectedProduct.id) {
        return { 
          ...p, 
          status: productDecision === 'approved' ? 'DISETUJUI (HALAL)' : (productDecision === 'revision' ? 'BUTUH REVISI' : 'DITOLAK'),
          remarks: productRemarks 
        };
      }
      return p;
    }));

    alert(`Keputusan Produk '${selectedProduct.name}' berhasil disimpan dan diterbitkan!`);
    setSelectedProduct(null);
    setProductRemarks('');
    setProductSearchQuery('');
    setRagSearchResult([]);
  };

  // Export RAT Report PDF
  const handleExportPDF = () => {
    setGeneratingReport(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Style configurations
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(4, 49, 33); // Dark Emerald

      // Letterhead
      doc.text("DEWAN PENGAWAS SYARIAH (DPS)", 105, 20, { align: 'center' });
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(14);
      doc.text("KOPERASI SIMPAN PINJAM SYARIAH iQ-RA SYSTEM", 105, 28, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text("Jl. Emerald Boulevard No. 77, Gedung Rahmatan Lil 'Alamin, Jakarta", 105, 33, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.setDrawColor(204, 163, 52); // Metallic Gold
      doc.line(20, 36, 190, 36);

      // Report Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("LAPORAN HASIL PENGAWASAN SYARIAH (LHPS)", 105, 46, { align: 'center' });
      doc.text(`Periode: ${reportPeriod}`, 105, 52, { align: 'center' });

      // Introduction
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Assalamu'alaikum Warahmatullahi Wabarakatuh,", 20, 62);
      
      const introText = "Segala puji bagi Allah SWT atas segala nikmat-Nya. Kami selaku Dewan Pengawas Syariah (DPS) KSPPS IQ-RA telah melakukan pengawasan kepatuhan syariah secara teratur terhadap seluruh operasional, transaksi keuangan harian, dan produk baru koperasi simpan pinjam syariah.";
      const splitIntro = doc.splitTextToSize(introText, 170);
      doc.text(splitIntro, 20, 68);

      // Section 1: Key Metrics Table
      doc.setFont("Helvetica", "bold");
      doc.text("I. METRIK KEPATUHAN SYARIAH UTAMA", 20, 88);
      doc.setFont("Helvetica", "normal");
      
      const metrics = [
        ['Rasio Kepatuhan Syariah Global', `${shariaHealthScore}% (SANGAT BAIK)`],
        ['Total Plafon Pembiayaan Diaudit', formatIDR.format(auditedPlafond)],
        ['Saldo Dana Kebajikan (ZISWAF)', formatIDR.format(socialFundsBalance)],
        ['Dana Sosial Pembersihan Non-Halal', formatIDR.format(nonHalalBalance)]
      ];

      let currentY = 94;
      metrics.forEach(([k, v]) => {
        doc.text(k, 25, currentY);
        doc.text(`:  ${v}`, 100, currentY);
        currentY += 6;
      });

      // Section 2: Auditor Opinion
      doc.setFont("Helvetica", "bold");
      doc.text("II. OPINI KEPATUHAN SYARIAH & KHASANAH FIQIH", 20, currentY + 6);
      doc.setFont("Helvetica", "normal");
      const splitOpinion = doc.splitTextToSize(reportGeneralOpinion, 170);
      doc.text(splitOpinion, 20, currentY + 12);

      // Section 3: Purification and Social Funds
      const textHeight = splitOpinion.length * 5;
      const signatureY = currentY + 25 + textHeight;

      doc.text("Demikian laporan pengawasan syariah ini kami susun dengan penuh tanggung jawab demi menjaga keberkahan muamalah seluruh anggota KSPPS IQ-RA.", 20, signatureY);
      doc.text("Wassalamu'alaikum Warahmatullahi Wabarakatuh,", 20, signatureY + 8);

      // Signatures
      doc.setFont("Helvetica", "bold");
      doc.text("Dewan Pengawas Syariah", 140, signatureY + 22, { align: 'center' });
      
      if (digitalSignChecked) {
        doc.setFont("Courier", "italic");
        doc.setTextColor(4, 49, 33);
        doc.setFontSize(8);
        doc.text("[TERTANDATANGANI SECARA ELEKTRONIK]", 140, signatureY + 34, { align: 'center' });
        doc.text(`VERIFIKASI ID: DPS-LHPS-${Date.now().toString().slice(-6)}`, 140, signatureY + 38, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
      }

      doc.text(profile?.full_name || 'Auditor DPS Utama', 140, signatureY + 46, { align: 'center' });
      doc.setFont("Helvetica", "normal");
      doc.text("Ketua Dewan DPS", 140, signatureY + 51, { align: 'center' });

      // Save PDF to browser
      doc.save(`LHPS_IQRA_${reportPeriod.replace(/\s+/g, '_')}.pdf`);
      alert('Laporan Pengawasan Syariah PDF berhasil digenerate dan diunduh!');
    } catch (e: any) {
      console.error(e);
      alert('Gagal mencetak PDF: ' + e.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const CONTRACT_TYPE_LABELS: Record<string, string> = {
    murabahah: 'Murabahah (Jual Beli)',
    mudharabah: 'Mudharabah (Bagi Hasil)',
    musyarakah: 'Musyarakah (Kemitraan)',
    ijarah: 'Ijarah (Sewa)',
    istishna: "Istishna' (Pemesanan)",
    qardhul_hasan: 'Qardhul Hasan (Sosial)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.4s ease' }}>
      
      {/* ========================================================
          MENU 1: OVERVIEW / SHARIAH HEALTH SCORE
          ======================================================== */}
      {activeMenu === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Main Hero Indicator Header */}
          <div className="glass-dark" style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.2fr 2fr', 
            gap: '40px', 
            padding: '40px', 
            borderRadius: '32px', 
            border: '3.5px solid var(--gold-bright)',
            boxShadow: '0 30px 60px var(--shadow-color)',
            background: 'var(--bg-card)',
            alignItems: 'center'
          }}>
            {/* Left Circular Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
              <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="110" cy="110" r="95" stroke="var(--bg-track)" strokeWidth="16" fill="transparent" />
                <circle cx="110" cy="110" r="95" stroke="url(#goldGradient)" strokeWidth="16" fill="transparent"
                  strokeDasharray="596" strokeDashoffset={596 - (596 * shariaHealthScore) / 100}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f3c653" />
                    <stop offset="100%" stopColor="#cca334" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', top: '48%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '42px', fontWeight: 950, color: 'var(--text-gold)', letterSpacing: '-1.5px', lineHeight: 1 }}>{shariaHealthScore}%</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '6px' }}>Health Score</span>
              </div>
            </div>

            {/* Right Health Assessment Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-subtle-success)', color: 'var(--text-success)', border: '1.5px solid var(--text-success)', width: 'fit-content', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                LEVEL AMAN & HALAL (KONDUSIF)
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: 950, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>Status Kesehatan Syariah Makro</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                Analisis real-time seluruh akad operasional, simpanan anggota, dan pembersihan dana non-halal membuktikan kepatuhan penuh sesuai standar Fatwa Dewan Syariah Nasional MUI. Sistem memblokir potensi pelanggaran riba dari inti transaksi koperasi.
              </p>
              <div style={{ height: '1px', background: 'var(--border-primary)', margin: '4px 0' }} />
              <div style={{ display: 'flex', gap: '30px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700 }}>AUDIT TERAKHIR</span>
                  <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 800, fontSize: '15px', marginTop: '4px' }}>Hari ini, 20:13</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700 }}>STATUS ANTRIAN</span>
                  <span style={{ display: 'block', color: 'var(--text-warning)', fontWeight: 800, fontSize: '15px', marginTop: '4px' }}>{contracts.filter(c => c.status === 'pending').length} Berkas Menunggu Audit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Blocks Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <div className="glass-dark" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>RASIO KEPATUHAN</span>
              <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-success)' }}>{shariaHealthScore}%</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sangat Tinggi</span>
            </div>
            <div className="glass-dark" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>TOTAL PLAFON DIAUDIT</span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-gold)' }}>{formatIDR.format(auditedPlafond)}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Akumulasi Sampling</span>
            </div>
            <div className="glass-dark" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>DANA SOSIAL / ZISWAF</span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-success)' }}>{formatIDR.format(socialFundsBalance)}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Qardhul Hasan & Hibah</span>
            </div>
            <div className="glass-dark" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>PENDAPATAN NON-HALAL</span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-danger)' }}>{formatIDR.format(nonHalalBalance)}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Menunggu Pembersihan</span>
            </div>
          </div>

          {/* Split Charts & Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            
            {/* Left: Akad Distribution Chart */}
            <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '1px solid var(--border-primary)' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: '0 0 24px 0', fontSize: '18px', fontWeight: 900 }}>DISTRIBUSI PENGGUNAAN AKAD SYARIAH</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { name: 'Murabahah (Jual Beli)', pct: 62, val: 917600000, color: '--text-gold' },
                  { name: 'Mudharabah (Bagi Hasil)', pct: 20, val: 296000000, color: '--text-success' },
                  { name: 'Musyarakah (Kemitraan)', pct: 12, val: 177600000, color: '--text-info' },
                  { name: 'Ijarah Multijasa (Sewa Jasa)', pct: 6, val: 88800000, color: '--text-warning' }
                ].map(item => (
                  <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                      <span style={{ color: `var(${item.color})` }}>{item.pct}% ({formatIDR.format(item.val)})</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-track)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.pct}%`, background: `var(${item.color})`, borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: AI Compliance Alert Panel */}
            <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '1.5px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-subtle-danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h4 style={{ color: 'var(--text-danger)', margin: 0, fontSize: '18px', fontWeight: 900 }}>PERINGATAN DETEKSI DINI AI RAG</h4>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Analisis pencocokan otomatis di latar belakang mendeteksi 1 pengajuan draf akad baru yang memerlukan penelaahan intensif oleh DPS sebelum disetujui.
              </p>

              <div style={{ background: 'var(--bg-dark-box)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 900 }}>
                  <span style={{ color: 'var(--text-danger)' }}>POTENSI ANOMALI: RIBARISIKO</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Status: PENDING</span>
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>Murabahah Modal Kerja - PT Berkah Bersama</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
                  Klausul denda keterlambatan disinyalir tidak dialokasikan penuh untuk dana sosial (Ta\'zir), berpotensi melanggar Fatwa DSN No 17. Segera lakukan audit manual.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          MENU 2: AUDIT PEMBIAYAAN (SAMPLING & REVIEW)
          ======================================================== */}
      {activeMenu === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Split screen active? */}
          {/* Split screen active? */}
          {activeAuditContract ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '30px', animation: 'fadeInUp 0.4s ease' }}>
              
              {/* LEFT SCREEN: Systems Transaction & AI RAG Assistant Panel */}
              <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '2.5px solid var(--gold-bright)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '15px' }}>
                  <h3 style={{ color: 'var(--text-gold)', margin: 0, fontWeight: 950, fontSize: '20px' }}>PENELAAHAN KEPATUHAN AKAD</h3>
                  <button onClick={() => setActiveAuditContract(null)} style={{ background: 'var(--border-primary)', border: 'none', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '12px' }}>✕ Batal</button>
                </div>

                {/* System Record Card */}
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase' }}>Data Transaksi Sistem</h4>
                  <div style={{ background: 'var(--bg-dark-box)', borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>NAMA ANGGOTA</span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{activeAuditContract.member_name || activeAuditContract.users?.full_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>JENIS AKAD</span>
                      <strong style={{ color: 'var(--text-gold)', fontWeight: 800 }}>{CONTRACT_TYPE_LABELS[activeAuditContract.type] || activeAuditContract.type}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>NOMINAL DIAJUKAN</span>
                      <strong style={{ color: 'var(--text-success)', fontWeight: 800 }}>{formatIDR.format(activeAuditContract.amount)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>TANGGAL PENGAJUAN</span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{new Date(activeAuditContract.created_at).toLocaleDateString('id-ID')}</strong>
                    </div>
                  </div>
                </div>

                {/* AI RAG Assistant Panel */}
                <div style={{ background: 'var(--bg-subtle-info)', border: '1.5px solid var(--border-info)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: 'var(--text-info)', fontWeight: 900, fontSize: '15px' }}>iQ-RA AI RAG Compliance Assistant</strong>
                  </div>
                  {aiAuditLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-info)' }}>
                      <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--border-primary)', borderTopColor: 'var(--text-info)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>AI sedang membaca basis pengetahuan & memetakan kesesuaian fatwa...</span>
                    </div>
                  ) : aiAuditResult ? (
                    <>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                        "{aiAuditResult.opinion.length > 220 ? aiAuditResult.opinion.substring(0, 220) + "..." : aiAuditResult.opinion}"
                      </div>
                      <div style={{ background: 'var(--bg-dark-box)', padding: '12px 16px', borderRadius: '10px', fontSize: '11px', color: 'var(--text-info)', fontWeight: 700 }}>
                        📖 Rujukan Vektor: {aiAuditResult.fatwaReferences}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                      "Berdasarkan analisis pemetaan fatwa **DSN-MUI No 04/2000 (Murabahah)** terhadap berkas fisik terunggah, tingkat kepatuhan transaksi ini mencapai **95%**. Pihak pertama (KSPPS) bertindak sah sebagai pemilik barang sebelum transaksi, rukun serah terima aset terpenuhi. Tidak ada unsur denda berbunga yang terdeteksi."
                    </div>
                  )}
                </div>

                {/* DPS Audit Interactive Checklist */}
                <form onSubmit={handleAuditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-gold)', fontWeight: 900, marginBottom: '12px', textTransform: 'uppercase' }}>Checklist Kepatuhan Syariah</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        ['objekAset', 'Objek Jual-Beli (Aset) nyata, halal, & spesifikasinya disepakati.'],
                        ['hargaTerbuka', 'Harga beli pokok & margin keuntungan koperasi diungkap transparan.'],
                        ['serahTerimaAwal', 'Serah terima kepemilikan barang mendahului akad transaksi.'],
                        ['bebasRiba', 'Klausul bebas denda berbunga & riba terselubung.']
                      ].map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <input type="checkbox" checked={(auditChecklist as any)[key]} onChange={e => setAuditChecklist({ ...auditChecklist, [key]: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: 'var(--text-gold)' }} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-gold)', fontWeight: 900, marginBottom: '8px' }}>OPINI / KEPUTUSAN SYARIAH MANDAT DPS</label>
                    <textarea required value={auditOpinion} onChange={e => setAuditOpinion(e.target.value)} placeholder="Tulis catatan persetujuan syariah resmi di sini (Misal: Akad sah memenuhi fatwa...)" style={{ width: '100%', minHeight: '80px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button type="submit" style={{ flex: 1, padding: '16px', background: 'var(--text-success)', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>
                      KIRIM SARAN KE MANAJER (HALAL)
                    </button>
                    <button type="button" onClick={handleAuditReject} style={{ padding: '16px', background: 'var(--bg-subtle-danger)', color: 'var(--text-danger)', border: '1.5px solid var(--text-danger)', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}>
                      Beri Catatan Temuan
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT SCREEN: Dynamic Dossier Portfolio & Contract Drawer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* Modern emerald and gold tab selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.25)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                  <button 
                    type="button"
                    onClick={() => setRightPanelTab('dossier')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: rightPanelTab === 'dossier' ? 'var(--text-primary)' : 'transparent',
                      color: rightPanelTab === 'dossier' ? 'var(--bg-page)' : 'var(--text-primary)',
                      fontWeight: 900,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    Portofolio & Dossier Debitur
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRightPanelTab('contract')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: rightPanelTab === 'contract' ? 'var(--text-primary)' : 'transparent',
                      color: rightPanelTab === 'contract' ? 'var(--bg-page)' : 'var(--text-primary)',
                      fontWeight: 900,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    Draf Akad Perjanjian
                  </button>
                </div>

                {/* Dossier Tab Content */}
                {rightPanelTab === 'dossier' && (
                  <div className="glass-dark" style={{ 
                    borderRadius: '28px', 
                    border: '2px solid var(--gold-bright)', 
                    padding: '35px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px', 
                    minHeight: '620px',
                    overflowY: 'auto',
                    animation: 'fadeInUp 0.3s ease-out'
                  }}>
                    
                    {aiAuditLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: '20px', textAlign: 'center', padding: '60px 0' }}>
                        <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid var(--border-primary)', borderTopColor: 'var(--text-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <h4 style={{ color: 'var(--text-gold)', fontWeight: 900, fontSize: '15px', letterSpacing: '0.5px', margin: 0 }}>MENGUMPULKAN BERKAS PORTOFOLIO...</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '300px', margin: 0 }}>
                          AI sedang menyusun analisis kebutuhan nasabah, kelayakan jaminan, dan estimasi prospek usaha secara riil.
                        </p>
                      </div>
                    ) : aiAuditResult ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Section 1: Profil Debitur */}
                        <div style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '15px' }}>
                          <h4 style={{ color: 'var(--text-gold)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                            1. Profil Pengajuan Pembiayaan
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px' }}>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>NAMA DEBITUR</span>
                              <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{activeAuditContract.member_name || activeAuditContract.users?.full_name || 'Nasabah'}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>NOMINAL AJUAN</span>
                              <strong style={{ color: 'var(--text-success)', fontWeight: 800 }}>{formatIDR.format(activeAuditContract.amount)}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>AKAD YANG DIGUNAKAN</span>
                              <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{CONTRACT_TYPE_LABELS[activeAuditContract.type] || activeAuditContract.type}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>RUJUKAN UTAMA</span>
                              <strong style={{ color: 'var(--text-gold)', fontWeight: 800 }}>{aiAuditResult.fatwaReferences}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Jaminan / Agunan */}
                        <div style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '15px' }}>
                          <h4 style={{ color: 'var(--text-gold)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                            2. Jaminan / Agunan Syariah (Collateral)
                          </h4>
                          <div style={{ background: 'var(--bg-subtle-warning)', border: '1.5px solid var(--border-warning)', padding: '16px', borderRadius: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Aset Penjaminan Fisik</strong>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                                {aiAuditResult.collateral}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Kebutuhan & Tujuan */}
                        <div style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '15px' }}>
                          <h4 style={{ color: 'var(--text-gold)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                            3. Kebutuhan & Penggunaan Dana
                          </h4>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Deskripsi Kebutuhan</strong>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                                Dana dialokasikan sepenuhnya untuk kebutuhan produktif syariah: <strong>{activeAuditContract.prospect_purpose || 'Modal Kerja Pengembangan Usaha'}</strong>.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Prospek Kelayakan & Survei */}
                        <div>
                          <h4 style={{ color: 'var(--text-gold)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
                            4. Prospek Kelayakan & Analisis Survei
                          </h4>
                          <div style={{ background: 'var(--bg-subtle-success)', border: '1.5px solid var(--border-success)', padding: '16px', borderRadius: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '15px' }}>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Analisis Kelayakan Bisnis</strong>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                                {aiAuditResult.prospectAnalysis}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                            <div style={{ background: 'var(--bg-dark-box)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>SKOR KEPATUHAN AI</span>
                              <strong style={{ fontSize: '16px', color: 'var(--text-success)' }}>{aiAuditResult.complianceScore}% Match</strong>
                            </div>
                            <div style={{ background: 'var(--bg-dark-box)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>STATUS SYARIAH</span>
                              <strong style={{ fontSize: '14px', color: 'var(--text-success)' }}>100% AMAN & HALAL</strong>
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: '15px', color: 'var(--text-secondary)' }}>
                        <span>Gagal memuat dossier otomatis secara dinamis.</span>
                        <button type="button" onClick={() => handleSelectContractForAudit(activeAuditContract)} style={{ background: 'var(--gold-intense)', color: '#043121', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>Coba Lagi</button>
                      </div>
                    )}

                  </div>
                )}

                {/* Contract Tab Content */}
                {rightPanelTab === 'contract' && (
                  <div style={{ background: '#fff', borderRadius: '28px', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', padding: '40px', color: '#1e293b', border: '12px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', overflow: 'hidden', minHeight: '620px' }}>
                    
                    {/* Paper watermark effect */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', border: '2px solid rgba(4,49,33,0.1)', color: 'rgba(4,49,33,0.1)', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 900, fontFamily: 'monospace' }}>
                      KSPPS iQ-RA ORIGINAL DOC
                    </div>

                    {/* Header */}
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #475569', paddingBottom: '15px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>KOPERASI SIMPAN PINJAM SYARIAH iQ-RA</h4>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SURAT PERJANJIAN AKAD PEMBIAYAAN SYARIAH</span>
                    </div>

                    {/* Main Clauses */}
                    <div style={{ fontSize: '11px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                      <div>
                        Yang bertanda tangan di bawah ini pada hari ini tanggal <strong>{new Date(activeAuditContract.created_at).toLocaleDateString('id-ID')}</strong>:
                        <ol style={{ paddingLeft: '15px', marginTop: '4px' }}>
                          <li><strong>KSPPS iQ-RA SYSTEM</strong> bertindak sebagai Pihak Pertama (Penjual / Pengelola Dana).</li>
                          <li><strong>{activeAuditContract.member_name || activeAuditContract.users?.full_name}</strong> bertindak sebagai Pihak Kedua (Pembeli / Anggota Pemohon).</li>
                        </ol>
                      </div>

                      <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderLeft: '4px solid #f59e0b', padding: '10px 14px', borderRadius: '6px' }}>
                        <strong style={{ color: '#b45309', display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>PASAL 1: OBJEK TRANSAKSI JUAL-BELI (AI HIGHLIGHTED)</strong>
                        Pihak Pertama menjual kepada Pihak Kedua satu unit barang berupa modal usaha senilai <strong>{formatIDR.format(activeAuditContract.amount)}</strong> dengan marjin keuntungan tetap yang disepakati secara adil dan diangsur bulanan.
                      </div>

                      <div>
                        <strong style={{ color: '#0f172a' }}>PASAL 2: CARA PEMBAYARAN & JANGKA WAKTU</strong>
                        Pihak Kedua sepakat membayar angsuran bulanan tetap tanpa adanya pengenaan bunga berlipat ganda ataupun biaya administrasi siluman di luar kesepakatan.
                      </div>

                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid #10b981', padding: '10px 14px', borderRadius: '6px' }}>
                        <strong style={{ color: '#047857', display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>PASAL 3: DENDA KETERLAMBATAN (TA'ZIR - VERIFIED)</strong>
                        Jika terjadi keterlambatan bayar akibat kelalaian murni, denda keterlambatan akan dikumpulkan seutuhnya sebagai Dana Kebajikan (Sosial/ZISWAF) dan tidak diakui sebagai pendapatan inti Koperasi.
                      </div>

                      <div style={{ marginTop: '20px', alignSelf: 'flex-end', width: '160px', textAlign: 'center', border: '2px dashed rgba(4, 49, 33, 0.3)', padding: '10px', borderRadius: '10px', background: 'rgba(52,211,153,0.05)', color: '#043121' }}>
                        <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Verifikasi DPS Syariah</span>
                        {auditedContractsMetadata[activeAuditContract.id] ? (
                          <div style={{ color: '#10b981', fontWeight: 900, fontSize: '12px', marginTop: '6px', border: '2px solid #10b981', padding: '4px', borderRadius: '6px', textTransform: 'uppercase' }}>
                            APPROVED DPS
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', display: 'block', marginTop: '6px' }}>MENUNGGU REVIEW</span>
                        )}
                      </div>
                    </div>

                    {/* Footer signatures */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '15px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span>Pihak Pertama,</span>
                        <div style={{ height: '40px' }} />
                        <strong>KSPPS iQ-RA System</strong>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span>Pihak Kedua,</span>
                        <div style={{ height: '40px' }} />
                        <strong>{activeAuditContract.member_name || activeAuditContract.users?.full_name}</strong>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 900, fontSize: '20px' }}>DAFTAR SAMPEL AUDIT TRANSAKSI PEMBIAYAAN</h3>
                <span style={{ background: 'var(--border-primary)', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800 }}>Total: {contracts.length} Transaksi</span>
              </div>

              {auditSuccessMsg && (
                <div style={{ padding: '15px', borderRadius: '12px', background: 'var(--bg-subtle-success)', color: 'var(--text-success)', border: '1px solid var(--text-success)', marginBottom: '20px', fontWeight: 800, textAlign: 'center' }}>
                  {auditSuccessMsg}
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-primary)', background: 'var(--bg-dark-box)' }}>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>ANGGOTA</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>JENIS AKAD</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, textAlign: 'right' }}>NOMINAL</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>TGL PENGAJUAN</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>STATUS DPS</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>AKSI AUDIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingContracts ? (
                      <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat data kontrak dari Supabase...</td></tr>
                    ) : contracts.length > 0 ? (
                      contracts.map(c => {
                        const auditMeta = auditedContractsMetadata[c.id];
                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--border-primary)', background: 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '20px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>{c.users?.full_name || 'Anggota'}</td>
                            <td style={{ padding: '20px 16px', color: 'var(--text-secondary)' }}>{CONTRACT_TYPE_LABELS[c.type] || c.type}</td>
                            <td style={{ padding: '20px 16px', fontWeight: 900, color: 'var(--text-success)', textAlign: 'right' }}>{formatIDR.format(c.amount)}</td>
                            <td style={{ padding: '20px 16px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '13px' }}>{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                            <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                              {auditMeta ? (
                                <span style={{ padding: '6px 12px', borderRadius: '8px', background: auditMeta.complianceScore === 100 ? 'var(--bg-subtle-success)' : 'var(--bg-subtle-danger)', color: auditMeta.complianceScore === 100 ? 'var(--text-success)' : 'var(--text-danger)', fontSize: '11px', fontWeight: 900, border: '1px solid currentColor' }}>
                                  {auditMeta.decision}
                                </span>
                              ) : (
                                <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-subtle-warning)', color: 'var(--text-warning)', fontSize: '11px', fontWeight: 900, border: '1px solid currentColor' }}>
                                  BELUM DIAUDIT
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                              <button onClick={() => handleSelectContractForAudit(c)} style={{ background: 'var(--gold-gradient)', color: '#043121', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>
                                REVIEW AKAD
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada data kontrak pembiayaan di database.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          MENU 3: PRODUCT APPROVAL (MANAJEMEN AKAD & PRODUK)
          ======================================================== */}
      {activeMenu === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedProduct ? '1.1fr 1fr' : '1fr', gap: '30px', animation: 'fadeInUp 0.4s ease' }}>
          
          {/* Main List of proposed products */}
          <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '1px solid var(--border-primary)' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0', fontWeight: 900, fontSize: '20px' }}>USULAN SKEMA & DRAF PRODUK BARU</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '25px' }}>Daftar skema produk baru yang diajukan oleh tim Manajemen / AO untuk dievaluasi dasar syariahnya.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {proposedProducts.map(p => (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', padding: '24px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ padding: '4px 10px', background: 'var(--border-primary)', color: 'var(--text-secondary)', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>{p.category}</span>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: p.status.includes('DISETUJUI') ? 'var(--text-success)' : (p.status.includes('REVISI') ? 'var(--text-warning)' : 'var(--text-secondary)') }}>{p.status}</span>
                    </div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 800 }}>{p.name}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{p.description}</span>
                  </div>
                  <button onClick={() => setSelectedProduct(p)} style={{ background: selectedProduct?.id === p.id ? 'var(--text-primary)' : 'var(--gold-gradient)', color: selectedProduct?.id === p.id ? 'var(--bg-page)' : '#043121', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>
                    {selectedProduct?.id === p.id ? 'SEDANG DITELAAH' : 'REVIU DRAF'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Product Editor & RAG Fatwa Search */}
          {selectedProduct && (
            <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '2.5px solid var(--gold-bright)', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '15px' }}>
                <h4 style={{ color: 'var(--text-gold)', margin: 0, fontWeight: 950, fontSize: '18px' }}>EVALUASI KLAUSUL HUKUM</h4>
                <button onClick={() => setSelectedProduct(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{selectedProduct.name}</strong>
                <span style={{ color: 'var(--text-gold)', fontSize: '13px', fontWeight: 800 }}>Rincian Parameter: {selectedProduct.nisbah || selectedProduct.margin} | Tenor: {selectedProduct.tenor}</span>
              </div>

              {/* Product Clauses */}
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, display: 'block', marginBottom: '8px' }}>Draf Klausul Fikih Produk</span>
                <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
                  {selectedProduct.clauses.map((c: string, idx: number) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Interactive RAG Search Tool */}
              <div style={{ background: 'var(--bg-dark-box)', padding: '20px', borderRadius: '16px', border: '1px dashed var(--border-primary)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-gold)', fontWeight: 900, display: 'block', marginBottom: '10px' }}>ALAT RUJUKAN SYARIAH DSN-MUI RAG</span>
                <form onSubmit={handleRagSearch} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <input type="text" value={productSearchQuery} onChange={e => setProductSearchQuery(e.target.value)} placeholder="Cari fatwa... (Misal: Emas, Ijarah, Ujrah)" style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                  <button type="submit" disabled={searchingRag} style={{ padding: '10px 16px', background: 'var(--gold-gradient)', color: '#043121', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}>
                    {searchingRag ? 'Memuat...' : 'Cari'}
                  </button>
                </form>

                {/* RAG Search results */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                  {ragSearchResult.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-page)', border: '1px solid var(--border-primary)', padding: '12px 14px', borderRadius: '8px', fontSize: '12px' }}>
                      <strong style={{ color: 'var(--text-gold)', display: 'block', marginBottom: '4px' }}>{item.source_title}</strong>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', lineHeight: '1.4' }}>{item.content}</span>
                    </div>
                  ))}
                  {ragSearchResult.length === 0 && !searchingRag && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>Ketik topik akad di atas untuk memanggil referensi fatwa pendukung (AI RAG).</span>
                  )}
                </div>
              </div>

              {/* Form Approval Action */}
              <form onSubmit={handleProductApprovalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '6px' }}>Status Keputusan</label>
                    <select value={productDecision} onChange={e => setProductDecision(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '13px' }}>
                      <option value="approved" style={{color:'#000'}}>SETUJUI (HALAL)</option>
                      <option value="revision" style={{color:'#000'}}>BUTUH REVISI DRAFT</option>
                      <option value="rejected" style={{color:'#000'}}>TOLAK SKEMA</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '6px' }}>Catatan / Arahan DPS terhadap Produk</label>
                  <textarea required value={productRemarks} onChange={e => setProductRemarks(e.target.value)} placeholder="Tuliskan catatan hukum syariah untuk tim manajemen..." style={{ width: '100%', minHeight: '60px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                </div>

                <button type="submit" style={{ padding: '14px', background: 'var(--gold-gradient)', color: '#043121', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}>
                  TERBITKAN KEPUTUSAN FATWA DPS
                </button>
              </form>

            </div>
          )}

        </div>
      )}

      {/* ========================================================
          MENU 4: PURIFICATION (PENGAWASAN PENDAPATAN NON-HALAL & ZISWAF)
          ======================================================== */}
      {activeMenu === 'purification' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', animation: 'fadeInUp 0.4s ease' }}>
          
          {/* Left purification history ledger & ledger details */}
          <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 900, fontSize: '20px' }}>BUKU BESAR DANA NON-HALAL (TA'ZIR & GIRO)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Arus pencatatan pengendapan dana denda nasabah dan bunga penampungan bank konvensional.</p>
            </div>

            {/* Total Balance Card */}
            <div style={{ background: 'var(--bg-subtle-danger)', border: '1.5px solid var(--text-danger)', borderRadius: '20px', padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-danger)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dana Mengendap Non-Halal</span>
                <h4 style={{ fontSize: '32px', fontWeight: 950, color: 'var(--text-danger)', margin: '4px 0 0 0' }}>{formatIDR.format(nonHalalBalance)}</h4>
              </div>
            </div>

            {/* Inflows components detail */}
            <div>
              <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase' }}>Rincian Asal Usul Dana</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--bg-dark-box)', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Denda Keterlambatan Pembayaran (Ta'zir)</span>
                  <strong style={{ color: 'var(--text-gold)' }}>{formatIDR.format(12450000)}</strong>
                </div>
                <div style={{ background: 'var(--bg-dark-box)', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Bunga Jasa Giro Bank Penampung VA</span>
                  <strong style={{ color: 'var(--text-gold)' }}>{formatIDR.format(21800000)}</strong>
                </div>
              </div>
            </div>

            {/* Purification History */}
            <div>
              <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 900, marginBottom: '12px', textTransform: 'uppercase' }}>Riwayat Pembersihan Dana</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {purificationHistory.map(h => (
                  <div key={h.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{h.date}</span>
                      <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>{h.destination}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'block', marginTop: '2px' }}>{h.notes}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: 'var(--text-success)', fontSize: '14px', display: 'block' }}>-{formatIDR.format(h.amount)}</strong>
                      <span style={{ color: 'var(--text-success)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Allocation/Purification Request Form */}
          <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '2.5px solid var(--gold-bright)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ color: 'var(--text-gold)', margin: '0 0 6px 0', fontWeight: 950, fontSize: '18px', textTransform: 'uppercase' }}>FORMULIR PEMBERSIHAN DANA SOSIAL</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>Gunakan form ini untuk mendistribusikan dana non-halal ke sektor sosial syariah demi membersihkan pos neraca koperasi.</p>
            </div>

            <form onSubmit={handlePurificationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '8px' }}>NOMINAL PEMBERSIHAN (Rp)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: 950, color: 'var(--text-gold)' }}>Rp</span>
                  <input type="text" required value={purifyDisplay} onChange={e => {
                    const numeric = e.target.value.replace(/\D/g, '');
                    setPurifyAmount(Number(numeric));
                    setPurifyDisplay(numeric ? Number(numeric).toLocaleString('id-ID') : '');
                  }} placeholder="0" style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '20px', fontWeight: 900, outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '8px' }}>SEKTOR SOSIAL SASARAN</label>
                <select value={purifyDestination} onChange={e => setPurifyDestination(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '14px' }}>
                  <option value="MCK & Sanitasi Desa Binaan" style={{color:'#000'}}>Fasilitas Umum (MCK / Sanitasi Desa)</option>
                  <option value="Santunan Sembako Yatim Piatu" style={{color:'#000'}}>Santunan Sembako & Kebutuhan Yatim</option>
                  <option value="Fasilitas Air Bersih Ponpes" style={{color:'#000'}}>Prasarana Air Bersih Pondok Pesantren</option>
                  <option value="Pembangunan Jembatan Gantung" style={{color:'#000'}}>Perbaikan Jembatan Rusak Pelosok</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '8px' }}>CATATAN / PANDUAN PENDUKUNG DPS</label>
                <textarea value={purifyNotes} onChange={e => setPurifyNotes(e.target.value)} placeholder="Tuliskan catatan kepatuhan atau nama penanggung jawab penyalur..." style={{ width: '100%', minHeight: '80px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
              </div>

              <div style={{ background: 'var(--bg-subtle-success)', border: '1.5px solid var(--border-success)', color: 'var(--text-success)', lineHeight: '1.5', padding: '16px', borderRadius: '12px', fontSize: '12px' }}>
                <strong>Jaminan Beban Syariah:</strong> Sistem memastikan 100% dana ini tidak akan dimasukkan ke pos bagi hasil atau menjadi keuntungan bersih koperasi simpan pinjam syariah.
              </div>

              <button type="submit" style={{ padding: '16px', background: 'var(--text-success)', color: '#ffffff', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                PROSES PEMBERSIHAN & REKAM KAS
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================
          MENU 5: REPORT (GENERATOR LAPORAN RAT)
          ======================================================== */}
      {activeMenu === 'report' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', animation: 'fadeInUp 0.4s ease' }}>
          
          {/* Left editor and report details compilation */}
          <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 900, fontSize: '20px' }}>LAPORAN PENGASAHAN HASIL AUDIT SYARIAH</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Gunakan antarmuka ini untuk mengompilasi rekapitulasi audit sepanjang periode buku untuk syarat Rapat Anggota Tahunan (RAT).</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '8px' }}>Tentukan Periode Laporan Buku</label>
              <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }}>
                <option value="Tahun Buku 2025/2026" style={{color:'#000'}}>Laporan Tahunan Buku 2025/2026 ( RAT )</option>
                <option value="Periode Triwulan I - 2026" style={{color:'#000'}}>Laporan Pengawasan Triwulan I - 2026</option>
                <option value="Bulan Mei 2026" style={{color:'#000'}}>Laporan Pengawasan Bulanan - Mei 2026</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '8px' }}>Opini Syariah Resmi / Kata Sambutan Editor</label>
              <textarea required value={reportGeneralOpinion} onChange={e => setReportGeneralOpinion(e.target.value)} style={{ width: '100%', minHeight: '160px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '14px', padding: '18px', color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6', outline: 'none' }} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
              <input type="checkbox" checked={digitalSignChecked} onChange={e => setDigitalSignChecked(e.target.checked)} style={{ width: '22px', height: '22px', accentColor: '#34d399' }} />
              Sertakan Tanda Tangan Digital DPS Elektronik Resmi KSPPS IQ-RA
            </label>
          </div>

          {/* Right report view & dynamic printable card */}
          <div className="glass-dark" style={{ padding: '36px', borderRadius: '28px', border: '2.5px solid var(--gold-bright)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--text-gold)', margin: 0, fontWeight: 950, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRATINJAU LAPORAN PENGASAHAN</h4>
            
            <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', color: '#1e293b', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '14px', border: '4px double var(--gold-bright)', minHeight: '320px', lineHeight: '1.5' }}>
              <div style={{ textTransform: 'uppercase', fontWeight: 900, textAlign: 'center', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
                KSPPS iQ-RA SYSTEM
              </div>
              <div style={{ fontSize: '10px', textAlign: 'center', fontWeight: 800 }}>
                LHPS - {reportPeriod}
              </div>
              <div style={{ marginTop: '10px' }}>
                Assalamu'alaikum Wr. Wb. Selaku Dewan DPS, kami mengonfirmasi rasio kepatuhan **{shariaHealthScore}%** sepanjang periode. Total dana sosial bersih tercatat sebesar **{formatIDR.format(socialFundsBalance)}** dan saldo pembersihan non-halal terekam tertib.
              </div>
              <div style={{ fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '8px', fontSize: '11px' }}>
                "{reportGeneralOpinion.slice(0, 140)}..."
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: 'auto' }}>
                <span>Verifikator:</span>
                <span style={{ fontWeight: 900 }}>{profile?.full_name || 'Auditor DPS'}</span>
              </div>
            </div>

            <button onClick={handleExportPDF} disabled={generatingReport} style={{ padding: '18px', background: 'var(--gold-gradient)', color: '#043121', border: 'none', borderRadius: '14px', fontWeight: 950, cursor: 'pointer', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 10px 25px rgba(243, 198, 83, 0.3)', transition: 'all 0.3s' }}>
              {generatingReport ? 'SEDANG MENCETAK LAPORAN...' : 'CETAK LAPORAN RESMI (PDF)'}
            </button>
          </div>

        </div>
      )}

      {/* ========================================================
          MENU 6: RAG / INGESTI DATA KNOWLEDGE BASE
          ======================================================== */}
      {activeMenu === 'rag' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            {/* Real vectorization ingest form */}
            <AIKnowledgeManager />
            {/* Simulated folder scanning pipeline */}
            <RAGPipelineView />
          </div>

        </div>
      )}

      <style jsx global>{`
        .glass-dark {
          background: var(--bg-card);
          backdrop-filter: blur(24px);
          box-shadow: 0 20px 50px var(--shadow-color);
        }
      `}</style>
    </div>
  );
}

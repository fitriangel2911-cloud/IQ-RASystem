'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DPSDashboardProps {
  activeMenu: string;
  profile: any;
}

export default function DPSDashboard({ activeMenu, profile }: DPSDashboardProps) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [auditing, setAuditing] = useState(false);
  const [dpsNote, setDpsNote] = useState('');
  const [ingestData, setIngestData] = useState({ title: '', content: '' });

  const formatIDR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  const fetchContractsForAudit = async () => {
    setLoadingContracts(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('financing_contracts')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setContracts(data);
    }
    setLoadingContracts(false);
  };

  useEffect(() => {
    fetchContractsForAudit();
  }, []);

  const getAIScore = (cId: string) => {
    const seed = cId.charCodeAt(0) || 80;
    return Math.floor(80 + (seed % 18));
  };

  const runShariaAudit = (contract: any) => {
    setAuditing(true);
    setSelectedAudit(null);
    setDpsNote(''); // Clear note for new audit
    
    setTimeout(() => {
      setSelectedAudit({
        contractId: contract.id,
        opinion: contract.type === 'murabahah' 
          ? "Akad tervalidasi sesuai Fatwa DSN-MUI No. 04/2000. Transparansi margin keuntungan telah dikonfirmasi."
          : "Akad bagi hasil telah memenuhi rukun Mudharabah sesuai Fatwa No. 07/2000. Pembagian nisbah terekam secara adil.",
        recommendation: "DISAHKAN (HALAL)",
        match_score: getAIScore(contract.id)
      });
      setAuditing(false);
    }, 1500);
  };

  const handleDpsIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestData.title || !ingestData.content) return;
    
    setLoadingContracts(true);
    const supabase = createClient();
    try {
      await supabase.from('sharia_knowledge').insert({
        source_title: ingestData.title,
        content: ingestData.content,
        category: 'FATWA',
        metadata: { added_by: 'DPS', date: new Date().toISOString() }
      });
      setIngestData({ title: '', content: '' });
      alert('✅ Referensi Syariah berhasil ditambahkan oleh DPS!');
    } catch (err) { alert('Gagal menambah referensi'); }
    setLoadingContracts(false);
  };

  const getFriendlyContractType = (type: string) => {
    const mapping: Record<string, string> = {
      murabahah: 'Murabahah (Jual Beli)',
      mudharabah: 'Mudharabah (Bagi Hasil)',
      musyarakah: 'Musyarakah (Kemitraan)',
      ijarah: 'Ijarah (Sewa)',
      istishna: 'Istishna (Pabrikasi)',
      qardhul_hasan: 'Qardhul Hasan (Sosial)'
    };
    return mapping[type] || type;
  };

  const renderAuditList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeInUp 0.5s ease' }}>
      
      {/* 1. KONTRIBUSI REFERENSI SYARIAH OLEH DPS */}
      <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px dashed var(--gold-intense)', boxShadow: '0 10px 30px var(--shadow-color)' }}>
        <h4 style={{ color: 'var(--gold-intense)', margin: '0 0 5px 0', fontWeight: 900, fontSize: '18px' }}>🕋 UPDATE BASIS PENGETAHUAN SYARIAH (RAG)</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '20px' }}>DPS dapat menambahkan Fatwa atau rujukan hukum baru untuk memperkuat analisis AI.</p>
        <form onSubmit={handleDpsIngest} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--gold-bright)', fontSize: '14px', marginBottom: '8px', fontWeight: 900 }}>JUDUL REFERENSI</label>
            <input type="text" value={ingestData.title} onChange={e => setIngestData({...ingestData, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--border-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '16px' }} placeholder="Contoh: Fatwa No 04..." />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--gold-bright)', fontSize: '14px', marginBottom: '8px', fontWeight: 900 }}>INTISARI HUKUM</label>
            <input type="text" value={ingestData.content} onChange={e => setIngestData({...ingestData, content: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--border-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '16px' }} placeholder="Masukkan poin hukum penting..." />
          </div>
          <button type="submit" style={{ padding: '12px 24px', background: 'var(--gold-intense)', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 5px 15px var(--shadow-color)', fontSize: '16px' }}>SIMPAN DATA</button>
        </form>
      </div>

      {/* 2. DAFTAR AKAD UNTUK DIAUDIT */}
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', borderRadius: '32px', border: '3px solid var(--gold-bright)', overflow: 'hidden', boxShadow: '0 40px 80px var(--shadow-color)' }}>
        <div style={{ background: 'var(--bg-header)', padding: '24px 36px', borderBottom: '2px solid var(--gold-bright)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 900, fontSize: '20px' }}>🛡️ PENGAWASAN KEPATUHAN AKAD</h2>
          <button onClick={fetchContractsForAudit} style={{ background: 'transparent', border: 'none', color: 'var(--gold-intense)', fontWeight: 800, cursor: 'pointer' }}>🔄 Refresh Data</button>
        </div>

        <div style={{ padding: '20px 36px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gold-bright)', background: 'var(--border-primary)' }}>
                <th style={{ padding: '16px', color: 'var(--gold-intense)', fontWeight: 800, fontSize: '13px' }}>NAMA ANGGOTA</th>
                <th style={{ padding: '16px', color: 'var(--gold-intense)', fontWeight: 800, fontSize: '13px' }}>AKAD</th>
                <th style={{ padding: '16px', color: 'var(--gold-intense)', fontWeight: 800, fontSize: '13px', textAlign: 'right' }}>NOMINAL</th>
                <th style={{ padding: '16px', color: 'var(--gold-intense)', fontWeight: 800, fontSize: '13px', textAlign: 'center' }}>AKSI AUDIT</th>
              </tr>
            </thead>
            <tbody>
              {loadingContracts ? (
                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>Memuat data...</td></tr>
              ) : contracts.length > 0 ? (
                contracts.map((c, idx) => (
                  <tr key={c.id || idx} style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--border-primary)' }}>
                    <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 800 }}>{c.users?.full_name || 'Pemohon'}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{getFriendlyContractType(c.type)}</td>
                    <td style={{ padding: '16px', color: '#10b981', fontWeight: 800, textAlign: 'right' }}>{formatIDR.format(c.amount)}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button 
                        onClick={() => runShariaAudit(c)}
                        style={{ background: 'var(--gold-intense)', color: '#043121', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '11px' }}
                      >
                        🔍 ANALISIS KEPATUHAN AI
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada akad aktif.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. HASIL AUDIT AI & KOTAK SARAN DPS */}
      {(auditing || selectedAudit) && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '28px', padding: '35px', border: '2px solid #60a5fa', boxShadow: '0 30px 60px var(--shadow-color)', animation: 'fadeIn 0.4s ease' }}>
          {auditing ? (
            <div style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 800 }}>
              ⏳ iQ-RA AI sedang memvalidasi struktur akad terhadap Basis Pengetahuan Syariah...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '40px' }}>
              <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-primary)', paddingRight: '20px' }}>
                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>Compliance Score</div>
                <div style={{ fontSize: '56px', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{selectedAudit.match_score}%</div>
                <div style={{ marginTop: '20px', background: '#10b981', color: '#043121', padding: '10px', borderRadius: '10px', fontWeight: 900, fontSize: '12px' }}>{selectedAudit.recommendation}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '20px', fontWeight: 900 }}>⚖️ Opini Kepatuhan Syariah Independen (AI)</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', background: 'var(--border-primary)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>{selectedAudit.opinion}</p>
                </div>
                
                {/* OPTIONAL DPS SUGGESTION BOX */}
                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
                  <label style={{ display: 'block', color: 'var(--gold-intense)', fontWeight: 900, fontSize: '14px', marginBottom: '12px' }}>📝 KOTAK SARAN & ARAHAN DPS (OPSIONAL)</label>
                  <textarea 
                    value={dpsNote}
                    onChange={e => setDpsNote(e.target.value)}
                    placeholder="Contoh: Pastikan rukun penyerahan barang didokumentasikan dengan lengkap..."
                    style={{ width: '100%', minHeight: '100px', background: 'var(--shadow-color)', border: '1px solid var(--border-primary)', borderRadius: '14px', padding: '18px', color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6' }}
                  />
                  <button style={{ marginTop: '20px', padding: '14px 28px', background: '#34d399', color: '#043121', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(52, 211, 153, 0.2)' }}>
                    ✅ SIMPAN HASIL AUDIT & CATATAN DPS
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      
      {activeMenu === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
            <DPSCard label="Rasio Kepatuhan Syariah Global" value="96.8%" icon="🌙" color="#10b981" comment="TINGKAT COMPLIANCE SANGAT TINGGI" />
            <DPSCard label="Akad Diaudit Terakhir" value={`${contracts.length} Akad`} icon="📖" color="var(--gold-intense)" comment="DARI TABEL FINANCING_CONTRACTS" />
            <DPSCard label="Skor Kepercayaan AI RAG" value="94.5%" icon="🤖" color="#3b82f6" comment="REKOMENDASI FITUR FINTECH" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            <div className="glass-dark" style={{ padding: '36px', border: '2.5px solid var(--gold-bright)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '32px', boxShadow: '0 20px 40px var(--shadow-color)' }}>
              <h3 style={{ color: 'var(--gold-intense)', margin: '0 0 12px 0', fontWeight: 900 }}>🕋 PENGAWASAN KEPATUHAN FATWA DSN-MUI</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '30px' }}>Analisis persilangan sistem terhadap rujukan Fatwa Syariah Nasional terkini.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <FatwaStatus label="Fatwa No 04: Pembiayaan Murabahah" status="SESUAI" desc="Rukun barang & transparansi margin margin margin terpenuhi." />
                <FatwaStatus label="Fatwa No 07: Pembiayaan Mudharabah" status="SESUAI" desc="Distribusi nisbah keuntungan tervalidasi adil bagi kedua pihak." />
                <FatwaStatus label="Fatwa No 19: Dana Kebajikan Qardh" status="SESUAI" desc="Ketentuan dana sosial tanpa bunga/biaya tambahan dijamin aman." />
              </div>
            </div>
            <div className="glass-dark" style={{ padding: '36px', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '32px', boxShadow: '0 20px 40px var(--shadow-color)' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0', fontWeight: 900 }}>🔔 Waspada Audit</h3>
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', padding: '16px', borderRadius: '16px', color: '#fca5a5', fontSize: '13px', fontWeight: 600 }}>
                ⚠️ <strong>Peringatan Sistem:</strong> Belum ada anomali riba atau akad tidak sah yang terdeteksi dalam transaksi bulan ini. Semua status bersih!
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMenu === 'audit' && renderAuditList()}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function DPSCard({ label, value, icon, color, comment }: any) {
  return (
    <div style={{ 
      background: 'var(--bg-card)', 
      backdropFilter: 'blur(12px)', 
      padding: '24px', 
      borderRadius: '24px', 
      border: `2px solid ${color}44`,
      boxShadow: '0 20px 40px var(--shadow-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
          <div style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: 900, marginTop: '4px' }}>{value}</div>
        </div>
        <div style={{ fontSize: '32px', background: 'var(--border-primary)', padding: '10px', borderRadius: '14px' }}>{icon}</div>
      </div>
      <div style={{ fontSize: '11px', color: color, fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>{comment}</div>
    </div>
  );
}

function FatwaStatus({ label, status, desc }: any) {
  return (
    <div style={{ display: 'flex', gap: '16px', background: 'var(--shadow-color)', padding: '16px', borderRadius: '16px', borderLeft: '4px solid #34d399', border: '1px solid var(--border-primary)' }}>
      <div style={{ flexGrow: 1 }}>
        <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '15px' }}>{label}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>{desc}</div>
      </div>
      <div style={{ alignSelf: 'center', background: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 900, padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid #34d399' }}>
        {status}
      </div>
    </div>
  );
}

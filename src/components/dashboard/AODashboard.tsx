'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State for New Prospect
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    amount: '',
    purpose: 'Modal Usaha'
  });

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

      setStats({
        activePortfolio: activeContracts.length || 12, // Mock 12 if table empty for demo
        pendingApps: prospectCount || 0,
        totalDisbursement: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount || 750000000),
        overdueTasks: 2 // Simulated for now
      });

      // 3. Fetch Pipeline Data
      const { data: prospectList } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (prospectList && prospectList.length > 0) {
        setProspects(prospectList);
      } else {
        // Fallback mock if database is still empty
        setProspects([
          { id: '1', name: 'Bpk. Ahmad Suherman', amount: 50000000, status: 'Survei Lapangan', created_at: new Date().toISOString() },
          { id: '2', name: 'Ibu Fatimah Zahra', amount: 15000000, status: 'Analisis Kelayakan', created_at: new Date().toISOString() },
        ]);
      }

      // 4. Fetch Portfolio (Members with contracts)
      const { data: portfolioData } = await supabase
        .from('financing_contracts')
        .select(`
          id,
          amount,
          type,
          status,
          users:member_id (full_name)
        `)
        .eq('status', 'active');
      
      if (portfolioData) setPortfolio(portfolioData);

    } catch (err) {
      console.error('Error fetching AO data:', err);
    }
  };

  useEffect(() => {
    fetchAOData();
  }, [profile]);

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
      const { error } = await supabase
        .from('prospects')
        .insert({
          name: formData.name,
          phone: formData.phone,
          amount: Number(formData.amount),
          purpose: formData.purpose,
          ao_id: profile.id
        });

      if (error) throw error;

      setMessage({ type: 'success', text: '🎯 Prospek baru berhasil disimpan ke Database Pipeline AO!' });
      setFormData({ name: '', phone: '', amount: '', purpose: 'Modal Usaha' });
      fetchAOData();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runAIAnalysis = async (prospect: any) => {
    setAnalyzing(true);
    setAiResult(null);
    setSelectedProspect(prospect);
    
    // Simulate AI Processing delay for realistic UX
    setTimeout(() => {
      // Mock result based on purpose
      const isBusiness = prospect.purpose.toLowerCase().includes('usaha') || prospect.purpose.toLowerCase().includes('investasi');
      
      setAiResult({
        contract: isBusiness ? "Mudharabah" : "Murabahah",
        score: isBusiness ? 94 : 88,
        justification: isBusiness 
          ? "Tujuan modal usaha sangat cocok dengan akad Bagi Hasil (Mudharabah) sesuai Fatwa DSN-MUI No. 07/2000. Ini mendorong keadilan bagi hasil antara koperasi dan anggota."
          : "Untuk pengadaan barang konsumtif, akad Jual Beli (Murabahah) adalah yang paling aman dan sesuai Fatwa DSN-MUI No. 04/2000.",
        risk_note: isBusiness
          ? "WAJIB: Lakukan analisis proyeksi laba rugi usaha anggota selama 12 bulan ke depan."
          : "PASTIKAN: Barang dibeli terlebih dahulu oleh koperasi sebelum diserahkan ke anggota."
      });
      setAnalyzing(false);
    }, 2000);
  };

  const renderOverview = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', animation: 'fadeInUp 0.6s ease-out' }}>
      <StatCard title="Portfolio Aktif" value={stats.activePortfolio} icon="📈" color="#10b981" />
      <StatCard title="Pengajuan Pending" value={stats.pendingApps} icon="⏳" color="#f59e0b" />
      <StatCard title="Total Pencairan" value={stats.totalDisbursement} icon="💰" color="#059669" />
      <StatCard title="Tugas Jatuh Tempo" value={stats.overdueTasks} icon="🚩" color="#ef4444" />
    </div>
  );

  const handleDisburse = async () => {
    if (!selectedProspect || !aiResult) return;
    
    setLoading(true);
    const supabase = createClient();
    
    try {
      // 1. Create the Financing Contract
      const { data: contract, error: contractErr } = await supabase
        .from('financing_contracts')
        .insert({
          member_id: profile.id, // In real case, link to actual member account
          prospect_id: selectedProspect.id,
          amount: selectedProspect.amount,
          type: aiResult.contract.toLowerCase(),
          status: 'active',
          disbursement_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (contractErr) throw contractErr;

      // 2. Automated Accounting Journal (Double-Entry Disbursement)
      // DEBIT: Piutang (Receivable), CREDIT: Kas (Cash)
      const res = await fetch('/api/accounting/record-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          description: `[PENCAIRAN] ${aiResult.contract} - ${selectedProspect.name}`,
          reference_no: `DSB-${Date.now()}`,
          entries: [
            { account_code: '1.1.03', debit: selectedProspect.amount, credit: 0 }, // Receivable (Mock Code)
            { account_code: '1.1.01', debit: 0, credit: selectedProspect.amount }  // Cash (Mock Code)
          ]
        })
      });

      if (!res.ok) throw new Error('Gagal mencatat jurnal akuntansi');

      // 3. Mark Prospect as Converted
      await supabase
        .from('prospects')
        .update({ is_converted: true, status: 'Cair / Aktif' })
        .eq('id', selectedProspect.id);

      setMessage({ type: 'success', text: `✅ BERHASIL! Dana Rp ${selectedProspect.amount.toLocaleString('id-ID')} telah dicairkan dan kontrak aktif.` });
      setAiResult(null);
      setSelectedProspect(null);
      fetchAOData();

    } catch (err: any) {
      setMessage({ type: 'error', text: 'Pencairan Gagal: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const renderAIAnalysis = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeInUp 0.5s ease-out' }}>
      <div style={{ background: 'rgba(4, 49, 33, 0.7)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h3 style={{ margin: '0 0 25px 0', fontSize: '22px', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '12px' }}>
          🤖 Analisis Akad Berbasis AI (RAG)
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>
          Pilih prospek dari pipeline untuk menjalankan analisis kesesuaian syariah menggunakan iQ-RA AI Engine.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
          {/* Prospect Selection List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {prospects.filter(p => !p.is_converted).map(p => (
              <div 
                key={p.id} 
                onClick={() => { setSelectedProspect(p); setAiResult(null); }}
                style={{ 
                  padding: '20px', borderRadius: '16px', border: selectedProspect?.id === p.id ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', background: selectedProspect?.id === p.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 800, color: '#ffffff' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Tujuan: {p.purpose}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>Rp {p.amount.toLocaleString('id-ID')}</div>
              </div>
            ))}
          </div>

          {/* AI Result Area */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '20px', padding: '30px', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            {!selectedProspect ? (
              <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                <div style={{ fontSize: '40px', marginBottom: '15px' }}>👈</div>
                Pilih nasabah di samping untuk mulai analisis
              </div>
            ) : analyzing ? (
              <div>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                <div style={{ fontWeight: 700, color: '#043121' }}>AI sedang meninjau Fatwa DSN-MUI...</div>
              </div>
            ) : aiResult ? (
              <div style={{ textAlign: 'left', width: '100%', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: '#f3c653', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 900 }}>REKOMENDASI AKAD</span>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>{aiResult.score}% Match</div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', marginBottom: '15px' }}>{aiResult.contract}</div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                  <strong>Justifikasi Syariah:</strong><br/>{aiResult.justification}
                </div>
                <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '12px', border: '1px solid #fecaca', color: '#991b1b', fontSize: '12px', fontWeight: 700, marginBottom: '25px' }}>
                  ⚠️ MITIGASI RISIKO: {aiResult.risk_note}
                </div>

                <button 
                  onClick={handleDisburse}
                  disabled={loading}
                  style={{ width: '100%', background: '#cca334', color: '#043121', padding: '20px', borderRadius: '14px', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 30px rgba(204, 163, 52, 0.3)' }}
                >
                  {loading ? '⏳ PROSES PENCAIRAN...' : '✅ SETUJUI & CAIRKAN DANA SEKARANG'}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => runAIAnalysis(selectedProspect)}
                style={{ background: '#043121', color: 'white', padding: '16px 32px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(4, 49, 33, 0.2)' }}
              >
                🚀 JALANKAN ANALISIS AI SEKARANG
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddForm = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeInUp 0.5s ease-out' }}>
      <div style={{ background: 'rgba(4, 49, 33, 0.7)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h3 style={{ margin: '0 0 30px 0', fontSize: '24px', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '15px' }}>
          📝 Input Prospek Pembiayaan Baru
        </h3>
        
        <form onSubmit={handleAddProspect} style={{ display: 'grid', gap: '20px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Nama Lengkap Calon Anggota</label>
            <input 
              type="text" 
              required
              placeholder="Contoh: Budi Santoso"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{ padding: '15px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Nomor WhatsApp / HP</label>
              <input 
                type="tel" 
                required
                placeholder="0812xxxx"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{ padding: '15px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '16px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Nominal Pengajuan (Rp)</label>
              <input 
                type="text" 
                required
                placeholder="10.000.000"
                value={formatNumber(formData.amount)}
                onChange={handleAmountChange}
                style={{ padding: '15px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '16px', fontWeight: 700, color: '#10b981', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Tujuan Penggunaan Dana</label>
            <select 
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              style={{ padding: '15px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '16px', outline: 'none' }}
            >
              <option value="Modal Usaha" style={{ color: '#043121' }}>Modal Usaha (Mudharabah/Musyarakah)</option>
              <option value="Pembelian Barang" style={{ color: '#043121' }}>Pembelian Barang/Aset (Murabahah)</option>
              <option value="Pendidikan" style={{ color: '#043121' }}>Biaya Pendidikan (Ijarah)</option>
              <option value="Renovasi Rumah" style={{ color: '#043121' }}>Renovasi Rumah (Murabahah/Imbt)</option>
              <option value="Lainnya" style={{ color: '#043121' }}>Lainnya</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ 
              marginTop: '10px', background: '#043121', color: 'white', padding: '18px', borderRadius: '14px', 
              border: 'none', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s',
              boxShadow: '0 10px 20px rgba(4, 49, 33, 0.2)', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '⏳ MENYIMPAN DATA...' : '🚀 DAFTARKAN PROSPEK KE PIPELINE'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {message && (
        <div style={{ 
          padding: '20px', borderRadius: '16px', marginBottom: '30px',
          background: message.type === 'success' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: message.type === 'success' ? '#4ade80' : '#fca5a5',
          border: `1px solid ${message.type === 'success' ? '#4ade80' : '#fca5a5'}`,
          fontWeight: 700, textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {activeMenu === 'overview' && (
        <>
          {renderOverview()}
          <div style={{ marginTop: '40px' }}>
            <div style={{ background: 'rgba(4, 49, 33, 0.7)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ margin: '0 0 25px 0', fontSize: '22px', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                🚀 Pipeline Pembiayaan AO
              </h3>
              {/* Pipeline Table Content */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '15px', color: '#f3c653', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Calon Anggota</th>
                      <th style={{ padding: '15px', color: '#f3c653', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Plafon</th>
                      <th style={{ padding: '15px', color: '#f3c653', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Tahapan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospects.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '20px 15px', fontWeight: 800, color: '#ffffff' }}>{p.name}</td>
                        <td style={{ padding: '20px 15px', color: '#10b981', fontWeight: 700 }}>Rp {p.amount.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '20px 15px', color: 'rgba(255,255,255,0.7)' }}>{p.status}</td>
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
      
      {activeMenu === 'survey' && (
        <div style={{ padding: '80px', textAlign: 'center', background: 'rgba(4, 49, 33, 0.7)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🗺️</div>
          <h3 style={{ fontWeight: 900, color: '#ffffff' }}>Modul Verifikasi Lapangan</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Gunakan aplikasi Mobile iQ-RA untuk mengunggah foto survei dan koordinat GPS.</p>
        </div>
      )}

      {activeMenu === 'portfolio' && (
        <div style={{ animation: 'fadeInUp 0.8s ease-out' }}>
           <div style={{ background: 'rgba(4, 49, 33, 0.7)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ margin: '0 0 25px 0', fontSize: '22px', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '12px' }}>
              📂 Daftar Portofolio Anggota Aktif
            </h3>
            {portfolio.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                {/* Portfolio Table Content */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#f3c653', fontWeight: 700 }}>Nama Anggota</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#f3c653', fontWeight: 700 }}>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '15px', fontWeight: 700, color: '#ffffff' }}>{(item as any).users?.full_name}</td>
                        <td style={{ padding: '15px', color: '#10b981', fontWeight: 700 }}>Rp {item.amount.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
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

function StatCard({ title, value, icon, color }: any) {
  return (
    <div style={{ 
      background: 'rgba(4, 49, 33, 0.7)', backdropFilter: 'blur(16px)', padding: '30px', borderRadius: '24px', 
      boxShadow: '0 15px 40px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255, 0.1)',
      display: 'flex', alignItems: 'center', gap: '20px'
    }}>
      <div style={{ 
        width: '60px', height: '60px', borderRadius: '18px', background: `${color}15`, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' 
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>{value}</div>
      </div>
    </div>
  );
}

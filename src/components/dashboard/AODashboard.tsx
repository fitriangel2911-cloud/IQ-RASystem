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

  const renderOverview = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', animation: 'fadeInUp 0.6s ease-out' }}>
      <StatCard title="Portfolio Aktif" value={stats.activePortfolio} icon="📈" color="#10b981" />
      <StatCard title="Pengajuan Pending" value={stats.pendingApps} icon="⏳" color="#f59e0b" />
      <StatCard title="Total Pencairan" value={stats.totalDisbursement} icon="💰" color="#059669" />
      <StatCard title="Tugas Jatuh Tempo" value={stats.overdueTasks} icon="🚩" color="#ef4444" />
    </div>
  );

  const renderPipeline = () => (
    <div style={{ marginTop: '40px', animation: 'fadeInUp 0.8s ease-out' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid rgba(4, 49, 33, 0.1)' }}>
        <h3 style={{ margin: '0 0 25px 0', fontSize: '22px', fontWeight: 900, color: '#043121', display: 'flex', alignItems: 'center', gap: '12px' }}>
          🚀 Pipeline Pembiayaan AO
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '15px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Calon Anggota</th>
                <th style={{ padding: '15px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Plafon</th>
                <th style={{ padding: '15px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Tahapan</th>
                <th style={{ padding: '15px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Update Terakhir</th>
                <th style={{ padding: '15px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 15px', fontWeight: 800, color: '#043121' }}>{p.name}</td>
                  <td style={{ padding: '20px 15px', color: '#059669', fontWeight: 700 }}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.amount)}
                  </td>
                  <td style={{ padding: '20px 15px' }}>
                    <span style={{ 
                      padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                      background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '20px 15px', color: '#64748b', fontSize: '14px' }}>
                    {new Date(p.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td style={{ padding: '20px 15px' }}>
                    <button style={{ background: '#043121', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                      Detail Analisis
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAddForm = () => (
    <div style={{ marginTop: '40px', animation: 'fadeInUp 1s ease-out' }}>
      <div style={{ background: 'linear-gradient(135deg, #043121 0%, #065f46 100%)', borderRadius: '24px', padding: '40px', color: 'white', boxShadow: '0 30px 60px rgba(4, 49, 33, 0.2)' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 900 }}>✍️ Input Prospek Baru</h3>
        <p style={{ opacity: 0.8, marginBottom: '30px', fontSize: '14px' }}>Daftarkan calon anggota hasil canvassing Anda hari ini secara riil ke database.</p>
        
        <form onSubmit={handleAddProspect} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Nama Lengkap</label>
            <input 
              type="text" required 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
              placeholder="Contoh: Bpk. Kurniawan"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>No. WhatsApp</label>
            <input 
              type="text" required 
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
              placeholder="0812xxxx"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Plafon Diajukan (Rp)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>Rp</span>
              <input 
                type="text" required 
                value={formatNumber(formData.amount)} 
                onChange={handleAmountChange}
                style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '18px', fontWeight: 800 }}
                placeholder="0"
              />
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '11px', opacity: 0.6 }}>Otomatis menambahkan titik pemisah ribuan.</p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Tujuan Pembiayaan</label>
            <select 
              value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
            >
              <option value="Modal Usaha">Modal Usaha</option>
              <option value="Investasi">Investasi</option>
              <option value="Konsumtif">Konsumtif (Murabahah)</option>
              <option value="Renovasi Rumah">Renovasi Rumah</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <button 
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '18px', background: '#f3c653', color: '#043121', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', marginTop: '10px' }}
            >
              {loading ? 'MENYIMPAN KE DATABASE...' : 'MASUKKAN KE PIPELINE AO'}
            </button>
          </div>
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
          {renderPipeline()}
        </>
      )}

      {activeMenu === 'leads' && renderAddForm()}
      
      {activeMenu === 'portfolio' && (
        <div style={{ animation: 'fadeInUp 0.8s ease-out' }}>
           <div style={{ background: 'white', borderRadius: '24px', padding: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid rgba(4, 49, 33, 0.1)' }}>
            <h3 style={{ margin: '0 0 25px 0', fontSize: '22px', fontWeight: 900, color: '#043121', display: 'flex', alignItems: 'center', gap: '12px' }}>
              📂 Daftar Portofolio Anggota Aktif
            </h3>
            {portfolio.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Nama Anggota</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Produk</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Outstanding</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '15px', fontWeight: 700 }}>{(item as any).users?.full_name}</td>
                        <td style={{ padding: '15px', textTransform: 'capitalize' }}>{item.type}</td>
                        <td style={{ padding: '15px', color: '#059669', fontWeight: 700 }}>
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}
                        </td>
                        <td style={{ padding: '15px' }}>
                           <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>AKTIF</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Belum ada portofolio pembiayaan aktif dalam database.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div style={{ 
      background: 'white', padding: '30px', borderRadius: '24px', 
      boxShadow: '0 15px 40px rgba(0,0,0,0.04)', border: '1px solid rgba(4, 49, 33, 0.05)',
      display: 'flex', alignItems: 'center', gap: '20px'
    }}>
      <div style={{ 
        width: '60px', height: '60px', borderRadius: '18px', background: `${color}15`, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' 
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#043121', marginTop: '4px' }}>{value}</div>
      </div>
    </div>
  );
}

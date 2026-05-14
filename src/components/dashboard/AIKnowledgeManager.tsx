'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AIKnowledgeManager() {
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'FATWA',
    content: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchKnowledge = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('sharia_knowledge')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setKnowledgeList(data);
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content || !formData.title) return;

    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('sharia_knowledge')
        .insert({
          source_title: formData.title,
          category: formData.category,
          content: formData.content,
          metadata: { ingested_at: new Date().toISOString() }
        });

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ Dokumen berhasil di-ingest ke Basis Pengetahuan AI!' });
      setFormData({ title: '', category: 'FATWA', content: '' });
      fetchKnowledge();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal ingest: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.5s ease' }}>
      
      {/* 1. INPUT FORM */}
      <div style={{ background: 'rgba(4, 49, 33, 0.8)', backdropFilter: 'blur(10px)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(243, 198, 83, 0.2)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#f3c653', fontWeight: 900, fontSize: '24px' }}>📥 INGESTI PENGETAHUAN SYARIAH</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '30px', fontSize: '14px' }}>Masukkan teks regulasi atau fatwa terbaru untuk memperluas cakrawala berpikir AI iQ-RA.</p>

        <form onSubmit={handleIngest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>JUDUL DOKUMEN / SUMBER</label>
              <input 
                type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Contoh: Fatwa DSN No. 04/2000 tentang Murabahah"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>KATEGORI</label>
              <select 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              >
                <option value="FATWA" style={{color:'#000'}}>Fatwa DSN-MUI</option>
                <option value="SOP" style={{color:'#000'}}>SOP Internal Koperasi</option>
                <option value="REGULASI" style={{color:'#000'}}>PSAK / Regulasi Pemerintah</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>ISI TEKS PENGETAHUAN</label>
            <textarea 
              required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
              placeholder="Paste isi teks pasal atau poin-poin penting di sini..."
              style={{ width: '100%', minHeight: '200px', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', lineHeight: '1.6' }}
            />
          </div>

          {message && (
            <div style={{ padding: '15px', borderRadius: '10px', background: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? '#4ade80' : '#fca5a5', fontSize: '14px', textAlign: 'center', border: '1px solid currentColor' }}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            style={{ padding: '20px', background: '#f3c653', color: '#043121', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(243, 198, 83, 0.3)' }}
          >
            {loading ? '⏳ SEDANG MENGOLAH DATA...' : '🚀 INGEST KE KNOWLEDGE BASE AI'}
          </button>
        </form>
      </div>

      {/* 2. KNOWLEDGE LIST TABLE */}
      <div style={{ background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 25px 0', color: '#043121', fontWeight: 900, fontSize: '22px' }}>📚 BASIS PENGETAHUAN SAAT INI</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '12px' }}>SUMBER</th>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '12px' }}>KATEGORI</th>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '12px' }}>UKURAN DATA</th>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '12px' }}>TANGGAL INGESTI</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeList.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 15px', fontWeight: 800, color: '#043121' }}>{item.source_title}</td>
                  <td style={{ padding: '20px 15px' }}>
                    <span style={{ padding: '4px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>{item.category}</span>
                  </td>
                  <td style={{ padding: '20px 15px', color: '#64748b', fontSize: '14px' }}>{item.content.length} Karakter</td>
                  <td style={{ padding: '20px 15px', color: '#64748b', fontSize: '14px' }}>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
              {knowledgeList.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Belum ada dokumen yang di-ingest.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

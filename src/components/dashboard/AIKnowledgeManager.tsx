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

  // Status berkas yang diunggah
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

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

  const handleRemoveFile = () => {
    setIsFileUploaded(false);
    setUploadedFileName('');
    setFormData({
      title: '',
      category: 'FATWA',
      content: ''
    });
    setMessage(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage({ type: 'success', text: `⏳ Sedang memuat modul extractor untuk berkas '${file.name}'...` });

    // Bersihkan nama file untuk dijadikan judul sumber
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' ').replace(/-/g, ' ');

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        // 1. Load PDFJS secara dinamis dari CDN jika belum terpasang
        if (!(window as any).pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
          document.head.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = () => {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
              resolve(null);
            };
            script.onerror = () => reject(new Error('Gagal memuat modul PDF.js dari internet (CDN). Silakan coba salin & tempel teks secara manual.'));
          });
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const typedarray = new Uint8Array(arrayBuffer);
            const pdf = await (window as any).pdfjsLib.getDocument(typedarray).promise;
            
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += pageText + '\n';
            }
            
            setFormData(prev => ({
              ...prev,
              title: cleanTitle,
              content: fullText.trim()
            }));
            setIsFileUploaded(true);
            setUploadedFileName(file.name);
            setMessage({ type: 'success', text: `✅ Berkas PDF '${file.name}' (${pdf.numPages} halaman) berhasil diekstrak! Tinjau data di bawah dan klik ingest.` });
            setLoading(false);
          } catch (err: any) {
            setMessage({ type: 'error', text: 'Gagal mengekstrak berkas PDF: ' + err.message });
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);

      } else if (file.name.toLowerCase().endsWith('.docx')) {
        // 2. Load Mammoth.js secara dinamis dari CDN jika belum terpasang
        if (!(window as any).mammoth) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
          document.head.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Gagal memuat modul Mammoth.js dari internet (CDN). Silakan coba salin & tempel teks secara manual.'));
          });
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
            
            setFormData(prev => ({
              ...prev,
              title: cleanTitle,
              content: result.value.trim()
            }));
            setIsFileUploaded(true);
            setUploadedFileName(file.name);
            setMessage({ type: 'success', text: `✅ Berkas Word (.docx) '${file.name}' berhasil diekstrak! Tinjau data di bawah dan klik ingest.` });
            setLoading(false);
          } catch (err: any) {
            setMessage({ type: 'error', text: 'Gagal mengekstrak berkas Word: ' + err.message });
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);

      } else {
        // 3. Ekstraksi dokumen teks standar (.txt, .md, .json)
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          try {
            if (file.name.toLowerCase().endsWith('.json')) {
              const parsed = JSON.parse(text);
              setFormData({
                title: parsed.title || cleanTitle,
                category: parsed.category || 'FATWA',
                content: parsed.content || text
              });
            } else {
              setFormData(prev => ({
                ...prev,
                title: cleanTitle,
                content: text
              }));
            }
            setIsFileUploaded(true);
            setUploadedFileName(file.name);
            setMessage({ type: 'success', text: `✅ Berkas '${file.name}' berhasil dibaca secara instan! Tinjau data di bawah dan klik ingest.` });
          } catch (err: any) {
            setMessage({ type: 'error', text: 'Gagal membaca isi berkas teks: ' + err.message });
          }
          setLoading(false);
        };
        reader.readAsText(file);
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Gagal membaca berkas: ' + e.message });
      setLoading(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content || !formData.title) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/ai/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          content: formData.content
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal melakukan ingesti');

      setMessage({ type: 'success', text: `✅ ${data.message || 'Dokumen berhasil di-ingest ke Basis Pengetahuan AI!'}` });
      setFormData({ title: '', category: 'FATWA', content: '' });
      setIsFileUploaded(false);
      setUploadedFileName('');
      fetchKnowledge();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal ingest: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini dari basis pengetahuan RAG?')) return;
    
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('sharia_knowledge')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setMessage({ type: 'success', text: '✅ Dokumen berhasil dihapus dari basis pengetahuan AI!' });
      fetchKnowledge();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal menghapus dokumen: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.5s ease' }}>
      
      {/* 1. INPUT FORM */}
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(10px)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border-primary)', boxShadow: '0 20px 50px var(--shadow-color)' }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'var(--gold-intense)', fontWeight: 900, fontSize: '24px' }}>📥 INGESTI PENGETAHUAN SYARIAH</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '14px' }}>Masukkan teks regulasi atau fatwa terbaru untuk memperluas cakrawala berpikir AI iQ-RA.</p>
 
        <form onSubmit={handleIngest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* File Quick Upload Area */}
          <div style={{ 
            border: '2px dashed var(--gold-bright)', 
            borderRadius: '16px', 
            padding: '24px', 
            textAlign: 'center', 
            background: 'rgba(204, 163, 52, 0.03)',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease'
          }}>
            <span style={{ fontSize: '32px' }}>📂</span>
            <strong style={{ color: 'var(--gold-intense)', fontSize: '14px', letterSpacing: '0.5px' }}>PILIH BERKAS DOKUMEN (.pdf, .docx, .txt, .md, .json)</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Sistem akan otomatis mengekstrak & mengisi naskah secara instan tanpa mengetik manual!</span>
            <input 
              type="file" 
              accept=".pdf,.docx,.txt,.md,.json" 
              onChange={handleFileChange} 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                opacity: 0, 
                cursor: 'pointer' 
              }} 
            />
          </div>
 
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>JUDUL DOKUMEN / SUMBER</label>
              <input 
                type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Contoh: Fatwa DSN No. 04/2000 tentang Murabahah"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>KATEGORI</label>
              <select 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              >
                <option value="FATWA" style={{color:'var(--text-primary)', background:'var(--bg-page)'}}>Fatwa DSN-MUI</option>
                <option value="BUKU" style={{color:'var(--text-primary)', background:'var(--bg-page)'}}>Sumber Buku / Kitab Fikih</option>
                <option value="IAI_PSAK" style={{color:'var(--text-primary)', background:'var(--bg-page)'}}>Standar Akuntansi & PSAK (IAI)</option>
                <option value="AAOIFI" style={{color:'var(--text-primary)', background:'var(--bg-page)'}}>Standar Keuangan Syariah AAOIFI</option>
                <option value="SOP" style={{color:'var(--text-primary)', background:'var(--bg-page)'}}>SOP Internal Koperasi</option>
                <option value="REGULASI" style={{color:'var(--text-primary)', background:'var(--bg-page)'}}>Regulasi Pemerintah / Undang-Undang</option>
              </select>
            </div>
          </div>
 
          {!isFileUploaded ? (
            <div>
              <label style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>ISI TEKS PENGETAHUAN</label>
              <textarea 
                required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Paste isi teks pasal atau poin-poin penting di sini..."
                style={{ width: '100%', minHeight: '200px', padding: '20px', borderRadius: '12px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', lineHeight: '1.6' }}
              />
            </div>
          ) : (
            <div style={{ 
              background: 'rgba(204, 163, 52, 0.05)', 
              border: '1px solid var(--gold-bright)', 
              borderRadius: '16px', 
              padding: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '36px' }}>📄</span>
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '15px' }}>{uploadedFileName}</strong>
                  <span style={{ color: 'var(--gold-bright)', fontSize: '12px', fontWeight: 700 }}>
                    Naskah berhasil diekstrak secara internal ({formData.content.length} karakter)
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleRemoveFile}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444', 
                  border: '1px solid #ef4444', 
                  borderRadius: '10px', 
                  padding: '10px 16px', 
                  fontSize: '12px', 
                  fontWeight: 800, 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ❌ Batal & Hapus Berkas
              </button>
            </div>
          )}
 
          {message && (
            <div style={{ padding: '15px', borderRadius: '10px', background: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? '#4ade80' : '#fca5a5', fontSize: '14px', textAlign: 'center', border: '1px solid currentColor' }}>
              {message.text}
            </div>
          )}
 
          <button 
            type="submit" disabled={loading}
            style={{ padding: '20px', background: 'var(--gold-intense)', color: '#043121', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 30px var(--shadow-color)' }}
          >
            {loading ? '⏳ SEDANG MENGOLAH DATA...' : '🚀 INGEST KE KNOWLEDGE BASE AI'}
          </button>
        </form>
      </div>
 
      {/* 2. KNOWLEDGE LIST TABLE */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 50px var(--shadow-color)' }}>
        <h3 style={{ margin: '0 0 25px 0', color: 'var(--text-primary)', fontWeight: 900, fontSize: '22px' }}>📚 BASIS PENGETAHUAN SAAT INI</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                <th style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '12px' }}>SUMBER</th>
                <th style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '12px' }}>KATEGORI</th>
                <th style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '12px' }}>UKURAN DATA</th>
                <th style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '12px' }}>TANGGAL INGESTI</th>
                <th style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeList.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '20px 15px', fontWeight: 800, color: 'var(--text-primary)' }}>{item.source_title || item.title || 'Dokumen Syariah'}</td>
                  <td style={{ padding: '20px 15px' }}>
                    <span style={{ padding: '4px 10px', background: 'var(--border-primary)', color: 'var(--text-secondary)', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>{item.category}</span>
                  </td>
                  <td style={{ padding: '20px 15px', color: 'var(--text-secondary)', fontSize: '14px' }}>{item.content.length} Karakter</td>
                  <td style={{ padding: '20px 15px', color: 'var(--text-secondary)', fontSize: '14px' }}>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                  <td style={{ padding: '20px 15px', textAlign: 'center' }}>
                    <button 
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={loading}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ❌ Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {knowledgeList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada dokumen yang di-ingest.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

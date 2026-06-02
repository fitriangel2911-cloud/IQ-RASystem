'use client';

import React, { useState, useEffect } from 'react';

export default function RAGPipelineView() {
  const [folderPath, setFolderPath] = useState('doc/regulation/fatwa');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'chunking' | 'embedding' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [indexedFiles, setIndexedFiles] = useState<any[]>([
    { name: 'Fatwa_DSN_04_Murabahah.pdf', size: '1.2 MB', chunks: 24, status: 'SYNCHRONIZED' },
    { name: 'Fatwa_DSN_07_Mudharabah.pdf', size: '890 KB', chunks: 18, status: 'SYNCHRONIZED' },
    { name: 'SAK_EP_Pilar_Syariah_12.pdf', size: '2.4 MB', chunks: 42, status: 'SYNCHRONIZED' },
  ]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleIngest = () => {
    if (!folderPath.trim()) return;
    setStatus('scanning');
    setProgress(0);
    setLogs([]);
    addLog(`Menginisialisasi saluran pipa (pipeline) RAG untuk folder: /${folderPath}`);
  };

  useEffect(() => {
    if (status === 'idle') return;

    let timer: any;

    if (status === 'scanning') {
      timer = setTimeout(() => {
        setProgress(25);
        addLog('Memindai direktori lokal... Menemukan 3 berkas baru (.pdf/.docx)');
        addLog('fatwa_dsn_19_qardh.pdf terbaca.');
        addLog('fatwa_dsn_112_wakalah.pdf terbaca.');
        addLog('psaak_101_penyajian_keuangan.pdf terbaca.');
        setStatus('chunking');
      }, 1500);
    } else if (status === 'chunking') {
      timer = setTimeout(() => {
        setProgress(50);
        addLog('Membagi dokumen menjadi potongan teks (RecursiveCharacterTextSplitter)...');
        addLog('Menghasilkan 84 pecahan teks (Chunks) dengan overlap 200 karakter.');
        setStatus('embedding');
      }, 2000);
    } else if (status === 'embedding') {
      timer = setTimeout(() => {
        setProgress(85);
        addLog('Mengirimkan pecahan teks ke Embedding Model OpenAI text-embedding-3-small...');
        addLog('Menyimpan representasi vektor ke database PostgreSQL Vector (pgvector) Supabase...');
        setStatus('completed');
      }, 2500);
    } else if (status === 'completed') {
      setProgress(100);
      addLog('PROSES SELESAI! Seluruh basis pengetahuan baru berhasil dipelajari oleh AI Assistant.');
      setIndexedFiles(prev => [
        ...prev,
        { name: 'fatwa_dsn_19_qardh.pdf', size: '620 KB', chunks: 12, status: 'SYNCHRONIZED' },
        { name: 'fatwa_dsn_112_wakalah.pdf', size: '740 KB', chunks: 15, status: 'SYNCHRONIZED' },
        { name: 'psaak_101_penyajian_keuangan.pdf', size: '3.1 MB', chunks: 58, status: 'SYNCHRONIZED' }
      ]);
    }

    return () => clearTimeout(timer);
  }, [status]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeInUp 0.5s' }}>
      
      {/* Top Panel Input Configuration */}
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', padding: '40px', borderRadius: '32px', border: '3px solid #cca334', boxShadow: '0 30px 60px var(--shadow-color)' }}>
        <h3 style={{ color: 'var(--gold-intense)', margin: '0 0 8px 0', fontWeight: 900, fontSize: '22px' }}>KONFIGURASI FOLDER KNOWLEDGE BASE RAG</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>Tentukan alamat folder peraturan/fatwa di server lokal. AI akan secara otomatis membaca, mensegmentasi, dan menyimpannya ke dalam Vector Database untuk dasar audit kepatuhan syariah.</p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <input 
              type="text" 
              value={folderPath} 
              disabled={status !== 'idle' && status !== 'completed'}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="Alamat direktori folder (Contoh: doc/fatwa)" 
              style={{
                width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)', borderRadius: '16px',
                padding: '18px 20px 18px 20px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700, outline: 'none',
                boxShadow: 'inset 0 4px 10px var(--shadow-color)'
              }}
            />
          </div>
          <button 
            onClick={handleIngest}
            disabled={status !== 'idle' && status !== 'completed'}
            style={{
              padding: '18px 36px', background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
              color: '#02130e', borderRadius: '16px', fontWeight: 900, fontSize: '15px', border: 'none',
              cursor: (status !== 'idle' && status !== 'completed') ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 25px rgba(243, 198, 83, 0.3)', transition: 'all 0.2s'
            }}
          >
            {(status !== 'idle' && status !== 'completed') ? 'SEDANG MEMPROSES...' : 'SINKRONISASI FOLDER'}
          </button>
        </div>

        {/* Active Ingestion Progress Visualization */}
        {status !== 'idle' && (
          <div style={{ marginTop: '40px', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '10px', fontSize: '14px' }}>
              <span>
                {status === 'scanning' && 'Memindai Berkas Dokumen...'}
                {status === 'chunking' && 'Memecah Karakter Teks (Tokenization)...'}
                {status === 'embedding' && 'Membuat Representasi Vektor Kedalam DB...'}
                {status === 'completed' && 'Sinkronisasi Sukses! Database Terupdate.'}
              </span>
              <span style={{ color: '#f3c653' }}>{progress}%</span>
            </div>
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #34d399, #f3c653)', transition: 'width 0.5s ease-out', boxShadow: '0 0 10px rgba(52,211,153,0.5)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Split Panel: Logs vs File Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Terminal Console Logs */}
        <div style={{ background: '#02130e', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 45px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#34d399', margin: 0, fontWeight: 900, fontFamily: 'monospace' }}>TERMINAL LOG PIPA RAG</h4>
            <span style={{ height: '10px', width: '10px', background: status !== 'idle' && status !== 'completed' ? '#fbbf24' : '#34d399', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px currentColor' }} />
          </div>
          <div style={{ height: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', fontSize: '13px', color: '#a7f3d0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
            {logs.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>System idle. Menunggu perintah sinkronisasi folder...</div>
            )}
          </div>
        </div>

        {/* Synchronized Knowledge List */}
        <div className="glass-dark" style={{ padding: '30px', border: '1.5px solid var(--border-primary)', background: 'var(--bg-card)', backdropFilter: 'blur(12px)' }}>
          <h4 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0', fontWeight: 900 }}>DAFTAR PENGETAHUAN TERINDEKS ({indexedFiles.length})</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
            {indexedFiles.map((file, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>{file.name}</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>Ukuran: {file.size}</span>
                    <span>•</span>
                    <span style={{ color: '#cca334', fontWeight: 700 }}>{file.chunks} Chunks</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid #34d399', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 900 }}>
                  {file.status}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      
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

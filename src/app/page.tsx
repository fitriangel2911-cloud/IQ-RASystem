'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/* ── Static Components ─────────────────────────────────────────── */

// The persistent global animated backdrop (the star of the show)
function GlobalSiteBackground() {
  return (
    <div className="site-bg-wrapper" aria-hidden="true">
      <div className="site-bg-pattern" />
      <div className="site-bg-overlay" />
    </div>
  );
}

function LogoIcon({ size = 42, rounded = 10, showBadge = true }: { size?: number; iconSize?: number; rounded?: number; showBadge?: boolean }) {
  // The premium recolored 3D pixel art icon (Dark Emerald Green)
  const content = (
    <img 
      src="/logo-recolored.png" 
      alt="iQ-RA Logo" 
      style={{ 
        width: '86%', 
        height: '86%', 
        objectFit: 'contain',
        flexShrink: 0
      }} 
    />
  );

  if (!showBadge) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{
      background: '#cca334', // The user requested original GOLD / ORANGE color!
      width: size,
      height: size,
      borderRadius: rounded,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      {content}
    </div>
  );
}

function Navbar() {
  return (
    <nav className="navbar">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
        {/* Logo area aligned left */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <LogoIcon />
            <span style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}>
              <span style={{ color: '#ffffff' }}>iQ-RA </span>
              <span style={{ color: '#cca334', fontWeight: 900 }}>SYSTEM</span>
            </span>
          </Link>
        </div>

        {/* Nav menu centered */}
        <div className="nav-menu-section" style={{ display: 'flex', gap: 36, alignItems: 'center', justifyContent: 'center' }}>
          {['PRODUK', 'PROFIL', 'LAPORAN'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} style={{ textDecoration: 'none', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 700, fontSize: 15, letterSpacing: '0.5px' }}>{item}</a>
          ))}
        </div>

        {/* Action button aligned far right */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/login" className="btn-primary-gold" style={{ fontSize: 17, padding: '12px 32px', fontWeight: 800 }}>Masuk</Link>
        </div>
      </div>
    </nav>
  );
}

function SectionBadge({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '8px 20px', background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 999,
      color: '#084b35', fontWeight: 700, fontSize: 15, letterSpacing: '0.5px', marginBottom: 20
    }}>
      {text}
    </span>
  );
}

/* ── PAGE SECTIONS ───────────────────────────────────────────── */

function HeroSection() {
  const [showContact, setShowContact] = useState(false);

  return (
    <section className="page-content-section" style={{ padding: '80px 24px 120px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="hero-glass-container" style={{ padding: '100px 40px', textAlign: 'center', color: 'white' }}>
          
          <h1 className="reveal" style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 24 }}>
            Koperasi Syariah Lebih Cerdas<br />
            <span style={{ color: '#cca334' }}>dengan iQ-RA System</span>
          </h1>

          <p className="reveal" style={{ fontSize: 20, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', maxWidth: 850, margin: '0 auto 48px', fontWeight: 500 }}>
            Smart Decision Support System yang mengintegrasikan akuntansi modern dengan kepatuhan syariah otomatis melalui teknologi <strong>Retrieval-Augmented Generation (RAG)</strong>.
          </p>

          <div className="reveal" style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
            <button 
              onClick={() => setShowContact(true)} 
              className="btn-primary-gold" 
              style={{ fontSize: 18, padding: '18px 40px', border: 'none', cursor: 'pointer', fontWeight: 800 }}
            >
              Konsultasi Gratis
            </button>
          </div>
        </div>
      </div>

      {/* Modern Glassmorphism Overlay for Contact Details */}
      {showContact && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(4, 49, 33, 0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.08)', 
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 28, 
              padding: '48px 40px', 
              maxWidth: 440, 
              width: '90%', 
              textAlign: 'center',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)', 
              color: '#fff', 
              position: 'relative',
              animation: 'fadeInScale 0.3s ease'
            }}
          >
            <button 
              onClick={() => setShowContact(false)} 
              style={{ 
                position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', 
                border: 'none', borderRadius: '50%', color: '#fff', fontSize: 22, 
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', opacity: 0.8, transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              &times;
            </button>

            <div style={{ fontSize: 48, marginBottom: 20 }}>📞</div>
            <h3 style={{ fontSize: 26, fontWeight: 800, color: '#cca334', marginBottom: 12 }}>Konsultasi Gratis</h3>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.6, marginBottom: 36 }}>
              Silakan hubungi tim konsultan syariah kami langsung melalui kontak di bawah ini:
            </p>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <a 
                href="https://wa.me/6281282315795" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, 
                  background: '#25D366', color: '#fff', textDecoration: 'none', 
                  padding: '16px 24px', borderRadius: 16, fontWeight: 800, fontSize: 16,
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)', transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>💬 WA: 0812-8231-5795</span>
              </a>
              <a 
                href="mailto:IQ-RASystem@gmail.com" 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, 
                  background: '#cca334', color: '#043121', textDecoration: 'none', 
                  padding: '16px 24px', borderRadius: 16, fontWeight: 800, fontSize: 16,
                  boxShadow: '0 4px 15px rgba(204, 163, 52, 0.3)', transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>✉️ IQ-RASystem@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProfilSection() {
  return (
    <section id="profil" className="page-content-section" style={{ padding: '80px 24px' }}>
      <div className="profil-grid-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="reveal">
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#043121', marginBottom: 24, lineHeight: 1.2 }}>
            Membangun Ekonomi Umat <br />
            <span style={{ color: '#084b35' }}>Berbasis Teknologi</span>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.8, color: '#4b5563', marginBottom: 32 }}>
            IQ-RA System lahir dengan visi mengangkat derajat ekonomi masyarakat melalui asas
            keadilan, tolong menolong, dan transparansi penuh yang diakomodasi oleh sistem digital mutakhir.
          </p>
          <div style={{ display: 'grid', gap: 20 }}>
            {[
              { icon: '🏛️', t: 'Diawasi Dewan Pengawas Syariah (DPS)' },
              { icon: '📐', t: 'Kesesuaian Standar Akuntansi SAK EP' },
              { icon: '🛡️', t: 'Keamanan Data Terenkripsi Berlapis' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'white', padding: '20px 24px', borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #ecfdf5' }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#1f2937' }}>{item.t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal" style={{ background: '#043121', padding: 40, borderRadius: 32, color: 'white', boxShadow: '0 30px 60px rgba(6,78,59,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LogoIcon size={64} iconSize={34} rounded={16} />
            <h3 style={{ fontSize: 28, fontWeight: 800, color: '#cca334', marginTop: 20 }}>IQ-RA System</h3>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>Statistik Terkini</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {[
              { label: 'Anggota', val: '2,450+' },
              { label: 'Aset Kelola', val: 'Rp 45M' },
              { label: 'Penyaluran', val: 'Rp 32M' },
              { label: 'Rating Kepuasan', val: '98.5%' }
            ].map(s => (
              <div key={s.label} style={{ padding: 24, background: 'rgba(255,255,255,0.08)', borderRadius: 16, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{s.val}</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProdukSection() {
  const products = [
    { name: 'Murabahah', icon: '🤝', desc: 'Jual beli transparan dengan margin yang disepakati kedua pihak.', tag: 'Populer' },
    { name: 'Mudharabah', icon: '🌱', desc: 'Kerjasama bagi hasil dimana modal sepenuhnya dari pemilik dana.', tag: 'Investasi' },
    { name: 'Musyarakah', icon: '💼', desc: 'Kemitraan penggabungan modal untuk usaha produktif bersama.', tag: 'Bisnis' },
    { name: 'Ijarah', icon: '🏠', desc: 'Sewa manfaat atas aset produktif untuk menunjang kebutuhan.', tag: 'Fasilitas' },
    { name: 'Istishna', icon: '🏗️', desc: 'Pemesanan pembuatan barang atau infrastruktur tertentu.', tag: 'Konstruksi' },
    { name: 'Qardhul Hasan', icon: '❤️', desc: 'Pinjaman kebajikan sosial tanpa beban imbalan sama sekali.', tag: 'Sosial' }
  ];

  return (
    <section id="produk" className="page-content-section" style={{ padding: '100px 24px', background: 'rgba(255,255,255,0.6)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }} className="reveal">
          <SectionBadge text="PILIHAN PRODUK" />
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#043121' }}>6 Pilihan Akad Syariah Utama</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 32 }}>
          {products.map((p, i) => (
            <div key={p.name} className="feature-card reveal" style={{ borderTop: '5px solid #cca334' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ fontSize: 48 }}>{p.icon}</div>
                <span style={{ background: '#fdf2f8', color: '#b45309', fontSize: 14, fontWeight: 800, padding: '6px 14px', borderRadius: 999, background: '#fef3c7' }}>{p.tag}</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#043121', marginBottom: 16 }}>{p.name}</h3>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#4b5563' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LaporanSection() {
  const [period, setPeriod] = useState<'bulanan' | 'tahunan'>('tahunan');

  const data = {
    tahunan: [
      {
        title: 'NERACA',
        label: 'Total Aset',
        value: 'Rp 1.250M',
        color: '#ffffff',
        details: [
          { label: 'Kewajiban', val: 'Rp 450M' },
          { label: 'Ekuitas', val: 'Rp 800M' }
        ]
      },
      {
        title: 'LABA RUGI',
        label: 'Surplus (SHU)',
        value: 'Rp 140M',
        color: '#cca334',
        details: [
          { label: 'Pendapatan', val: 'Rp 320M' }
        ]
      },
      {
        title: 'EKUITAS',
        label: 'Modal Akhir',
        value: 'Rp 800M',
        color: '#ffffff',
        details: []
      },
      {
        title: 'ARUS KAS',
        label: 'Arus Kas Bersih',
        value: 'Rp 70M',
        color: '#ffffff',
        details: []
      }
    ],
    bulanan: [
      {
        title: 'NERACA',
        label: 'Total Aset',
        value: 'Rp 104.2M',
        color: '#ffffff',
        details: [
          { label: 'Kewajiban', val: 'Rp 37.5M' },
          { label: 'Ekuitas', val: 'Rp 66.7M' }
        ]
      },
      {
        title: 'LABA RUGI',
        label: 'Surplus (SHU)',
        value: 'Rp 11.6M',
        color: '#cca334',
        details: [
          { label: 'Pendapatan', val: 'Rp 26.7M' }
        ]
      },
      {
        title: 'EKUITAS',
        label: 'Modal Akhir',
        value: 'Rp 66.7M',
        color: '#ffffff',
        details: []
      },
      {
        title: 'ARUS KAS',
        label: 'Arus Kas Bersih',
        value: 'Rp 5.8M',
        color: '#ffffff',
        details: []
      }
    ]
  };

  const reports = data[period];

  return (
    <section id="laporan" className="page-content-section" style={{ padding: '100px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Heading Area */}
        <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#cca334', marginBottom: 12 }}>
              Laporan Transparansi
            </h2>
            <p style={{ fontSize: 19, color: '#ffffff', fontWeight: 600, letterSpacing: '0.2px', textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>
              Data kesehatan finansial koperasi yang diperbarui secara periodik.
            </p>
          </div>
          
          {/* Interactivive Toggle Buttons */}
          <div style={{ display: 'flex', background: 'rgba(4, 49, 33, 0.8)', border: '1.5px solid rgba(204, 163, 52, 0.4)', borderRadius: 12, padding: 4 }}>
            <button 
              onClick={() => setPeriod('bulanan')}
              style={{ 
                background: period === 'bulanan' ? '#cca334' : 'transparent', 
                color: period === 'bulanan' ? '#043121' : '#ffffff', 
                border: 'none', 
                padding: '10px 24px', 
                fontSize: 14, 
                fontWeight: period === 'bulanan' ? 800 : 600, 
                borderRadius: 8, 
                opacity: period === 'bulanan' ? 1 : 0.7, 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Bulanan
            </button>
            <button 
              onClick={() => setPeriod('tahunan')}
              style={{ 
                background: period === 'tahunan' ? '#cca334' : 'transparent', 
                color: period === 'tahunan' ? '#043121' : '#ffffff', 
                border: 'none', 
                padding: '10px 24px', 
                fontSize: 14, 
                fontWeight: period === 'tahunan' ? 800 : 600, 
                borderRadius: 8, 
                opacity: period === 'tahunan' ? 1 : 0.7, 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              TAHUNAN
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {reports.map((rep) => (
            <div key={rep.title} className="reveal laporan-card" style={{
              background: 'rgba(4, 49, 33, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 24,
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 250,
              justifyContent: 'space-between',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <div>
                {/* Header: Title & Icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                  <span style={{ color: '#cca334', fontSize: 16, fontWeight: 800, letterSpacing: '0.5px' }}>{rep.title}</span>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </div>

                {/* Value metrics */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{rep.label}</div>
                  <div style={{ fontSize: '2.3rem', fontWeight: 800, color: rep.color, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                    {rep.value}
                  </div>
                </div>
              </div>

              {/* Sub Metrics details */}
              {rep.details.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', borderTop: '1.5px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                  {rep.details.map(det => (
                    <div key={det.label} style={{ fontSize: 13 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{det.label}: </span>
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>{det.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

function AiSection() {
  return (
    <section id="ai-syariah" className="page-content-section" style={{ padding: '100px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="reveal" style={{ marginBottom: 60 }}>
          <SectionBadge text="AI TECHNOLOGY" />
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#043121', marginBottom: 24 }}>
            Validasi Akad Instan dengan RAG AI Engine
          </h2>
          <p style={{ fontSize: 19, color: '#4b5563', maxWidth: 750, margin: '0 auto', lineHeight: 1.8 }}>
            Mencegah kesalahan penentuan akad. AI kami memindai konteks fatwa DSN MUI
            dan merekomendasikan alur transaksi paling aman sesuai prinsip syariah.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }} className="reveal">
          {[
            { n: '1', t: 'Input Data', c: '📝' },
            { n: '2', t: 'Pencarian Konteks Fatwa', c: '🔍' },
            { n: '3', t: 'Analisis RAG AI', c: '🧠' },
            { n: '4', t: 'Rekomendasi Valid', c: '✅' }
          ].map((s, i) => (
            <React.Fragment key={s.t}>
              <div style={{ flex: '1', minWidth: 220, background: 'white', padding: '32px 24px', borderRadius: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #ecfdf5' }}>
                <div style={{ fontSize: 45, marginBottom: 20 }}>{s.c}</div>
                <div style={{ color: '#cca334', fontWeight: 900, fontSize: 14, marginBottom: 8 }}>TAHAP {s.n}</div>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: '#043121' }}>{s.t}</h4>
              </div>
              {i < 3 && <div className="ai-flow-arrow" style={{ alignSelf: 'center', fontSize: 24, color: '#cbd5e1' }}>➔</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="page-content-section" style={{ background: '#042f24', color: 'white', padding: '60px 24px', marginTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 20 }}>
          <LogoIcon size={56} iconSize={30} rounded={14} />
        </div>
        <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>IQ-RA <span style={{ color: '#cca334' }}>System</span></h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 800, margin: '0 auto 32px' }}>
          Keunggulan Syariah dalam Balutan Kecerdasan Teknologi Masa Depan
        </p>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 32, fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>
          © 2026 IQ-RA Corporation. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <GlobalSiteBackground />
      <Navbar />
      <HeroSection />
      <ProfilSection />
      <ProdukSection />
      <LaporanSection />
      <AiSection />
      <Footer />
    </>
  );
}

'use client';
import React from 'react';

export default function ProductsPanel() {
  const products = [
    {
      id: 'wadiah',
      category: 'Simpanan',
      name: 'Simpanan Wadiah Yad Dhamanah',
      icon: '💼',
      description: 'Simpanan amanah tanpa risiko. Bebas biaya administrasi bulanan dan dana dapat ditarik kapan saja. Cocok untuk kebutuhan transaksional harian Anda.',
      features: ['Bebas Biaya Admin', 'Tarik Tunai Kapan Saja', 'Sesuai Prinsip Syariah']
    },
    {
      id: 'mudharabah',
      category: 'Simpanan',
      name: 'Simpanan Mudharabah Mutlaqah',
      icon: '📈',
      description: 'Investasi syariah dengan sistem bagi hasil (nisbah) yang adil dan menguntungkan. Dana Anda dikelola untuk usaha-usaha produktif yang halal.',
      features: ['Bagi Hasil Kompetitif', 'Transparan & Halal', 'Investasi Produktif']
    },
    {
      id: 'haji',
      category: 'Simpanan Bertujuan',
      name: 'Simpanan Haji & Umrah',
      icon: '🕋',
      description: 'Perencanaan keuangan khusus untuk wujudkan niat suci beribadah ke Baitullah. Dilengkapi dengan fasilitas pendaftaran porsi Haji.',
      features: ['Prioritas Porsi Haji', 'Bebas Riba', 'Bisa Dicicil Fleksibel']
    },
    {
      id: 'pembiayaan-murabahah',
      category: 'Pembiayaan',
      name: 'Pembiayaan Murabahah',
      icon: '🛍️',
      description: 'Solusi kepemilikan barang (kendaraan, elektronik, rumah) dengan akad jual beli syariah. Margin tetap dan transparan hingga akhir tenor.',
      features: ['Margin Tetap (Fixed)', 'Angsuran Pasti', 'Tanpa Denda Keterlambatan']
    },
    {
      id: 'pembiayaan-ijarah',
      category: 'Pembiayaan',
      name: 'Pembiayaan Ijarah',
      icon: '🏠',
      description: 'Sewa manfaat atas aset produktif atau jasa (multijasa) untuk menunjang kebutuhan konsumtif maupun produktif dengan angsuran ujrah tetap.',
      features: ['Ujrah Tetap (Fixed)', 'Pilihan Tenor Fleksibel', 'Tanpa Jaminan Riba']
    },
    {
      id: 'pembiayaan-mudharabah',
      category: 'Pembiayaan',
      name: 'Pembiayaan Modal Kerja',
      icon: '🤝',
      description: 'Kemitraan usaha produktif menggunakan akad Mudharabah atau Musyarakah. Cocok untuk UMKM yang membutuhkan ekspansi bisnis.',
      features: ['Sistem Bagi Hasil', 'Pendampingan Usaha', 'Sesuai Siklus Bisnis']
    },
    {
      id: 'pembiayaan-qardhul-hasan',
      category: 'Pembiayaan',
      name: 'Pembiayaan Qardhul Hasan',
      icon: '🤲',
      description: 'Pembiayaan dana kebajikan tanpa adanya margin keuntungan tambahan. Pengembalian murni sebesar pokok pinjaman untuk membantu anggota.',
      features: ['Tanpa Bunga/Margin', 'Berbasis Kebajikan', 'Hanya Bayar Pokok']
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid var(--border-primary)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 20px 40px var(--shadow-color)',
        marginBottom: '24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--gold-intense)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
            KATALOG LAYANAN IQ-RA
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Produk & Layanan Unggulan Koperasi
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Temukan berbagai solusi keuangan syariah yang dirancang khusus untuk memenuhi kebutuhan transaksi, investasi, hingga pengembangan usaha Anda tanpa unsur riba.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {products.map(product => (
            <div key={product.id} style={{
              background: 'var(--bg-page)',
              border: '2px solid var(--border-primary)',
              borderRadius: '20px',
              padding: '24px',
              transition: 'all 0.3s ease',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'var(--gold-intense)';
              e.currentTarget.style.boxShadow = '0 15px 30px var(--shadow-color)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-primary)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'rgba(243, 198, 83, 0.15)', border: '1px solid var(--gold-intense)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px'
                }}>
                  {product.icon}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    {product.category}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                    {product.name}
                  </h3>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px 0', flexGrow: 1 }}>
                {product.description}
              </p>

              <div style={{ borderTop: '1px dashed var(--border-primary)', paddingTop: '16px' }}>
                {product.features.map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

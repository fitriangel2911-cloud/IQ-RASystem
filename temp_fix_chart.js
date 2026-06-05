const fs = require('fs');
const path = 'd:/IQ-RASystem/src/components/dashboard/DPSDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace chart map
const oldChart = `                {[
                  { name: 'Murabahah (Jual Beli)', pct: 62, val: 917600000, color: '--text-gold' },
                  { name: 'Mudharabah (Bagi Hasil)', pct: 20, val: 296000000, color: '--text-success' },
                  { name: 'Musyarakah (Kemitraan)', pct: 12, val: 177600000, color: '--text-info' },
                  { name: 'Ijarah Multijasa (Sewa Jasa)', pct: 6, val: 88800000, color: '--text-warning' }
                ].map(item => (`;

const newChart = `                {akadDistribution.length === 0 && <div style={{color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px 0'}}>Belum ada data distribusi akad.</div>}
                {akadDistribution.map(item => (`;

content = content.replace(oldChart, newChart);

// If the previous replace failed due to spaces, try regex:
if (!content.includes('akadDistribution.map')) {
  content = content.replace(/\{\[\s*\{\s*name:\s*'Murabahah[\s\S]*?\]\.map\(item => \(/g, newChart);
}

// Replace AI Alert Panel
const oldAlert = `              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Analisis pencocokan otomatis di latar belakang mendeteksi 1 pengajuan draf akad baru yang memerlukan penelaahan intensif oleh DPS sebelum disetujui.
              </p>

              <div style={{ background: 'var(--bg-dark-box)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 900 }}>
                  <span style={{ color: 'var(--text-danger)' }}>POTENSI ANOMALI: RIBARISIKO</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Status: PENDING</span>
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>Murabahah Modal Kerja - PT Berkah Bersama</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
                  Klausul denda keterlambatan disinyalir tidak dialokasikan penuh untuk dana sosial (Ta\\'zir), berpotensi melanggar Fatwa DSN No 17. Segera lakukan audit manual.
                </div>
              </div>`;

const newAlert = `              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Analisis pencocokan otomatis di latar belakang memantau draf akad dan transaksi secara real-time.
              </p>
              
              {contracts.filter(c => c.status === 'pending').length > 0 ? (
                <div style={{ background: 'var(--bg-dark-box)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 900 }}>
                    <span style={{ color: 'var(--text-warning)' }}>PERLU TINDAKAN (AUDIT MANUAL)</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Status: MENUNGGU</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>
                    Terdapat {contracts.filter(c => c.status === 'pending').length} akad pembiayaan baru.
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
                    Sistem mendeteksi adanya pengajuan akad baru yang membutuhkan penelaahan intensif oleh DPS sebelum disetujui untuk diaktifkan. Silakan periksa di tab Audit Pembiayaan.
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-subtle-success)', border: '1px solid var(--border-success)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-success)', fontWeight: 900, fontSize: '14px' }}>
                    ✅ TIDAK ADA ANOMALI TERDETEKSI
                  </div>
                  <div style={{ color: 'var(--text-success)', fontSize: '13px', lineHeight: '1.5', opacity: 0.9 }}>
                    Semua transaksi dan pembiayaan saat ini sesuai dengan parameter syariah. Belum ada draf kontrak baru yang memerlukan audit mendesak.
                  </div>
                </div>
              )}`;

content = content.replace(oldAlert, newAlert);
if (!content.includes('TIDAK ADA ANOMALI TERDETEKSI')) {
  content = content.replace(/<p style=\{\{\s*color:\s*'var\(--text-secondary\)'[\s\S]*?Segera lakukan audit manual\.[\s\S]*?<\/div>\s*<\/div>/g, newAlert);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Script ran successfully');

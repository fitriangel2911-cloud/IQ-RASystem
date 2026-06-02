const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Restore the icons
c = c.replace(/label="Ringkasan Eksekutif" \/>/g, 'icon="📊" label="Ringkasan Eksekutif" />');
c = c.replace(/label="Pencairan" \/>/g, 'icon="💸" label="Pencairan" />');
c = c.replace(/label="Setoran" \/>/g, 'icon="💰" label="Setoran" />');
c = c.replace(/label="Pembayaran" \/>/g, 'icon="💳" label="Pembayaran" />');
c = c.replace(/label="Mutasi" \/>/g, 'icon="🔄" label="Mutasi" />');
c = c.replace(/label="Simulasi" \/>/g, 'icon="📈" label="Simulasi" />');

c = c.replace(/label="Kas Keluar" \/>/g, 'icon="💸" label="Kas Keluar" />');
c = c.replace(/label="Kas Masuk" \/>/g, 'icon="💰" label="Kas Masuk" />');
c = c.replace(/label="Jurnal Umum" \/>/g, 'icon="📋" label="Jurnal Umum" />');
c = c.replace(/label="Buku Besar" \/>/g, 'icon="📒" label="Buku Besar" />');
c = c.replace(/label="Laba\/Rugi" \/>/g, 'icon="📈" label="Laba/Rugi" />');
c = c.replace(/label="Neraca" \/>/g, 'icon="⚖️" label="Neraca" />');

c = c.replace(/label="Data Anggota" \/>/g, 'icon="👥" label="Data Anggota" />');
c = c.replace(/label="Pengajuan Baru" \/>/g, 'icon="📄" label="Pengajuan Baru" />');
c = c.replace(/label="Status Kredit" \/>/g, 'icon="📊" label="Status Kredit" />');

c = c.replace(/label="Buka\/Tutup Shift" \/>/g, 'icon="⏳" label="Buka/Tutup Shift" />');
c = c.replace(/label="Audit Syariah \(DPS\)" \/>/g, 'icon="🕌" label="Audit Syariah (DPS)" />');
c = c.replace(/label="Knowledge Base \(RAG\)" \/>/g, 'icon="🤖" label="Knowledge Base (RAG)" />');

c = c.replace(/label="Log Audit Sistem" \/>/g, 'icon="📋" label="Log Audit Sistem" />');
c = c.replace(/label="Manajemen COA" \/>/g, 'icon="📒" label="Manajemen COA" />');
c = c.replace(/label="Penugasan Staf" \/>/g, 'icon="✅" label="Penugasan Staf" />');
c = c.replace(/label="Diagnostik & Latensi" \/>/g, 'icon="🩺" label="Diagnostik & Latensi" />');
c = c.replace(/label="Pencadangan Data" \/>/g, 'icon="📦" label="Pencadangan Data" />');

c = c.replace(/label="Manajemen User" \/>/g, 'icon="👥" label="Manajemen User" />');
c = c.replace(/label="Aturan Akses \(RBAC\)" \/>/g, 'icon="🛡️" label="Aturan Akses (RBAC)" />');
c = c.replace(/label="Konfigurasi Sistem" \/>/g, 'icon="🛠️" label="Konfigurasi Sistem" />');

// Clean up duplicate icon props if any
c = c.replace(/icon="" icon=/g, 'icon=');
c = c.replace(/icon="" /g, '');

// Restore animations and styling for DashboardMenuButton
c = c.replace(/transform: isHovered \? 'scale\(1\.02\)' : 'scale\(1\)',/g, "transform: isHovered ? 'scale(1.15)' : 'scale(1)',");
c = c.replace(/transform: 'none',/g, "transform: !active && isHovered ? 'translateX(6px)' : 'translateX(0)',");

// Fix the missing icon span block
c = c.replace(/<span style=\{\{\s*opacity: active \? 1 : 0\.9\s*\}\}>\{label\}<\/span>/g, `<span style={{ 
        fontSize: isSpecial ? '24px' : '22px', 
        opacity: active ? 1 : 0.8,
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.2s ease'
      }}>{icon}</span>
      <span style={{ opacity: active ? 1 : 0.9 }}>{label}</span>`);

// Restore the main DashboardMenuButton definition spacing that was previously scaled down
c = c.replace(/padding: isSpecial \? '12px 16px' : '10px 14px',/g, "padding: isSpecial ? '18px 20px' : '15px 18px',");
c = c.replace(/fontSize: isSpecial \? '15px' : '14px',/g, "fontSize: isSpecial ? '18px' : '16px',");

fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Icons and animations restored.');

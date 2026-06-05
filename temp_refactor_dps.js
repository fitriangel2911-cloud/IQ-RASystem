const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/DPSDashboard.tsx', 'utf8');

// Add imports
if (!content.includes("import Modal from './Modal'")) {
  content = content.replace(/(import .*;\n)+/, match => match + "import Modal from './Modal';\nimport Toast from './Toast';\n\n");
}

// Add state
const stateCode = `
  const [toastInfo, setToastInfo] = useState<{ message: string, type: 'success'|'error'|'warning'|'info', isVisible: boolean }>({ message: '', type: 'info', isVisible: false });
  const showToast = (message: string, type: 'success'|'error'|'warning'|'info' = 'success') => {
    setToastInfo({ message, type, isVisible: true });
  };

  const [confirmInfo, setConfirmInfo] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
`;

if (!content.includes('const [toastInfo, setToastInfo] = useState')) {
  content = content.replace(/export default function DPSDashboard[^{]+\{\n/, match => match + stateCode);
}

// Replace alerts
content = content.replace(/alert\('Gagal menyimpan hasil audit ke database: ' \+ err.message\);/g, "showToast('Gagal menyimpan hasil audit: ' + err.message, 'error');");
content = content.replace(/alert\('Gagal memperbarui status audit: ' \+ err.message\);/g, "showToast('Gagal memperbarui status audit: ' + err.message, 'error');");
content = content.replace(/alert\('Nominal pembersihan melebihi saldo dana non-halal yang tersedia.'\);/g, "showToast('Nominal pembersihan melebihi saldo dana non-halal yang tersedia.', 'error');");
content = content.replace(/alert\(`Pembersihan dana sebesar \$\{formatIDR.format\(purifyAmount\)\} ke \$\{purifyDestination\} berhasil disimpan ke database dan jurnal kas!`\);/g, "showToast(`Pembersihan dana sebesar ${formatIDR.format(purifyAmount)} berhasil dieksekusi!`, 'success');");
content = content.replace(/alert\('Gagal merekam jurnal pembersihan ke database: ' \+ err.message\);/g, "showToast('Gagal mengeksekusi pembersihan: ' + err.message, 'error');");
content = content.replace(/alert\(`Keputusan Produk '\$\{selectedProduct\.name\}' berhasil disimpan dan diterbitkan!`\);/g, "showToast(`Keputusan Produk '${selectedProduct.name}' berhasil disimpan dan diterbitkan!`, 'success');");
content = content.replace(/alert\('Laporan Pengawasan Syariah PDF berhasil digenerate dan diunduh!'\);/g, "showToast('Laporan Pengawasan Syariah berhasil diunduh!', 'success');");
content = content.replace(/alert\('Gagal mencetak PDF: ' \+ e.message\);/g, "showToast('Gagal mencetak PDF: ' + e.message, 'error');");

// Replace window.confirm for Purification
const confirmRegex = /if \(!window.confirm\(`Anda yakin akan mengeksekusi pembersihan dana sebesar \$\{formatIDR.format\(purifyAmount\)\} ke akun \$\{purifyDestination\}\?`\)\) \{[\s\S]*?return;[\s\S]*?\}/;
// Wait, I need to wrap the contents of handleExecutePurification in the modal confirm!
// It's better to just use manual replacement for handleExecutePurification.

fs.writeFileSync('src/components/dashboard/DPSDashboard.tsx', content, 'utf8');
console.log('DPSDashboard basic alerts replaced.');

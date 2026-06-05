const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/DPSDashboard.tsx', 'utf8');

// 1. Refactor handlePurificationSubmit
content = content.replace(
  /const handlePurificationSubmit = async \(e: React\.FormEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*if \(purifyAmount <= 0\) return;\n\n\s*if \(purifyAmount > nonHalalBalance\) \{\n\s*showToast\('Nominal pembersihan melebihi saldo dana non-halal yang tersedia.', 'error'\);\n\s*return;\n\s*\}/,
  `const handlePurificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purifyAmount <= 0) return;
    if (purifyAmount > nonHalalBalance) {
      showToast('Nominal pembersihan melebihi saldo dana non-halal yang tersedia.', 'error');
      return;
    }
    
    setConfirmInfo({
      isOpen: true,
      title: 'Konfirmasi Eksekusi Pembersihan',
      message: \`Anda yakin akan mengeksekusi pembersihan dana sebesar \${formatIDR.format(purifyAmount)} ke akun \${purifyDestination}?\`,
      onConfirm: async () => {`
);

// close the block for Purification
content = content.replace(
  /showToast\(`Pembersihan dana sebesar \$\{formatIDR\.format\(purifyAmount\)\} berhasil dieksekusi!`, 'success'\);\n\s*\} catch \(err: any\) \{\n\s*console\.error\(err\);\n\s*showToast\('Gagal mengeksekusi pembersihan: ' \+ err\.message, 'error'\);\n\s*\} finally \{\n\s*setLoadingContracts\(false\);\n\s*\}\n\s*\};/,
  `showToast(\`Pembersihan dana sebesar \${formatIDR.format(purifyAmount)} berhasil dieksekusi!\`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mengeksekusi pembersihan: ' + err.message, 'error');
    } finally {
      setLoadingContracts(false);
    }
  } // end onConfirm
  }); // end setConfirmInfo
  };`
);

// 2. Refactor handleSaveAuditOpinion
content = content.replace(
  /const handleSaveAuditOpinion = async \(\) => \{\n\s*if \(\!selectedAuditContract \|\| \!auditDecision\) return;/,
  `const handleSaveAuditOpinion = async () => {
    if (!selectedAuditContract || !auditDecision) return;
    
    setConfirmInfo({
      isOpen: true,
      title: 'Konfirmasi Opini Audit',
      message: \`Anda yakin akan menyimpan opini '\${auditDecision}' untuk akad \${selectedAuditContract.users?.full_name}?\`,
      onConfirm: async () => {`
);

// close block for Audit Opinion
content = content.replace(
  /showToast\('Opini audit berhasil disimpan!', 'success'\);\n\s*\} catch \(err: any\) \{\n\s*console\.error\(err\);\n\s*showToast\('Gagal memperbarui status audit: ' \+ err\.message, 'error'\);\n\s*\} finally \{\n\s*setLoadingContracts\(false\);\n\s*\}\n\s*\};/,
  `showToast('Opini audit berhasil disimpan!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memperbarui status audit: ' + err.message, 'error');
    } finally {
      setLoadingContracts(false);
    }
  }
  });
  };`
);

// 3. Refactor handleSaveProductDecision
content = content.replace(
  /const handleSaveProductDecision = \(\) => \{\n\s*if \(\!selectedProduct\) return;/,
  `const handleSaveProductDecision = () => {
    if (!selectedProduct) return;
    
    setConfirmInfo({
      isOpen: true,
      title: 'Konfirmasi Keputusan Produk',
      message: \`Anda yakin ingin merilis keputusan Fatwa untuk produk \${selectedProduct.name}?\`,
      onConfirm: () => {`
);

// close block for Product Decision
content = content.replace(
  /showToast\(`Keputusan Produk '\$\{selectedProduct\.name\}' berhasil disimpan dan diterbitkan!`, 'success'\);\n\s*\}\n\s*\};/,
  `showToast(\`Keputusan Produk '\${selectedProduct.name}' berhasil disimpan dan diterbitkan!\`, 'success');
    }
  });
  };`
);

fs.writeFileSync('src/components/dashboard/DPSDashboard.tsx', content, 'utf8');
console.log('DPSDashboard modal refactoring complete.');

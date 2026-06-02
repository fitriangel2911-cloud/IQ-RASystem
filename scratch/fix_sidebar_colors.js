const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx');
let txt = fs.readFileSync(filePath, 'utf-8');

// 1. DashboardMenuButton Background & Color
txt = txt.replace(
  /background: active \? 'var\(--gold-intense\)' : 'transparent',/g, 
  "background: active ? 'var(--sidebar-active-bg)' : 'transparent',"
);
txt = txt.replace(
  /color: active \? '#02130e' : 'var\(--text-secondary\)',/g, 
  "color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',"
);
txt = txt.replace(
  /boxShadow: active \? '0 4px 15px rgba\(243, 198, 83, 0\.3\)' : 'none'/g,
  "boxShadow: active ? '0 4px 15px var(--shadow-color)' : 'none'"
);

// 2. Sidebar Category Headers (CORE BANKING, etc.)
txt = txt.replace(
  /color: '[^']+', fontWeight: 800, textTransform: 'uppercase'/g, 
  "color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase'"
);

fs.writeFileSync(filePath, txt, 'utf-8');
console.log("Variabel Sidebar Berhasil Diaplikasikan!");

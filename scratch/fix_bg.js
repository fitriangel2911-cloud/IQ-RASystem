const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove DashboardSiteBackground function
const bgRegex = /\/\/ Dedicated, immersive Dark Background specifically optimized for the Dashboard to maximize contrast\s*function DashboardSiteBackground\(\) \{\s*return \(\s*<div style=\{\{\s*position: 'fixed',\s*top: 0,\s*left: 0,\s*right: 0,\s*bottom: 0,\s*zIndex: 0,\s*background: 'linear-gradient\(135deg, #02130e 0%, var\(--bg-card\) 100%\)',\s*overflow: 'hidden'\s*\}\} aria-hidden="true">\s*\{\/\* Geometric pattern overlay with extreme low opacity to ensure text remains 100% readable \*\/\}\s*<div className="site-bg-pattern" style=\{\{ opacity: 0\.04 \}\} \/>\s*<\/div>\s*\);\s*\}/;

content = content.replace(bgRegex, '');

// 2. Change main wrapper background to transparent
content = content.replace(
  "background: 'var(--bg-card)', // Solid Darkest Emerald Canvas",
  "background: 'transparent', // Animated Pattern Layer Support"
);

// 3. Remove the tag
content = content.replace(/\s*<DashboardSiteBackground \/>/g, '');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Berhasil memulihkan animasi latar belakang.");

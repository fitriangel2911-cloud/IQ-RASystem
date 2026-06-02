const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Container Backgrounds & Gradients
content = content.replace(/#042a1d|#032b1c|#043625|#010d09/g, 'var(--bg-card)');
// Some explicit backgrounds using #02130e
content = content.replace(/background: '#02130e'/g, "background: 'var(--bg-card)'");
content = content.replace(/backgroundColor: '#02130e'/g, "backgroundColor: 'var(--bg-card)'");
content = content.replace(/background: '#010d09'/g, "background: 'var(--bg-card)'");

// Metric Card Colors
content = content.replace(/'#60a5fa'/g, "'var(--text-info)'");
content = content.replace(/#60a5fa/g, "var(--text-info)");

content = content.replace(/'#a78bfa'/g, "'var(--text-warning)'");
content = content.replace(/#a78bfa/g, "var(--text-warning)");

content = content.replace(/'#facc15'/g, "'var(--text-warning)'");
content = content.replace(/#facc15/g, "var(--text-warning)");

content = content.replace(/'#059669'/g, "'var(--text-success)'");
content = content.replace(/#059669/g, "var(--text-success)");

// Box Shadows that cause terrible contrast in light mode
content = content.replace(/rgba\(0,0,0,0\.3\)/g, 'var(--shadow-color)');
content = content.replace(/rgba\(0,0,0,0\.4\)/g, 'var(--shadow-color)');
content = content.replace(/rgba\(0,0,0,0\.2\)/g, 'var(--shadow-color)');
content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.8\)/g, 'var(--shadow-color)');
content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.9\)/g, 'var(--shadow-color)');

// White Opacities
content = content.replace(/rgba\(255,255,255,0\.7\)/g, 'var(--text-secondary)');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.7\)/g, 'var(--text-secondary)');

content = content.replace(/rgba\(255,255,255,0\.8\)/g, 'var(--text-secondary)');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.8\)/g, 'var(--text-secondary)');

content = content.replace(/rgba\(255,255,255,0\.03\)/g, 'var(--bg-dark-box)');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.03\)/g, 'var(--bg-dark-box)');

content = content.replace(/rgba\(255,255,255,0\.05\)/g, 'var(--bg-dark-box)');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'var(--bg-dark-box)');

content = content.replace(/rgba\(255,255,255,0\.01\)/g, 'transparent');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.01\)/g, 'transparent');

content = content.replace(/rgba\(255,255,255,0\.15\)/g, 'var(--border-primary)');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.15\)/g, 'var(--border-primary)');

content = content.replace(/rgba\(255,255,255,0\.3\)/g, 'var(--border-primary)');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.3\)/g, 'var(--border-primary)');

content = content.replace(/rgba\(255,255,255,0\.08\)/g, 'var(--bg-track)');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'var(--bg-track)');

content = content.replace(/rgba\(255,255,255,0\.02\)/g, 'var(--bg-dark-box)');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.02\)/g, 'var(--bg-dark-box)');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully ran Sync Theme Phase 2.");

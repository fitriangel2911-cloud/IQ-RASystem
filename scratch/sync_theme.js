const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Theme Effect Injection
const effectCode = `
  useEffect(() => {
    if (!isDarkMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isDarkMode]);
`;

if (!content.includes("classList.add('light-mode')")) {
  content = content.replace(
    'const [isDarkMode, setIsDarkMode] = useState(true);',
    'const [isDarkMode, setIsDarkMode] = useState(true);\n' + effectCode
  );
}

// 2. Safe bulk replacement for colors that adapt to theme
// Note: Only replacing quoted strings inside style objects to avoid breaking logic.

// Dark Green/Black Containers -> Card Background
content = content.replace(/'#032419'/g, "'var(--bg-card)'");
content = content.replace(/'#021c13'/g, "'var(--bg-card)'");
content = content.replace(/'#022b1c'/g, "'var(--bg-card)'");

// Sidebar Gradient
content = content.replace(/'linear-gradient\(180deg, #032419 0%, #021c13 100%\)'/g, "'var(--bg-sidebar)'");

// Text Colors
content = content.replace(/'#ffffff'/g, "'var(--text-primary)'");
content = content.replace(/'#fff'/g, "'var(--text-primary)'");

// Golds
content = content.replace(/'#cca334'/g, "'var(--gold-bright)'");
content = content.replace(/'#f3c653'/g, "'var(--gold-intense)'");
content = content.replace(/'#fce08a'/g, "'var(--gold-light)'");

// Success / Emeralds
content = content.replace(/'#34d399'/g, "'var(--text-success)'");
content = content.replace(/'#10b981'/g, "'var(--text-success)'");

// Dangers
content = content.replace(/'#ef4444'/g, "'var(--text-danger)'");
content = content.replace(/'#fca5a5'/g, "'var(--border-danger)'");

// White transparencies (secondary text)
content = content.replace(/'rgba\(255, 255, 255, 0\.6\)'/g, "'var(--text-secondary)'");
content = content.replace(/'rgba\(255,255,255,0\.6\)'/g, "'var(--text-secondary)'");
content = content.replace(/'rgba\(255, 255, 255, 0\.5\)'/g, "'var(--text-secondary)'");
content = content.replace(/'rgba\(255,255,255,0\.5\)'/g, "'var(--text-secondary)'");
content = content.replace(/'rgba\(255, 255, 255, 0\.4\)'/g, "'var(--text-secondary)'");
content = content.replace(/'rgba\(255,255,255,0\.4\)'/g, "'var(--text-secondary)'");

// White transparencies (borders)
content = content.replace(/'rgba\(255, 255, 255, 0\.2\)'/g, "'var(--border-primary)'");
content = content.replace(/'rgba\(255,255,255,0\.2\)'/g, "'var(--border-primary)'");
content = content.replace(/'rgba\(255, 255, 255, 0\.1\)'/g, "'var(--border-primary)'");
content = content.replace(/'rgba\(255,255,255,0\.1\)'/g, "'var(--border-primary)'");

// White transparencies (boxes/badges)
content = content.replace(/'rgba\(255, 255, 255, 0\.06\)'/g, "'var(--bg-dark-box)'");
content = content.replace(/'rgba\(255,255,255,0\.06\)'/g, "'var(--bg-dark-box)'");
content = content.replace(/'rgba\(255, 255, 255, 0\.05\)'/g, "'var(--bg-badge)'");
content = content.replace(/'rgba\(255,255,255,0\.05\)'/g, "'var(--bg-badge)'");

// Dark transparencies (shadows)
content = content.replace(/'0 4px 15px rgba\(0,0,0,0\.5\)'/g, "'0 4px 15px var(--shadow-color)'");
content = content.replace(/'8px 0 25px rgba\(0,0,0,0\.5\)'/g, "'8px 0 25px var(--shadow-color)'");
content = content.replace(/'0 15px 35px rgba\(0,0,0,0\.5\)'/g, "'0 15px 35px var(--shadow-color)'");

// Gold borders
content = content.replace(/'rgba\(243, 198, 83, 0\.2\)'/g, "'var(--border-warning)'");
content = content.replace(/'rgba\(243, 198, 83, 0\.3\)'/g, "'var(--border-warning)'");

// Dynamic ternaries that didn't use quotes wrapping the whole string
content = content.replace(/\? '#34d399' : '#f3c653'/g, "? 'var(--text-success)' : 'var(--gold-intense)'");
content = content.replace(/\? '#f3c653' : 'rgba\(255,255,255,0\.8\)'/g, "? 'var(--gold-intense)' : 'var(--text-secondary)'");
content = content.replace(/\? '#02130e' : 'rgba\(255,255,255,0\.8\)'/g, "? '#02130e' : 'var(--text-secondary)'");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully replaced hardcoded colors with CSS variables.");

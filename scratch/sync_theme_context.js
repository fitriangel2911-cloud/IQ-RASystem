const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add Import ThemeContext
if (!content.includes("import { useTheme }")) {
  content = content.replace(
    /import React, \{ useEffect, useState \} from 'react';/,
    "import React, { useEffect, useState } from 'react';\nimport { useTheme } from '@/context/ThemeContext';"
  );
}

// 2. Replace isDarkMode state with useTheme
content = content.replace(
  /const \[isDarkMode, setIsDarkMode\] = useState\(true\);/,
  "const { theme, toggleTheme } = useTheme();"
);

// 3. Remove local useEffect for light-mode
const effectRegex = /\s*useEffect\(\(\) => \{\s*if \(\!isDarkMode\) \{\s*document\.documentElement\.classList\.add\('light-mode'\);\s*\} else \{\s*document\.documentElement\.classList\.remove\('light-mode'\);\s*\}\s*\}, \[isDarkMode\]\);/g;
content = content.replace(effectRegex, '');

// 4. Update the toggle button logic
content = content.replace(/onClick=\{\(\) => setIsDarkMode\(\!isDarkMode\)\}/g, "onClick={toggleTheme}");
content = content.replace(/\{isDarkMode \? '🌙' : '☀️'\}/g, "{theme === 'dark' ? '🌙' : '☀️'}");

// 5. Apply gradient-border-card to Metric Cards in Overview Tab
content = content.replace(
  /<div style=\{\{ background: 'var\(--bg-card\)', border: '2px solid var\(--gold-bright\)', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px var\(--shadow-color\)' \}\}>/g,
  '<div className="gradient-border-card" style={{ padding: "32px" }}>'
);
content = content.replace(
  /<div style=\{\{ background: 'var\(--bg-card\)', border: '2px solid var\(--text-info\)', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px var\(--shadow-color\)' \}\}>/g,
  '<div className="gradient-border-card" style={{ padding: "32px" }}>'
);
content = content.replace(
  /<div style=\{\{ background: 'var\(--bg-card\)', border: '2px solid var\(--text-success\)', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px var\(--shadow-color\)' \}\}>/g,
  '<div className="gradient-border-card" style={{ padding: "32px" }}>'
);

// 6. Ensure the global animated background does not have issues if there are other hardcoded dark backgrounds
// Let's replace the last remaining 'isDarkMode' variables if any
content = content.replace(/!isDarkMode/g, "theme === 'light'");
content = content.replace(/isDarkMode/g, "theme === 'dark'");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Integrasi ThemeContext dan Aplikasi Gradient Border Berhasil.");

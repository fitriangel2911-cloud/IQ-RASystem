const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

c = c.replace(/zIndex: 110\s*\}\}\s*>\s*<\/button>/g, 'zIndex: 110\n              }}\n            >\n              ✕\n            </button>');

// Remove empty icon spans so gap doesn't look weird
c = c.replace(/<span style=\{\{\s*fontSize: isSpecial \? '20px' : '18px',\s*opacity: active \? 1 : 0\.8,\s*transform: isHovered \? 'scale\(1\.1\)' : 'scale\(1\)',\s*transition: 'transform 0\.2s ease'\s*\}\}>\{\s*icon\s*\}<\/span>/g, '');
// Since we removed the icon span, we also don't need gap: '10px' in the button if there's only one span, but it's fine.

fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Close button restored and icon spans cleaned.');

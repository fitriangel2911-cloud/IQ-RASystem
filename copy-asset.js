/**
 * Copies generated pattern image to Next.js public folder using Node.js fs module
 */
const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\fitri angelina\\.gemini\\antigravity\\brain\\9b80942c-ba6d-4704-ba15-37a6c64573ab\\islamic_pattern_bg_v2_1778591947248.png';
const dest = path.join(__dirname, 'public', 'pattern-bg.png');

try {
  fs.copyFileSync(src, dest);
  console.log('SUCCESS: Image copied to public/pattern-bg.png');
} catch (err) {
  console.error('Error copying file:', err.message);
}

const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const hexMatches = content.match(/#[0-9a-fA-F]{3,6}/g) || [];
const rgbaMatches = content.match(/rgba\([^)]+\)/g) || [];

console.log("Hex remaining:\n" + Array.from(new Set(hexMatches)).join(', '));
console.log("\nRGBA remaining:\n" + Array.from(new Set(rgbaMatches)).join('\n'));

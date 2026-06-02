const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const regex = /activeTab === '([^']+)'/g;
let match;
const tabs = new Set();
while ((match = regex.exec(content)) !== null) {
  tabs.add(match[1]);
}

console.log("Daftar Tab yang Terdeteksi dalam File:");
tabs.forEach(tab => {
  // Check if there's a component or just an empty div/coming soon
  const blockStart = content.indexOf(`activeTab === '${tab}' && (`);
  if (blockStart === -1) {
    console.log(`- ${tab}: NO RENDER BLOCK FOUND`);
  } else {
    const snippet = content.substring(blockStart, blockStart + 300);
    console.log(`- ${tab}: Render block starts with: ${snippet.replace(/\n/g, ' ').substring(0, 80)}...`);
  }
});

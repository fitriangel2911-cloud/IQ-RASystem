const fs = require('fs');
const content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

['audit_logs', 'coa', 'tasks', 'diagnostics', 'overview', 'cs', 'teller', 'ao', 'accounting', 'manager', 'dps', 'ai_knowledge', 'users', 'rules', 'backup', 'members'].forEach(tab => {
  const blockStart = content.indexOf(`activeTab === '${tab}' && (`);
  if (blockStart !== -1) {
    const endSnippet = content.indexOf(`activeTab ===`, blockStart + 50);
    const snippet = content.substring(blockStart, endSnippet !== -1 ? endSnippet : blockStart + 1000);
    // Extract component tags like <TellerTerminal ... />
    const components = snippet.match(/<[A-Z][a-zA-Z0-9_]+/g);
    console.log(`Tab '${tab}' mounts:`, components ? [...new Set(components)].join(', ') : 'Native HTML only');
  }
});

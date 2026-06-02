// scripts/scan_supabase_tables.js
// This script scans the src/ directory for Supabase table usages (".from('TABLE')")
// and generates a JSON map of table -> [file:line] pairs.

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const OUTPUT_FILE = path.resolve(__dirname, '..', 'supabase', 'tables_map.json');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js')) {
      results.push(full);
    }
  });
  return results;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const matches = [];
  lines.forEach((line, idx) => {
    const regex = /\.from\(['"]([a-zA-Z0-9_]+)['"]\)/g;
    let m;
    while ((m = regex.exec(line)) !== null) {
      matches.push({ table: m[1], location: `${filePath}:${idx + 1}` });
    }
  });
  return matches;
}

function main() {
  const files = walk(SRC_DIR);
  const map = {};
  files.forEach((file) => {
    const matches = scanFile(file);
    matches.forEach(({ table, location }) => {
      if (!map[table]) map[table] = [];
      map[table].push(location);
    });
  });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(map, null, 2), 'utf8');
  console.log('Supabase table map written to', OUTPUT_FILE);
}

main();

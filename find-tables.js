const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(getFiles(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = getFiles('./src');
const tables = new Set();
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /\.from\(['"]([a-zA-Z0-9_]+)['"]\)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    tables.add(m[1]);
  }
});

console.log(Array.from(tables).join('\n'));

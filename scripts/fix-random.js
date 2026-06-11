const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Replace Math.random() with (crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296)
  const newContent = content.replace(/Math\.random\(\)/g, '(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296)');
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      replaceInFile(file);
    }
  });
  return results;
}

walk('src');
console.log('Math.random() replaced globally.');

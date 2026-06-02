const fs = require('fs');
const log = fs.readFileSync('C:/Users/fitri angelina/.gemini/antigravity/brain/95e7423a-27ba-46b5-b655-99244c57a2d0/.system_generated/logs/overview.txt', 'utf8');

const regex = /"name":"multi_replace_file_content","args":(\{.*?\})/g;
let match;
let extractedChunks = [];

while ((match = regex.exec(log)) !== null) {
  try {
    const argsJson = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    // We need to parse this properly, but since the log is double stringified JSON:
    // It's easier to just find "ReplacementContent":"...","StartLine"
    
  } catch (e) {
    console.log(e.message);
  }
}

// Alternative approach: Read the log line by line. When we see "ReplacementContent":", we capture until we hit ","StartLine".
const lines = log.split('\n');
let insideReplacement = false;
let currentReplacement = [];
const allReplacements = [];

for (const line of lines) {
  if (line.includes('"name":"multi_replace_file_content"') && line.includes('page.tsx')) {
    // Found a replace file content call targeting page.tsx
    const chunksStrMatch = line.match(/"ReplacementChunks":"(.*?)","TargetFile"/);
    if (chunksStrMatch) {
      try {
        let chunksStr = chunksStrMatch[1];
        // unescape json string
        chunksStr = chunksStr.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        // It's still a bit messy. 
        console.log('Found chunks targeting page.tsx');
      } catch (e) {}
    }
  }
}

// Since parsing JSON from logs is extremely brittle due to escaping, 
// let's look for known strings like "Menambahkan akun COA baru" or "Manajemen Chart of Accounts"
let idx = log.indexOf('Manajemen Chart of Accounts');
if (idx !== -1) {
  console.log('Found COA phrase in log!');
}

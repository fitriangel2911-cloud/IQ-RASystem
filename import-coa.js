const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Memuat .env.local secara dinamis untuk mengambil Supabase Key
try {
  const envPath = path.resolve(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split(/\r?\n/).forEach(line => {
      // Abaikan baris komentar atau baris kosong
      if (line.trim().startsWith('#') || !line.includes('=')) return;
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn('Gagal memuat file .env.local:', e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxtgmjsxpfnivdhfnnot.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment atau .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const lines = fs.readFileSync('coa.csv', 'utf-8').split('\n').filter(l => l.trim().length > 0);
const rows = lines.slice(1);

const seenCodes = new Set();
const payload = [];

for (const row of rows) {
  let [code, ...nameParts] = row.split(',');
  const name = nameParts.join(',').trim();
  let c = code.trim();
  
  if (seenCodes.has(c)) {
    console.warn(`Duplicate code found: ${c} for ${name}. Attempting to resolve...`);
    let originalC = c;
    let counter = 1;
    // Simple resolution: increment the last digit if possible
    let base = parseInt(c);
    while (seenCodes.has(base.toString().padStart(c.length, '0'))) {
      base++;
    }
    c = base.toString().padStart(c.length, '0');
    console.warn(`Resolved ${originalC} to ${c}`);
  }
  
  seenCodes.add(c);

  let category = 'Lainnya';
  if (c.startsWith('1') && !c.startsWith('19')) category = 'Aset';
  if (c.startsWith('19')) category = 'Kontra-Aset';
  if (c.startsWith('2')) category = 'Liabilitas';
  if (c.startsWith('3')) category = 'Dana Syirkah';
  if (c.startsWith('4')) category = 'Ekuitas';
  if (c.startsWith('5')) category = 'Pendapatan';
  if (c.startsWith('6')) category = 'Bagi Hasil';
  if (c.startsWith('7')) category = 'Beban';

  payload.push({ code: c, name, category });
}

async function importCoa() {
  console.log(`Starting import of ${payload.length} COA accounts...`);
  
  // Upsert all accounts
  const { data, error } = await supabase
    .from('coa_accounts')
    .upsert(payload, { onConflict: 'code' });
    
  if (error) {
    console.error('Error importing:', error);
  } else {
    console.log('Import successful!');
  }
}

importCoa();

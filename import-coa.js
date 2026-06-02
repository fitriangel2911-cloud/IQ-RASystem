const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lxtgmjsxpfnivdhfnnot.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dGdtanN4cGZuaXZkaGZubm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU2Njk1MCwiZXhwIjoyMDk0MTQyOTUwfQ.-2Bt8fio2hUf0QPyWq9OjZ7QjUmN7y-iaWXuBjZ__g8';

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

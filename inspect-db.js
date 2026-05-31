const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local not found");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error("Error: URL or Anon key missing in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDb() {
  console.log("=== INSPECTING PROSPECTS ===");
  const { data: prospects, error: pErr } = await supabase.from('prospects').select('*').limit(3);
  if (pErr) console.error("Prospects Error:", pErr);
  else console.log("Prospects samples:", JSON.stringify(prospects, null, 2));

  console.log("\n=== INSPECTING FINANCING CONTRACTS ===");
  const { data: contracts, error: cErr } = await supabase.from('financing_contracts').select('*').limit(3);
  if (cErr) console.error("Contracts Error:", cErr);
  else console.log("Contracts samples:", JSON.stringify(contracts, null, 2));
}

inspectDb();

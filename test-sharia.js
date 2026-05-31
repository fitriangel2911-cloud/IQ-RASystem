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

async function inspectShariaKnowledge() {
  console.log("Connecting to Supabase to analyze sharia_knowledge table...");
  
  // 1. Get total count
  const { count: totalCount, error: countErr } = await supabase
    .from('sharia_knowledge')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error("Error getting total count:", countErr);
    return;
  }
  console.log(`Total records in sharia_knowledge: ${totalCount}`);

  // 2. Get null embedding count
  const { count: nullCount, error: nullErr } = await supabase
    .from('sharia_knowledge')
    .select('*', { count: 'exact', head: true })
    .is('embedding', null);

  if (nullErr) {
    console.error("Error getting null embedding count:", nullErr);
    return;
  }
  console.log(`Records with NULL embedding: ${nullCount}`);

  // 3. Get unique titles
  const { data: records, error: titlesErr } = await supabase
    .from('sharia_knowledge')
    .select('source_title, category');

  if (titlesErr) {
    console.error("Error getting titles:", titlesErr);
    return;
  }

  const uniqueTitles = new Set();
  records?.forEach(r => {
    uniqueTitles.add(`${r.source_title || 'Untitled'} (${r.category || 'UMUM'})`);
  });

  console.log(`\nUnique documents in knowledge base (${uniqueTitles.size}):`);
  Array.from(uniqueTitles).forEach(t => console.log(`- ${t}`));
}

inspectShariaKnowledge();

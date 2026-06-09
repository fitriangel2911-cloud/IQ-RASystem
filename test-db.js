const fs = require('fs');

const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local not found");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error("Error: URL or Service Role key missing in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Connecting to Supabase URL:", supabaseUrl);
  
  const { data, error } = await supabase
    .from('financing_contracts')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching financing_contracts:", error);
  } else {
    console.log("Successfully fetched financing_contracts. Columns present in first record:");
    if (data.length > 0) {
      console.log(Object.keys(data[0]));
      console.log("Data sample:", data[0]);
    } else {
      console.log("Table is empty. Let's try to query prospects.");
      const { data: pData, error: pError } = await supabase
        .from('prospects')
        .select('*')
        .limit(1);
      if (pError) {
        console.error("Error fetching prospects:", pError);
      } else if (pData.length > 0) {
        console.log("Prospects table columns:", Object.keys(pData[0]));
      } else {
        console.log("Both tables are empty.");
      }
    }
  }

  // Let's also check financing_applications if it exists
  const { data: aData, error: aError } = await supabase
    .from('financing_applications')
    .select('*')
    .limit(1);
  if (aError) {
    console.error("Error fetching financing_applications:", aError.message);
  } else if (aData && aData.length > 0) {
    console.log("financing_applications table columns:", Object.keys(aData[0]));
  } else {
    console.log("financing_applications is empty or not found.");
  }
}

testConnection();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: rules, error: rErr } = await supabase.from('access_rules').select('*');
  const { data: logs, error: lErr } = await supabase.from('audit_logs').select('*');
  
  console.log('RULES IN DB:', rules);
  if (rErr) console.error('RULES ERROR:', rErr);
  
  console.log('LOGS IN DB:', logs);
  if (lErr) console.error('LOGS ERROR:', lErr);
}

test();

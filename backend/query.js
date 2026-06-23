require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectDb() {
  console.log('=== USERS ===');
  const { data: users, error: err1 } = await supabase.from('users').select('*');
  if (err1) console.error('Error fetching users:', err1);
  else console.log(users);

  console.log('\n=== RECORDS ===');
  const { data: records, error: err2 } = await supabase.from('records').select('*');
  if (err2) console.error('Error fetching records:', err2);
  else console.log(records);

  console.log('\n=== AUDIT LOGS ===');
  const { data: logs, error: err3 } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(5);
  if (err3) console.error('Error fetching logs:', err3);
  else console.log(logs);
}

inspectDb().catch(console.error);

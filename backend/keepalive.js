require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

/**
 * Standalone Keep-Alive Script for Supabase.
 * Connects directly to Supabase and runs a lightweight count query.
 */
async function keepAlive() {
  console.log('🔄 [Keep-Alive] Initializing connection to Supabase...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ [Keep-Alive] Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const start = Date.now();

  try {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    const duration = Date.now() - start;
    console.log(`✅ [Keep-Alive] Supabase is alive!`);
    console.log(`⏱️  Query completed in ${duration}ms.`);
    console.log(`📊 Registered users count: ${count}`);
  } catch (error) {
    console.error('❌ [Keep-Alive] Supabase Query Failed:', error.message);
    process.exitCode = 1;
  }
}

keepAlive();

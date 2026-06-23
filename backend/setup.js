// Run once to set up Supabase Storage bucket
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setup() {
  console.log('🔧 MediVault — Supabase Setup Script\n');

  // 1. Create storage bucket
  console.log('📦 Creating storage bucket "medical-records"...');
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('medical-records', {
    public: false, // Private — only accessed via signed URLs
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
  });

  if (bucketError) {
    if (bucketError.message?.includes('already exists') || bucketError.statusCode === '409') {
      console.log('   ✅ Bucket "medical-records" already exists — skipping');
    } else {
      console.error('   ❌ Bucket creation failed:', bucketError.message);
    }
  } else {
    console.log('   ✅ Bucket "medical-records" created successfully!');
  }

  // 2. Test database connection by checking if users table exists
  console.log('\n🗄️  Testing database connection...');
  const { data: testData, error: testError } = await supabase
    .from('users')
    .select('count')
    .limit(1);

  if (testError) {
    if (testError.message?.includes('relation "users" does not exist')) {
      console.error('   ❌ Users table not found. Did you run migration.sql in Supabase SQL Editor?');
      console.error('   → Go to: https://app.supabase.com → SQL Editor → Paste migration.sql → Run');
    } else {
      console.error('   ❌ Database error:', testError.message);
    }
  } else {
    console.log('   ✅ Database connected! Tables found.');
  }

  // 3. List all tables
  console.log('\n📋 Checking tables...');
  const tables = ['users', 'records', 'record_versions', 'share_links', 'audit_logs', 'appointments', 'medications', 'ai_summaries'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1);
    if (error) {
      console.log(`   ❌ ${table} — NOT FOUND (run migration.sql)`);
    } else {
      console.log(`   ✅ ${table} — OK`);
    }
  }

  // 4. List storage buckets
  console.log('\n📁 Storage buckets:');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('   ❌ Could not list buckets:', listError.message);
  } else {
    buckets.forEach(b => console.log(`   ✅ ${b.name} (public: ${b.public})`));
  }

  console.log('\n✨ Setup complete! Start the backend with: npm run dev\n');
}

setup().catch(console.error);

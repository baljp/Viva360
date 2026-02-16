const { Client } = require('pg');

const projectRef = process.env.SUPABASE_PROJECT_REF || 'SEU_PROJECT_REF';
const password = process.env.SUPABASE_DB_PASSWORD || '';

async function test(connectionString, label) {
  console.log(`\n--- Testing ${label} ---`);
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query('SELECT 1');
    console.log(`✅ Success: ${JSON.stringify(res.rows[0])}`);
    await client.end();
  } catch (err) {
    console.error(`❌ Failed: ${err.message}`);
  }
}

async function run() {
  if (!password) {
    console.error('❌ Defina SUPABASE_DB_PASSWORD no ambiente para executar este script.');
    process.exit(1);
  }

  // Test 1: Standard Pooler URL (Transaction Mode)
  await test(`postgresql://postgres.${projectRef}:${password}@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`, 'Transaction Mode (Suffix)');

  // Test 2: Standard Pooler URL (Session Mode)
  await test(`postgresql://postgres.${projectRef}:${password}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`, 'Session Mode (Suffix)');

  // Test 3: Standard Direct Connection
  await test(`postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`, 'Direct Connection');
}

run();

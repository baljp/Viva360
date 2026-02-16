import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

async function testConnection() {
  if (!connectionString) {
    console.error('❌ DATABASE_URL não definida no ambiente.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  console.log("Testing connection to Supabase...");
  try {
    await client.connect();
    console.log("✅ SUCCESS: Connected to Supabase Database!");
    const res = await client.query('SELECT current_database(), current_user, version();');
    console.log("Query Result:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("❌ FAILURE: Could not connect to Supabase.");
    console.error(err);
  }
}

testConnection();

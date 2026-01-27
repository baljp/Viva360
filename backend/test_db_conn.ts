import { Client } from 'pg';

const connectionString = "postgresql://postgres:Elisaalencar1985@db.oqhzisdjbtyxyarjeuhp.supabase.co:5432/postgres";

async function testConnection() {
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

import { Client } from 'pg';

const connectionString = "postgresql://postgres:Elisaalencar1985@db.oqhzisdjbtyxyarjeuhp.supabase.co:5432/postgres";

async function listTables() {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  console.log("🔍 Checking tables in Supabase...");
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (res.rows.length === 0) {
      console.log("❌ NO TABLES FOUND in 'public' schema.");
    } else {
      console.log("✅ TABLES FOUND:");
      res.rows.forEach(row => console.log(` - ${row.table_name}`));
    }
    
    await client.end();
  } catch (err) {
    console.error("❌ CONNECTION ERROR:");
    console.error(err);
  }
}

listTables();

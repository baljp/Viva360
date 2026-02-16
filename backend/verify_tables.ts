import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

async function listTables() {
  if (!connectionString) {
    console.error('❌ DATABASE_URL não definida no ambiente.');
    process.exit(1);
  }

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

const { Client } = require('pg');
const fs = require('fs');

async function verify() {
  const connectionString = "postgresql://postgres.oqhzisdjbtyxyarjeuhp:Elisaalencar1985@aws-1-us-east-1.pooler.supabase.com:5432/postgres";
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = res.rows.map(r => r.table_name);
    fs.writeFileSync('tables_found.txt', tables.join('\n'));
    console.log('Tables written to tables_found.txt');
  } catch (err) {
    fs.writeFileSync('db_error_report.txt', err.message + '\n' + err.stack);
  } finally {
    await client.end();
  }
}

verify();

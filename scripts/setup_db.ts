import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(rootDir, '.env') });

function run(command: string) {
  console.log(`> ${command}`);
  execSync(command, { cwd: rootDir, stdio: 'inherit' });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to setup schema.');
  }

  console.log('Applying Prisma migrations (source of truth)...');
  run('npx prisma migrate deploy --schema=./backend/prisma/schema.prisma');

  console.log('Running schema drift check...');
  run('npx tsx backend/scripts/check_schema_drift.ts');

  console.log('Database setup completed.');
}

main().catch((error) => {
  console.error('Database setup failed:', error?.message || error);
  process.exit(1);
});


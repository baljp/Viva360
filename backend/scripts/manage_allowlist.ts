import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const [emailArg, roleArg = 'CLIENT', statusArg = 'APPROVED'] = process.argv.slice(2);

const email = String(emailArg || '').trim().toLowerCase();
const role = String(roleArg || 'CLIENT').trim().toUpperCase();
const status = String(statusArg || 'APPROVED').trim().toUpperCase();

async function run() {
  if (!email || !email.includes('@')) {
    throw new Error('Usage: npx tsx backend/scripts/manage_allowlist.ts <email> [role] [status]');
  }

  const row = await prisma.authAllowlist.upsert({
    where: { email },
    update: {
      role,
      status,
      used_by: null,
      used_at: null,
    },
    create: {
      email,
      role,
      status,
    },
    select: { id: true, email: true, role: true, status: true, used_by: true, used_at: true },
  });

  console.log('Allowlist updated:', row);
}

run()
  .catch((error) => {
    console.error('Failed to manage allowlist:', error?.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


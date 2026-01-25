
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔌 Connecting to DB...');
    await prisma.$connect();
    console.log('✅ Connected.');
    
    const count = await prisma.user.count();
    console.log(`📊 Users in DB: ${count}`);
  } catch (e) {
    console.error('❌ DB Connection Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

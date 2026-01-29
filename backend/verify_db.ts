
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Database Connection...');
  try {
    await prisma.$connect();
    console.log('✅ Connection Successful!');
    
    // Quick query test
    try {
        const userCount = await prisma.user.count();
        console.log(`✅ Query Successful: Found ${userCount} users.`);
    } catch (queryError) {
        console.warn('⚠️ Connection worked but query failed (Schema sync might be needed):', queryError);
    }
    
  } catch (e) {
    console.error('❌ Connection Failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const prisma = new PrismaClient();

async function listUsers() {
  console.log('--- USER DATA AUDIT ---');
  
  const users = await (prisma as any).user.findMany({
    take: 20,
    orderBy: { created_at: 'desc' },
    include: {
      profile: true
    }
  });

  console.log(`Found ${users.length} users.`);
  
  users.forEach((u: any) => {
    console.log(`- Email: ${u.email}`);
    console.log(`  ID: ${u.id}`);
    console.log(`  Password Set: ${!!u.encrypted_password}`);
    console.log(`  Profile Set: ${!!u.profile}`);
    if (u.profile) {
      console.log(`  Profile Name: ${u.profile.name}`);
      console.log(`  Profile Role: ${u.profile.role}`);
    }
    console.log('-------------------');
  });

  process.exit(0);
}

listUsers().catch(err => {
  console.error(err);
  process.exit(1);
});

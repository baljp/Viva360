
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const prisma = new PrismaClient();

async function listEmails() {
  const profiles = await prisma.profile.findMany({
    select: { email: true },
    take: 20
  });
  console.log('EMAILS FOUND:');
  profiles.forEach(p => console.log(p.email));
  process.exit(0);
}

listEmails().catch(err => {
  console.error(err);
  process.exit(1);
});

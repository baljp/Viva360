
import { AuthService } from '../../backend/src/services/auth.service.js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from absolute paths
dotenv.config({ path: '/Users/joaobatistaramalhodelima/Projeto Viva360/Viva360-1/.env' });
dotenv.config({ path: '/Users/joaobatistaramalhodelima/Projeto Viva360/Viva360-1/backend/.env' });

async function integrationTest() {
  console.log('--- AUTHSERVICE INTEGRATION TEST ---');
  
  const email = 'bal1982@gmail.com';
  const password = 'Viva360@TestPassword';

  try {
    const data = await AuthService.login(email, password);
    console.log('✅ AuthService.login SUCCESS');
    console.log('User ID:', data.user.id);
    console.log('User Role:', data.user.role);
    console.log('Token (first 20 chars):', data.session.access_token.substring(0, 20));
  } catch (err: any) {
    console.error('❌ AuthService.login FAILED:', err.message);
    if (err.stack) console.error(err.stack);
  }

  process.exit(0);
}

integrationTest().catch(console.error);

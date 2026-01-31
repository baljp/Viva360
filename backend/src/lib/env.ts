import dotenv from 'dotenv';
import path from 'path';

// Force load .env from the backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log(`🌍 [ENV] Environment loaded. APP_MODE: ${process.env.APP_MODE}`);

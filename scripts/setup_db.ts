
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from root .env
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting Viva360 Database Setup...");

    const sqlPath = path.join(__dirname, '../supabase/master_setup.sql');
    
    if (!fs.existsSync(sqlPath)) {
        console.error("❌ SQL setup file not found at:", sqlPath);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log("📝 Reading SQL Schema...");

    // Split SQL by statement if possible, or execute as one block.
    // Prisma executeRawUnsafe can handle multiple statements if the driver allows.
    // For setup scripts with functions ($$), it's safer to execute as one block usually
    // but Prisma might complain.
    // Let's try splitting by double newline or comments to identify blocks, 
    // BUT the robust way for $$ functions is tricky. 
    // We will attempt to run it as a single transaction block first.

    try {
        // Warning: Prisma executeRawUnsafe returns number of affected rows.
        await prisma.$executeRawUnsafe(sqlContent);
        console.log("✅ Database Setup Complete!");
    } catch (e: any) {
        if (e.message.includes("cannot insert multiple commands") || e.message.includes("syntax error")) {
             console.log("⚠️  Single block execution failed. Attempting to split by statement...");
             
             // Simple fallback splitter (naive)
             const statements = sqlContent
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

             for (const stmt of statements) {
                 // Skip partial split of function body
                 // This is risky. If the first attempt fails, we notify user to use Supabase Dashboard.
                 // Realistically, for $$ functions, splitting by ; breaks logic.
                 // So we won't try too hard to split.
             }
             
             console.error("❌ Automated execution failed. Please run the SQL manually in Supabase Dashboard.");
             console.error("Error details:", e.message);
        } else {
             console.error("❌ Unexpected Error:", e);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();

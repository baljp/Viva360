const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mode = process.argv[2]; // 'sqlite' or 'postgres'

if (!['sqlite', 'postgres'].includes(mode)) {
    console.error('Usage: node scripts/db-switch.js [sqlite|postgres]');
    process.exit(1);
}

const prismaDir = path.join(__dirname, '../prisma');
const schemaPath = path.join(prismaDir, 'schema.prisma');
const targetSchema = path.join(prismaDir, mode === 'sqlite' ? 'schema.sqlite.prisma' : 'schema.postgres.prisma');

// Backup current if not backup exists, but we are just swapping so copy is fine
// First ensure schema.sqlite.prisma exists if moving away from it
if (mode === 'postgres' && !fs.existsSync(path.join(prismaDir, 'schema.sqlite.prisma'))) {
    // Assuming current schema.prisma IS sqlite initially
    fs.copyFileSync(schemaPath, path.join(prismaDir, 'schema.sqlite.prisma'));
    console.log('📦 Created schema.sqlite.prisma backup');
}

if (!fs.existsSync(targetSchema)) {
    console.error(`Error: Target schema ${targetSchema} not found.`);
    process.exit(1);
}

console.log(`🔄 Switching Prisma to ${mode.toUpperCase()}...`);
fs.copyFileSync(targetSchema, schemaPath);

console.log('⚡ Generating Prisma Client...');
try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log(`✅ Successfully switched to ${mode}!`);
} catch (e) {
    console.error('❌ Failed to generate client:', e.message);
    process.exit(1);
}

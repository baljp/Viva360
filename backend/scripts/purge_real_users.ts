import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const dbUrl = process.env.DATABASE_URL || '';
console.log(`[Purge] DATABASE_URL loaded: ${dbUrl ? `${dbUrl.substring(0, 20)}...` : 'NOT FOUND'}`);

const prisma = new PrismaClient();

const PRESERVED_EMAILS = new Set([
    'client0@viva360.com',
    'cliente@viva360.com',
    'pro0@viva360.com',
    'pro@viva360.com',
    'contato.hub0@viva360.com',
    'space@viva360.com',
    'admin@viva360.com'
]);

const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

async function purge() {
    const requestId = randomUUID();
    console.log(`[Purge] Starting purge operation. RequestId: ${requestId}`);
    console.log(`[Purge] Mode: ${dryRun ? 'DRY-RUN (No changes will be made)' : 'EXECUTE (REAL DELETION)'}`);

    // 1. Identify users to delete
    const allUsers = await prisma.user.findMany({
        select: { id: true, email: true }
    });

    const targets = allUsers.filter(u => {
        const email = String(u.email || '').toLowerCase().trim();
        return email && !PRESERVED_EMAILS.has(email);
    });

    if (targets.length === 0) {
        console.log('[Purge] No real users found to purge. Essential test accounts are safe.');
        return;
    }

    const targetIds = targets.map(t => t.id);
    const targetEmails = targets.map(t => t.email);

    console.log(`[Purge] Found ${targets.length} users to purge:`);
    targetEmails.forEach(email => console.log(` - ${email}`));

    if (dryRun) {
        console.log('[Purge] Dry-run complete. Run with --execute to perform actual deletion.');
        return;
    }

    console.log('[Purge] Executing deletion in manual cascade order...');

    try {
        await prisma.$transaction(async (tx) => {
            // Cascade delete starting from leaves
            const tablesPerProfile = [
                'auditEvent',
                'metamorphosisProjection',
                'guardianPresence',
                'oracleHistory',
                'pushSubscription',
                'interactionReceipt',
                'notification',
                'transaction',
                'routine',
                'profileRole'
            ];

            for (const table of tablesPerProfile) {
                const count = await (tx as any)[table].deleteMany({
                    where: {
                        OR: [
                            { actor_id: { in: targetIds } },
                            { user_id: { in: targetIds } },
                            { guardian_id: { in: targetIds } },
                            { profile_id: { in: targetIds } }
                        ].filter(clause => {
                            // Basic check to see if field exists in this model via Prisma metadata isn't easy here, 
                            // but we know the schema from reset_mock_test_data.ts
                            return true;
                        })
                    }
                }).catch(() => ({ count: 0 })); // Ignore errors if field doesn't exist on specific table
                console.log(` - Deleted from ${table}: ${count.count}`);
            }

            // Relations with possible double ID links
            const complexTables = [
                { name: 'profileLink', fields: ['source_id', 'target_id'] },
                { name: 'chatParticipant', fields: ['profile_id'] },
                { name: 'chatMessage', fields: ['sender_id', 'receiver_id'] },
                { name: 'marketplaceOrder', fields: ['buyer_id', 'seller_id'] },
                { name: 'escamboProposal', fields: ['proposer_id', 'receiver_id'] },
                { name: 'record', fields: ['patient_id', 'professional_id'] },
                { name: 'swapOffer', fields: ['provider_id', 'requester_id'] },
                { name: 'recruitmentApplication', fields: ['candidate_id', 'space_id'] },
                { name: 'interview', fields: ['guardian_id', 'space_id'] },
                { name: 'appointment', fields: ['client_id', 'professional_id'] },
                { name: 'contract', fields: ['space_id', 'guardian_id'] }
            ];

            for (const table of complexTables) {
                const count = await (tx as any)[table.name].deleteMany({
                    where: {
                        OR: table.fields.map(f => ({ [f]: { in: targetIds } }))
                    }
                });
                console.log(` - Deleted from ${table.name}: ${count.count}`);
            }

            // Root hierarchical entities
            const rootTables = [
                { name: 'vacancy', field: 'space_id' },
                { name: 'calendarEvent', field: 'user_id' },
                { name: 'tribeInvite', field: 'hub_id' },
                { name: 'product', field: 'owner_id' },
                { name: 'room', field: 'hub_id' }
            ];

            for (const table of rootTables) {
                const count = await (tx as any)[table.name].deleteMany({
                    where: { [table.field]: { in: targetIds } }
                });
                console.log(` - Deleted from ${table.name}: ${count.count}`);
            }

            // Finally Profile and User
            const profileCount = await tx.profile.deleteMany({ where: { id: { in: targetIds } } });
            const userCount = await tx.user.deleteMany({ where: { id: { in: targetIds } } });
            const allowlistCount = await tx.authAllowlist.deleteMany({ where: { email: { in: targetEmails as string[] } } });

            console.log(` - Deleted Profiles: ${profileCount.count}`);
            console.log(` - Deleted Auth Users: ${userCount.count}`);
            console.log(` - Deleted Allowlist entries: ${allowlistCount.count}`);
        }, { timeout: 30000 });

        console.log('[Purge] Success! Real user data has been cleared.');
    } catch (error) {
        console.error('[Purge] Failed to execute purge transaction:', error);
    }
}

purge()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

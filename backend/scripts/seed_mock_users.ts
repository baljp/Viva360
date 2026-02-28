import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const PRO_ID = '22222222-2222-4222-8222-222222222222';
const HUB_ID = '33333333-3333-4333-8333-333333333333';

async function seedTestUser(id: string, email: string, role: string, payload: any) {
    // 1. Auth allowlist
    await prisma.authAllowlist.upsert({
        where: { email },
        create: {
            email,
            role: role.toUpperCase() as any,
            status: 'APPROVED',
            notes: 'QA_MOCK_SEEDING',
        },
        update: {},
    });

    // 2. Auth User
    await prisma.user.upsert({
        where: { id },
        create: {
            id,
            email,
        },
        update: {},
    });

    // 3. Application Profile
    await prisma.profile.upsert({
        where: { id },
        create: {
            id,
            email,
            role,
            active_role: role,
            ...payload,
        },
        update: {
            role,
            active_role: role,
        },
    });

    // 4. Force default ProfileRole
    const existingRole = await prisma.profileRole.findFirst({
        where: { profile_id: id, role }
    });
    if (!existingRole) {
        await prisma.profileRole.create({
            data: {
                profile_id: id,
                role,
            }
        });
    }
}

async function run() {
    console.log('Seeding baseline QA E2E identities into the database...');
    try {
        await seedTestUser(
            ADMIN_ID,
            'admin@viva360.com',
            'ADMIN',
            { name: 'Mock Admin Buscador QA' }
        );
        await seedTestUser(
            ADMIN_ID,
            'cliente@viva360.com',
            'CLIENT',
            { name: 'Mock Cliente Master' }
        );
        await seedTestUser(
            ADMIN_ID,
            'client0@viva360.com',
            'CLIENT',
            { name: 'Mock Client QA' }
        );
        await seedTestUser(
            PRO_ID,
            'pro@viva360.com',
            'PROFESSIONAL',
            { name: 'Mock Pro Master' }
        );
        await seedTestUser(
            PRO_ID,
            'pro0@viva360.com',
            'PROFESSIONAL',
            { name: 'Mock Pro QA' }
        );
        await seedTestUser(
            HUB_ID,
            'space@viva360.com',
            'SPACE',
            { name: 'Mock Space Master' }
        );
        await seedTestUser(
            HUB_ID,
            'contato.hub0@viva360.com',
            'SPACE',
            { name: 'Mock Hub QA' }
        );
        console.log('QA DB Base Test Seeding completes successfully!');
    } catch (err) {
        console.error('Failed to seed QA identities:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

run();

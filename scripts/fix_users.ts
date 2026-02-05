
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUsers() {
    console.log("🚀 Starting Database Fix: Confirming all users for Supabase Auth...");

    try {
        const users = await prisma.user.findMany();
        console.log(`📊 Found ${users.length} users to check.`);

        let updatedCount = 0;

        for (const user of users) {
            console.log(`🔧 Fixing user: ${user.email}`);
            
            // 1. Update User Metadata & Confirmation (via RAW SQL to avoid Prisma generated column issues)
            await prisma.$executeRaw`
                UPDATE auth.users SET 
                    instance_id = '00000000-0000-0000-0000-000000000000'::uuid,
                    aud = 'authenticated',
                    role = 'authenticated',
                    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
                    raw_app_meta_data = ${JSON.stringify({ provider: 'email', providers: ['email'] })}::jsonb,
                    raw_user_meta_data = ${JSON.stringify(await getProfileMetadata(user.id, user.email))}::jsonb,
                    is_anonymous = false
                WHERE id = ${user.id}::uuid
            `;

            // 2. Ensure Identity Exists (CRITICAL for SDK Login)
            const identities: any[] = await prisma.$queryRaw`SELECT id FROM auth.identities WHERE user_id = ${user.id}::uuid`;
            
            if (identities.length === 0) {
                console.log(`   🔗 Creating missing identity for ${user.email}`);
                const identityId = crypto.randomUUID();
                await prisma.$executeRaw`
                    INSERT INTO auth.identities (
                        id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
                    ) VALUES (
                        ${identityId}::uuid, ${user.id}::uuid,
                        ${JSON.stringify({ sub: user.id, email: user.email, email_verified: true, phone_verified: false })}::jsonb,
                        'email', NOW(), NOW(), NOW(), ${user.id}::text
                    )
                `;
            }

            updatedCount++;
        }

        console.log(`✅ Success! Updated ${updatedCount} users.`);

    } catch (error) {
        console.error("❌ Fix failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

async function getProfileMetadata(userId: string, email: string | null) {
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (profile) {
        return {
            sub: userId,
            email: email,
            email_verified: true,
            phone_verified: false,
            full_name: profile.name,
            role: profile.role
        };
    }
    return { 
        sub: userId, 
        email: email, 
        email_verified: true, 
        phone_verified: false, 
        full_name: 'Viajante', 
        role: 'CLIENT' 
    };
}

fixUsers();

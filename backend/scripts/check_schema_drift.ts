import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REQUIRED: Record<string, Record<string, string[]>> = {
  auth: {
    users: ['id', 'email', 'encrypted_password'],
  },
  public: {
    profiles: ['id', 'email', 'role', 'active_role', 'name'],
    profile_roles: ['id', 'profile_id', 'role'],
    appointments: ['id', 'client_id', 'professional_id', 'status'],
    notifications: ['id', 'user_id', 'read'],
    chat_messages: ['id', 'sender_id', 'receiver_id', 'content'],
    products: ['id', 'owner_id', 'name', 'price'],
    transactions: ['id', 'user_id', 'amount'],
    oracle_messages: ['id', 'text', 'category', 'element'],
    oracle_history: ['id', 'user_id', 'message_id', 'drawn_at'],
    tribe_invites: ['id', 'hub_id', 'email', 'status', 'invite_type'],
    recruitment_applications: ['id', 'vacancy_id', 'candidate_id', 'space_id', 'status'],
    interviews: ['id', 'application_id', 'space_id', 'guardian_id', 'status'],
    interaction_receipts: ['id', 'entity_type', 'entity_id', 'action', 'actor_id', 'status'],
    swap_offers: ['id', 'provider_id', 'requester_id', 'status'],
    marketplace_orders: ['id', 'buyer_id', 'seller_id', 'status', 'payment_status', 'fulfillment_status'],
    auth_allowlist: ['id', 'email', 'status', 'used_by'],
  },
};

async function getColumns(schema: string, table: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<Array<{ column_name: string }>>(
    Prisma.sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ${schema}
        AND table_name = ${table}
    `,
  );
  return new Set(rows.map((row) => row.column_name));
}

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for drift check.');
  }

  const missing: string[] = [];

  for (const [schema, tables] of Object.entries(REQUIRED)) {
    for (const [table, columns] of Object.entries(tables)) {
      const existing = await getColumns(schema, table);
      if (existing.size === 0) {
        missing.push(`${schema}.${table} (table missing)`);
        continue;
      }

      for (const column of columns) {
        if (!existing.has(column)) {
          missing.push(`${schema}.${table}.${column}`);
        }
      }
    }
  }

  if (missing.length > 0) {
    console.error('Schema drift detected. Missing elements:');
    for (const item of missing) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log('Schema drift check passed.');
}

run()
  .catch((error) => {
    console.error('Schema drift check failed:', error?.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

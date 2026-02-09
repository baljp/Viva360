import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

type CleanupReport = {
  requestId: string;
  dryRun: boolean;
  startedAt: string;
  finishedAt?: string;
  matchedEmails: string[];
  matchedProfileIds: string[];
  deletedByTable: Record<string, number>;
  reconciledOrphans: string[];
  errors: string[];
};

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');
const reconcileOrphans = !args.includes('--skip-reconcile-orphans');
const preserveEmailArg = args.find((arg) => arg.startsWith('--preserve-email=')) || '';
const purgeEmailArg = args.find((arg) => arg.startsWith('--purge-email=')) || '';
const preserveEmail = String(preserveEmailArg.split('=')[1] || '').trim().toLowerCase();
const purgeEmail = String(purgeEmailArg.split('=')[1] || '').trim().toLowerCase();

const STRICT_TEST_EMAILS = new Set([
  'client0@viva360.com',
  'pro0@viva360.com',
  'contato.hub0@viva360.com',
  'admin@viva360.com',
]);

const EMAIL_PATTERNS: RegExp[] = [
  /@demo\.viva360\.com$/i,
  /@test\.com$/i,
  /^client\d+@viva360\.com$/i,
  /^pro\d+@viva360\.com$/i,
  /^contato\.hub\d+@viva360\.com$/i,
  /^(busc_|guard_|sanct_|test_|qa\.|verify_|codex_|mock_|temp_)/i,
];

const NAME_PATTERNS: RegExp[] = [
  /teste/i,
  /demo/i,
  /mock/i,
  /agent/i,
  /qa/i,
  /verify/i,
];

const isMockEmail = (email: string): boolean => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  if (STRICT_TEST_EMAILS.has(normalized)) return true;
  return EMAIL_PATTERNS.some((pattern) => pattern.test(normalized));
};

const isMockName = (name?: string | null): boolean => {
  const normalized = String(name || '').trim();
  if (!normalized) return false;
  return NAME_PATTERNS.some((pattern) => pattern.test(normalized));
};

const isMissingTableOrColumnError = (error: unknown): boolean => {
  const code = String((error as any)?.code || '');
  return code === 'P2021' || code === 'P2022';
};

const runDeleteOperation = async (
  name: string,
  run: () => Promise<{ count: number }>,
  report: CleanupReport
): Promise<void> => {
  if (dryRun) {
    report.deletedByTable[name] = 0;
    return;
  }

  try {
    const result = await run();
    report.deletedByTable[name] = result.count;
  } catch (error) {
    if (isMissingTableOrColumnError(error)) {
      report.deletedByTable[name] = 0;
      report.errors.push(`[skip:${name}] ${String((error as any)?.message || error)}`);
      return;
    }
    throw error;
  }
};

async function collectTargets() {
  const [profiles, users] = await Promise.all([
    prisma.profile.findMany({
      select: { id: true, email: true, name: true },
    }),
    prisma.user.findMany({
      select: { id: true, email: true },
    }),
  ]);

  const matchedProfiles = profiles.filter((profile) => {
    const email = String(profile.email || '').toLowerCase();
    if (email && preserveEmail && email === preserveEmail) return false;
    if (email && purgeEmail && email === purgeEmail) return false;
    return isMockEmail(email) || isMockName(profile.name);
  });

  const matchedEmails = new Set<string>();
  matchedProfiles.forEach((profile) => {
    if (profile.email) matchedEmails.add(String(profile.email).toLowerCase());
  });

  const matchedUsers = users.filter((user) => {
    const email = String(user.email || '').toLowerCase();
    if (email && preserveEmail && email === preserveEmail) return false;
    if (email && purgeEmail && email === purgeEmail) return false;
    return isMockEmail(email);
  });
  matchedUsers.forEach((user) => {
    if (user.email) matchedEmails.add(String(user.email).toLowerCase());
  });

  return {
    matchedProfileIds: matchedProfiles.map((profile) => profile.id),
    matchedEmails: Array.from(matchedEmails),
  };
}

async function deleteByProfiles(profileIds: string[], report: CleanupReport) {
  if (profileIds.length === 0) return;

  const operations: Array<{ name: string; run: () => Promise<{ count: number }> }> = [
    { name: 'audit_events', run: () => prisma.auditEvent.deleteMany({ where: { actor_id: { in: profileIds } } }) },
    { name: 'metamorphosis_projections', run: () => prisma.metamorphosisProjection.deleteMany({ where: { user_id: { in: profileIds } } }) },
    { name: 'guardian_presence', run: () => prisma.guardianPresence.deleteMany({ where: { guardian_id: { in: profileIds } } }) },
    { name: 'oracle_history', run: () => prisma.oracleHistory.deleteMany({ where: { user_id: { in: profileIds } } }) },
    { name: 'profile_links', run: () => prisma.profileLink.deleteMany({ where: { OR: [{ source_id: { in: profileIds } }, { target_id: { in: profileIds } }] } }) },
    { name: 'chat_participants', run: () => prisma.chatParticipant.deleteMany({ where: { profile_id: { in: profileIds } } }) },
    { name: 'chat_messages', run: () => prisma.chatMessage.deleteMany({ where: { OR: [{ sender_id: { in: profileIds } }, { receiver_id: { in: profileIds } }] } }) },
    { name: 'marketplace_orders', run: () => prisma.marketplaceOrder.deleteMany({ where: { OR: [{ buyer_id: { in: profileIds } }, { seller_id: { in: profileIds } }] } }) },
    { name: 'escambo_proposals', run: () => prisma.escamboProposal.deleteMany({ where: { OR: [{ proposer_id: { in: profileIds } }, { receiver_id: { in: profileIds } }] } }) },
    { name: 'records', run: () => prisma.record.deleteMany({ where: { OR: [{ patient_id: { in: profileIds } }, { professional_id: { in: profileIds } }] } }) },
    { name: 'vacancies', run: () => prisma.vacancy.deleteMany({ where: { space_id: { in: profileIds } } }) },
    { name: 'calendar_events', run: () => prisma.calendarEvent.deleteMany({ where: { user_id: { in: profileIds } } }) },
    { name: 'tribe_invites', run: () => prisma.tribeInvite.deleteMany({ where: { hub_id: { in: profileIds } } }) },
    { name: 'swap_offers', run: () => prisma.swapOffer.deleteMany({ where: { OR: [{ provider_id: { in: profileIds } }, { requester_id: { in: profileIds } }] } }) },
    { name: 'notifications', run: () => prisma.notification.deleteMany({ where: { user_id: { in: profileIds } } }) },
    { name: 'transactions', run: () => prisma.transaction.deleteMany({ where: { user_id: { in: profileIds } } }) },
    { name: 'products', run: () => prisma.product.deleteMany({ where: { owner_id: { in: profileIds } } }) },
    { name: 'appointments', run: () => prisma.appointment.deleteMany({ where: { OR: [{ client_id: { in: profileIds } }, { professional_id: { in: profileIds } }] } }) },
    { name: 'rooms', run: () => prisma.room.deleteMany({ where: { hub_id: { in: profileIds } } }) },
    { name: 'profile_roles', run: () => prisma.profileRole.deleteMany({ where: { profile_id: { in: profileIds } } }) },
    { name: 'profiles', run: () => prisma.profile.deleteMany({ where: { id: { in: profileIds } } }) },
  ];

  for (const operation of operations) {
    await runDeleteOperation(operation.name, operation.run, report);
  }
}

async function deleteByEmails(emails: string[], report: CleanupReport) {
  if (emails.length === 0) return;

  const operations: Array<{ name: string; run: () => Promise<{ count: number }> }> = [
    { name: 'auth_allowlist', run: () => prisma.authAllowlist.deleteMany({ where: { email: { in: emails } } }) },
    { name: 'auth_users', run: () => prisma.user.deleteMany({ where: { email: { in: emails } } }) },
  ];

  for (const operation of operations) {
    await runDeleteOperation(operation.name, operation.run, report);
  }
}

async function reconcileIncompleteAccounts(report: CleanupReport) {
  if (!reconcileOrphans) return;

  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      profile: null,
    },
    select: { id: true, email: true },
  });

  for (const user of users) {
    const email = String(user.email || '').toLowerCase();
    if (!email || isMockEmail(email)) continue;

    report.reconciledOrphans.push(email);

    if (dryRun) continue;

    await prisma.authAllowlist.upsert({
      where: { email },
      create: {
        email,
        role: 'CLIENT',
        status: 'APPROVED',
        notes: 'AUTO_RECONCILE_ORPHAN_AUTH_USER',
      },
      update: {
        status: 'APPROVED',
        role: 'CLIENT',
        notes: 'AUTO_RECONCILE_ORPHAN_AUTH_USER',
      },
    });
  }
}

async function purgeRuntimeDataForEmail(email: string, report: CleanupReport) {
  if (!email) return;

  const profile = await prisma.profile.findFirst({
    where: { email },
    select: { id: true, email: true },
  });
  if (!profile) return;

  const profileId = profile.id;
  const operations: Array<{ name: string; run: () => Promise<{ count: number }> }> = [
    { name: 'purge_audit_events', run: () => prisma.auditEvent.deleteMany({ where: { actor_id: profileId } }) },
    { name: 'purge_metamorphosis_projections', run: () => prisma.metamorphosisProjection.deleteMany({ where: { user_id: profileId } }) },
    { name: 'purge_events', run: () => prisma.event.deleteMany({ where: { stream_id: profileId } }) },
    { name: 'purge_guardian_presence', run: () => prisma.guardianPresence.deleteMany({ where: { guardian_id: profileId } }) },
    { name: 'purge_oracle_history', run: () => prisma.oracleHistory.deleteMany({ where: { user_id: profileId } }) },
    { name: 'purge_profile_links', run: () => prisma.profileLink.deleteMany({ where: { OR: [{ source_id: profileId }, { target_id: profileId }] } }) },
    { name: 'purge_chat_participants', run: () => prisma.chatParticipant.deleteMany({ where: { profile_id: profileId } }) },
    { name: 'purge_chat_messages', run: () => prisma.chatMessage.deleteMany({ where: { OR: [{ sender_id: profileId }, { receiver_id: profileId }] } }) },
    { name: 'purge_marketplace_orders', run: () => prisma.marketplaceOrder.deleteMany({ where: { OR: [{ buyer_id: profileId }, { seller_id: profileId }] } }) },
    { name: 'purge_escambo_proposals', run: () => prisma.escamboProposal.deleteMany({ where: { OR: [{ proposer_id: profileId }, { receiver_id: profileId }] } }) },
    { name: 'purge_records', run: () => prisma.record.deleteMany({ where: { OR: [{ patient_id: profileId }, { professional_id: profileId }] } }) },
    { name: 'purge_vacancies', run: () => prisma.vacancy.deleteMany({ where: { space_id: profileId } }) },
    { name: 'purge_calendar_events', run: () => prisma.calendarEvent.deleteMany({ where: { user_id: profileId } }) },
    { name: 'purge_tribe_invites', run: () => prisma.tribeInvite.deleteMany({ where: { hub_id: profileId } }) },
    { name: 'purge_swap_offers', run: () => prisma.swapOffer.deleteMany({ where: { OR: [{ provider_id: profileId }, { requester_id: profileId }] } }) },
    { name: 'purge_recruitment_applications', run: () => prisma.recruitmentApplication.deleteMany({ where: { OR: [{ candidate_id: profileId }, { space_id: profileId }] } }) },
    { name: 'purge_interviews', run: () => prisma.interview.deleteMany({ where: { OR: [{ guardian_id: profileId }, { space_id: profileId }] } }) },
    { name: 'purge_interaction_receipts', run: () => prisma.interactionReceipt.deleteMany({ where: { actor_id: profileId } }) },
    { name: 'purge_notifications', run: () => prisma.notification.deleteMany({ where: { user_id: profileId } }) },
    { name: 'purge_transactions', run: () => prisma.transaction.deleteMany({ where: { user_id: profileId } }) },
    { name: 'purge_products', run: () => prisma.product.deleteMany({ where: { owner_id: profileId } }) },
    { name: 'purge_appointments', run: () => prisma.appointment.deleteMany({ where: { OR: [{ client_id: profileId }, { professional_id: profileId }] } }) },
    { name: 'purge_rooms', run: () => prisma.room.deleteMany({ where: { hub_id: profileId } }) },
  ];

  for (const operation of operations) {
    await runDeleteOperation(operation.name, operation.run, report);
  }
}

async function run() {
  const report: CleanupReport = {
    requestId: randomUUID(),
    dryRun,
    startedAt: new Date().toISOString(),
    matchedEmails: [],
    matchedProfileIds: [],
    deletedByTable: {},
    reconciledOrphans: [],
    errors: [],
  };

  try {
    const { matchedProfileIds, matchedEmails } = await collectTargets();
    report.matchedProfileIds = matchedProfileIds;
    report.matchedEmails = matchedEmails;

    if (dryRun) {
      report.deletedByTable = {
        dry_run_profiles: matchedProfileIds.length,
        dry_run_emails: matchedEmails.length,
        dry_run_preserve_email: preserveEmail ? 1 : 0,
        dry_run_targeted_purge: purgeEmail ? 1 : 0,
      };
    } else {
      await prisma.$transaction(async () => {
        await deleteByProfiles(matchedProfileIds, report);
        await deleteByEmails(matchedEmails, report);
        await purgeRuntimeDataForEmail(purgeEmail, report);
        await reconcileIncompleteAccounts(report);
      }, { timeout: 120000 });
    }

    if (dryRun) {
      await purgeRuntimeDataForEmail(purgeEmail, report);
      await reconcileIncompleteAccounts(report);
    }
  } catch (error: any) {
    report.errors.push(String(error?.message || error));
  } finally {
    report.finishedAt = new Date().toISOString();
    console.log(JSON.stringify(report, null, 2));
  }

  const fatalErrors = report.errors.filter((error) => !error.startsWith('[skip:'));
  if (fatalErrors.length > 0) {
    process.exit(1);
  }
}

run()
  .catch((error) => {
    console.error('cleanup failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import prisma from '../lib/prisma';

export type GamificationQuest = {
  id: string;
  label: string;
  description?: string;
  reward: number;
  isCompleted: boolean;
  type?: 'ritual' | 'water' | 'breathe' | 'other';
};

export type GamificationAchievement = {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'streak' | 'karma' | 'social' | 'ritual' | 'mastery';
  threshold: number;
  unlockedAt?: string;
};

export type GamificationState = {
  dateKey: string;
  dailyQuests: GamificationQuest[];
  achievements: GamificationAchievement[];
  grimoireMeta: {
    totalCards: number;
    source: 'oracle_history';
    lastSyncedAt: string | null;
  };
  source: 'interaction_receipts';
};

const QUEST_ENTITY_TYPE = 'GAMIFICATION';
const QUEST_ENTITY_PREFIX = 'DAILY_QUEST_';
const ACHIEVEMENT_ENTITY_PREFIX = 'ACHIEVEMENT_UNLOCK_';

const DEFAULT_DAILY_QUESTS: Omit<GamificationQuest, 'isCompleted'>[] = [
  { id: 'checkin', label: 'Check-in Matinal', description: 'Registre como você está hoje', reward: 5 },
  { id: 'ritual', label: 'Regar o Jardim', description: 'Complete seu ritual diário', reward: 10 },
  { id: 'oracle', label: 'Consultar o Oráculo', description: 'Receba a mensagem do dia', reward: 5 },
  { id: 'journal', label: 'Escrita da Alma', description: 'Escreva no seu diário', reward: 8 },
  { id: 'tribe', label: 'Conexão Tribal', description: 'Interaja com alguém da tribo', reward: 15 },
];

const getUtcDateKey = (date = new Date()) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};

const asQuest = (value: unknown): GamificationQuest | null => {
  const raw = asRecord(value);
  const id = String(raw.id || '').trim();
  const label = String(raw.label || '').trim();
  if (!id || !label) return null;
  const typeRaw = String(raw.type || '').trim();
  return {
    id,
    label,
    description: raw.description ? String(raw.description) : undefined,
    reward: Number(raw.reward || 0),
    isCompleted: !!raw.isCompleted,
    type: ['ritual', 'water', 'breathe', 'other'].includes(typeRaw) ? (typeRaw as GamificationQuest['type']) : undefined,
  };
};

const asAchievement = (value: unknown): GamificationAchievement | null => {
  const raw = asRecord(value);
  const id = String(raw.id || '').trim();
  const label = String(raw.label || '').trim();
  const description = String(raw.description || '').trim();
  const icon = String(raw.icon || '').trim();
  const category = String(raw.category || '').trim();
  if (!id || !label || !description || !icon) return null;
  if (!['streak', 'karma', 'social', 'ritual', 'mastery'].includes(category)) return null;
  return {
    id,
    label,
    description,
    icon,
    category: category as GamificationAchievement['category'],
    threshold: Number(raw.threshold || 0),
    unlockedAt: raw.unlockedAt ? String(raw.unlockedAt) : undefined,
  };
};

export class GamificationService {
  async getState(userId: string, dateKey = getUtcDateKey()): Promise<GamificationState> {
    const [questReceipts, achievementReceipts, grimoireCount, latestReceipt] = await Promise.all([
      prisma.interactionReceipt.findMany({
        where: {
          entity_type: QUEST_ENTITY_TYPE,
          entity_id: userId,
          actor_id: userId,
          action: { startsWith: `${QUEST_ENTITY_PREFIX}${dateKey}_` },
          status: { in: ['DONE', 'COMPLETED'] },
        },
        orderBy: { created_at: 'asc' },
        select: { action: true, payload: true },
      }).catch(() => []),
      prisma.interactionReceipt.findMany({
        where: {
          entity_type: QUEST_ENTITY_TYPE,
          entity_id: userId,
          actor_id: userId,
          action: { startsWith: ACHIEVEMENT_ENTITY_PREFIX },
          status: { in: ['DONE', 'COMPLETED'] },
        },
        orderBy: { created_at: 'asc' },
        select: { payload: true, created_at: true },
      }).catch(() => []),
      prisma.oracleHistory.count({ where: { user_id: userId } }).catch(() => 0),
      prisma.interactionReceipt.findFirst({
        where: {
          entity_type: QUEST_ENTITY_TYPE,
          entity_id: userId,
          actor_id: userId,
          OR: [
            { action: { startsWith: `${QUEST_ENTITY_PREFIX}${dateKey}_` } },
            { action: { startsWith: ACHIEVEMENT_ENTITY_PREFIX } },
          ],
        },
        orderBy: { updated_at: 'desc' },
        select: { updated_at: true },
      }).catch(() => null),
    ]);

    const completedByQuestId = new Map<string, GamificationQuest>();
    for (const receipt of questReceipts) {
      const quest = asQuest(receipt.payload);
      if (quest) completedByQuestId.set(quest.id, { ...quest, isCompleted: true });
    }

    const dailyQuests = DEFAULT_DAILY_QUESTS.map((base) => {
      const saved = completedByQuestId.get(base.id);
      return saved
        ? { ...base, ...saved, isCompleted: true }
        : { ...base, isCompleted: false };
    });

    const achievements = achievementReceipts
      .map((receipt): GamificationAchievement | null => {
        const achievement = asAchievement(receipt.payload);
        if (!achievement) return null;
        return {
          ...achievement,
          unlockedAt: achievement.unlockedAt || receipt.created_at.toISOString(),
        };
      })
      .filter((value): value is GamificationAchievement => !!value);

    return {
      dateKey,
      dailyQuests,
      achievements,
      grimoireMeta: {
        totalCards: Number(grimoireCount || 0),
        source: 'oracle_history',
        lastSyncedAt: latestReceipt?.updated_at?.toISOString() || null,
      },
      source: 'interaction_receipts',
    };
  }

  async completeQuest(userId: string, quest: Omit<GamificationQuest, 'isCompleted'> & { dateKey?: string }) {
    const dateKey = String(quest.dateKey || getUtcDateKey()).trim();
    const action = `${QUEST_ENTITY_PREFIX}${dateKey}_${quest.id}`;
    const requestPayload = {
      id: quest.id,
      label: quest.label,
      description: quest.description || undefined,
      reward: Number(quest.reward || 0),
      isCompleted: true,
      type: quest.type || undefined,
      dateKey,
    };

    const receipt = await prisma.interactionReceipt.upsert({
      where: {
        entity_type_entity_id_action_actor_id: {
          entity_type: QUEST_ENTITY_TYPE,
          entity_id: userId,
          action,
          actor_id: userId,
        },
      },
      create: {
        entity_type: QUEST_ENTITY_TYPE,
        entity_id: userId,
        action,
        actor_id: userId,
        status: 'DONE',
        payload: requestPayload,
      },
      update: {
        status: 'DONE',
        payload: requestPayload,
      },
    });

    return {
      receiptId: receipt.id,
      state: await this.getState(userId, dateKey),
    };
  }

  async syncAchievements(userId: string, achievements: GamificationAchievement[]) {
    const unlocked = achievements.filter((achievement) => !!achievement.unlockedAt);
    if (unlocked.length > 0) {
      await Promise.all(unlocked.map((achievement) => {
        const action = `${ACHIEVEMENT_ENTITY_PREFIX}${achievement.id}`;
        return prisma.interactionReceipt.upsert({
          where: {
            entity_type_entity_id_action_actor_id: {
              entity_type: QUEST_ENTITY_TYPE,
              entity_id: userId,
              action,
              actor_id: userId,
            },
          },
          create: {
            entity_type: QUEST_ENTITY_TYPE,
            entity_id: userId,
            action,
            actor_id: userId,
            status: 'DONE',
            payload: achievement,
          },
          update: {
            status: 'DONE',
            payload: achievement,
          },
        });
      }));
    }

    return this.getState(userId);
  }
}

export const gamificationService = new GamificationService();

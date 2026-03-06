import prisma from '../lib/prisma';
import { isDbUnavailableError } from '../lib/dbReadFallback';

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

export type GamificationLeaderboardEntry = {
  userId: string;
  name: string;
  avatar: string | null;
  karma: number;
  rankLevel: number;
  rankName: string;
};

export type GamificationLeaderboardState = {
  me: {
    userId: string;
    karma: number;
    rankLevel: number;
    rankName: string;
    rankPosition: number | null;
    challenges: {
      total: number;
      completed: number;
      items: Array<{ id: string; label: string; completed: boolean; reward: number }>;
    };
  };
  leaderboard: GamificationLeaderboardEntry[];
};

export type SeasonalReward = {
  position: number;
  label: string;
  karmaBonus: number;
  badge?: string;
};

export type SeasonalLeaderboardEntry = GamificationLeaderboardEntry & {
  seasonKarma: number;
  seasonalPosition: number;
  reward?: SeasonalReward | null;
};

export type SeasonalLeaderboardState = {
  season: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    status: string;
    startsAt: string;
    endsAt: string;
    closesInMs: number;
    closedAt: string | null;
    prizeTitle: string | null;
    prizeSummary: string | null;
    rewards: SeasonalReward[];
  };
  me: {
    userId: string;
    seasonKarma: number;
    seasonalPosition: number | null;
    reward?: SeasonalReward | null;
  };
  leaderboard: SeasonalLeaderboardEntry[];
  podium: SeasonalLeaderboardEntry[];
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

const CLIENT_RANKS = [
  { level: 1, name: 'Semente', min: 0, max: 100 },
  { level: 2, name: 'Raiz', min: 101, max: 500 },
  { level: 3, name: 'Broto', min: 501, max: 1000 },
  { level: 4, name: 'Flor', min: 1001, max: 2500 },
  { level: 5, name: 'Fruto', min: 2501, max: 5000 },
  { level: 6, name: 'Arvore Mestre', min: 5001, max: Number.POSITIVE_INFINITY },
] as const;

const DEFAULT_SEASON_REWARDS: SeasonalReward[] = [
  { position: 1, label: 'Aurora Mestre', karmaBonus: 250, badge: 'aurora-mestre' },
  { position: 2, label: 'Aurora Guardiã', karmaBonus: 150, badge: 'aurora-guardia' },
  { position: 3, label: 'Aurora Raiz', karmaBonus: 75, badge: 'aurora-raiz' },
];

const resolveClientRank = (karma: number) =>
  CLIENT_RANKS.find((rank) => karma >= rank.min && karma <= rank.max) || CLIENT_RANKS[CLIENT_RANKS.length - 1];

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

const asReward = (value: unknown): SeasonalReward | null => {
  const raw = asRecord(value);
  const position = Number(raw.position || 0);
  const label = String(raw.label || '').trim();
  const karmaBonus = Number(raw.karmaBonus || 0);
  if (!position || !label) return null;
  return {
    position,
    label,
    karmaBonus,
    badge: raw.badge ? String(raw.badge) : undefined,
  };
};

const getMonthWindow = (date = new Date()) => {
  const startsAt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  const endsAt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, -1));
  return { startsAt, endsAt };
};

const buildSeasonSlug = (date = new Date()) =>
  `season-${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const buildSeasonTitle = (date = new Date()) => {
  const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `Temporada Radiante ${monthLabel}`;
};

const normalizeRewards = (payload: unknown): SeasonalReward[] => {
  const rewardsValue = asRecord(payload).rewards;
  if (!Array.isArray(rewardsValue)) return DEFAULT_SEASON_REWARDS;
  const rewards = rewardsValue.map(asReward).filter((value): value is SeasonalReward => !!value);
  return rewards.length > 0 ? rewards.sort((a, b) => a.position - b.position) : DEFAULT_SEASON_REWARDS;
};

const isSafeSeasonFallbackRuntime = () =>
  process.env.NODE_ENV === 'test' || String(process.env.APP_MODE || '').toLowerCase() === 'mock';

const isSeasonTableUnavailableError = (error: unknown) => {
  const message = String((error as { message?: string } | null)?.message || '');
  const code = String((error as { code?: string } | null)?.code || '');
  return code === 'P2021'
    || /gamification_seasons/i.test(message)
    || /table .* does not exist/i.test(message)
    || isDbUnavailableError(error);
};

const resolveReceiptReward = (action: string, payload: unknown) => {
  const record = asRecord(payload);
  const reward = Number(record.reward ?? record.karma ?? 0);
  if (Number.isFinite(reward) && reward !== 0) return reward;

  const normalizedAction = String(action || '').toUpperCase();
  if (normalizedAction.includes('CHECKIN')) return 5;
  if (normalizedAction.includes('QUEST')) return 15;
  if (normalizedAction.includes('ORACLE')) return 5;
  if (normalizedAction.includes('TRIBE')) return 15;
  if (normalizedAction.includes('RITUAL')) return 10;
  return 0;
};

type SeasonRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  starts_at: Date;
  ends_at: Date;
  prize_title: string | null;
  prize_summary: string | null;
  prize_payload: unknown;
  status: string;
  closed_at: Date | null;
  final_results: unknown;
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

  async getLeaderboard(userId: string): Promise<GamificationLeaderboardState> {
    const [state, meProfile, topProfiles] = await Promise.all([
      this.getState(userId),
      prisma.profile.findUnique({
        where: { id: userId },
        select: { id: true, karma: true, name: true, avatar: true },
      }).catch(() => null),
      prisma.profile.findMany({
        where: { karma: { gt: 0 } },
        select: { id: true, name: true, avatar: true, karma: true },
        orderBy: [{ karma: 'desc' }, { created_at: 'asc' }],
        take: 20,
      }).catch(() => []),
    ]);

    const leaderboard: GamificationLeaderboardEntry[] = topProfiles.map((profile) => {
      const karma = Number(profile.karma || 0);
      const rank = resolveClientRank(karma);
      return {
        userId: profile.id,
        name: String(profile.name || 'Buscador'),
        avatar: profile.avatar || null,
        karma,
        rankLevel: rank.level,
        rankName: rank.name,
      };
    });

    const meKarma = Number(meProfile?.karma || 0);
    const meRank = resolveClientRank(meKarma);
    const meIndex = leaderboard.findIndex((entry) => entry.userId === userId);
    const questItems = state.dailyQuests.map((quest) => ({
      id: quest.id,
      label: quest.label,
      completed: !!quest.isCompleted,
      reward: Number(quest.reward || 0),
    }));

    return {
      me: {
        userId,
        karma: meKarma,
        rankLevel: meRank.level,
        rankName: meRank.name,
        rankPosition: meIndex >= 0 ? meIndex + 1 : null,
        challenges: {
          total: questItems.length,
          completed: questItems.filter((item) => item.completed).length,
          items: questItems,
        },
      },
      leaderboard,
    };
  }

  private async ensureActiveSeason(now = new Date()): Promise<SeasonRecord> {
    await this.autoCloseExpiredSeasons(now);

    let seasonStoreUnavailable = false;
    const activeSeason = await prisma.gamificationSeason.findFirst({
      where: {
        starts_at: { lte: now },
        ends_at: { gte: now },
      },
      orderBy: { starts_at: 'desc' },
    }).catch((error) => {
      if (isSeasonTableUnavailableError(error)) {
        seasonStoreUnavailable = true;
        return null;
      }
      throw error;
    });

    if (activeSeason) {
      if (activeSeason.status !== 'ACTIVE') {
        return prisma.gamificationSeason.update({
          where: { id: activeSeason.id },
          data: { status: 'ACTIVE' },
        }).catch(() => activeSeason);
      }
      return activeSeason;
    }

    const { startsAt, endsAt } = getMonthWindow(now);
    const slug = buildSeasonSlug(now);
    if (seasonStoreUnavailable && isSafeSeasonFallbackRuntime()) {
      return {
        id: slug,
        slug,
        title: buildSeasonTitle(now),
        subtitle: 'Karma acumulado em missões, oráculo, tribo e metamorfose',
        starts_at: startsAt,
        ends_at: endsAt,
        prize_title: 'Premiação Aurora',
        prize_summary: 'Top 3 recebem badge sazonal e bônus automático de karma.',
        prize_payload: { rewards: DEFAULT_SEASON_REWARDS },
        status: 'ACTIVE',
        closed_at: null,
        final_results: null,
      };
    }

    const created = await prisma.gamificationSeason.upsert({
      where: { slug },
      create: {
        slug,
        title: buildSeasonTitle(now),
        subtitle: 'Karma acumulado em missões, oráculo, tribo e metamorfose',
        starts_at: startsAt,
        ends_at: endsAt,
        prize_title: 'Premiação Aurora',
        prize_summary: 'Top 3 recebem badge sazonal e bônus automático de karma.',
        prize_payload: { rewards: DEFAULT_SEASON_REWARDS },
        status: 'ACTIVE',
      },
      update: {
        title: buildSeasonTitle(now),
        subtitle: 'Karma acumulado em missões, oráculo, tribo e metamorfose',
        starts_at: startsAt,
        ends_at: endsAt,
        prize_title: 'Premiação Aurora',
        prize_summary: 'Top 3 recebem badge sazonal e bônus automático de karma.',
        prize_payload: { rewards: DEFAULT_SEASON_REWARDS },
        status: now >= startsAt && now <= endsAt ? 'ACTIVE' : 'SCHEDULED',
      },
    }).catch((error) => {
      if (isSeasonTableUnavailableError(error)) return null;
      throw error;
    });

    if (created) return created;

    return {
      id: slug,
      slug,
      title: buildSeasonTitle(now),
      subtitle: 'Karma acumulado em missões, oráculo, tribo e metamorfose',
      starts_at: startsAt,
      ends_at: endsAt,
      prize_title: 'Premiação Aurora',
      prize_summary: 'Top 3 recebem badge sazonal e bônus automático de karma.',
      prize_payload: { rewards: DEFAULT_SEASON_REWARDS },
      status: 'ACTIVE',
      closed_at: null,
      final_results: null,
    };
  }

  private async autoCloseExpiredSeasons(now = new Date()) {
    const expired = await prisma.gamificationSeason.findMany({
      where: {
        ends_at: { lt: now },
        status: { not: 'CLOSED' },
      },
      orderBy: { ends_at: 'asc' },
    }).catch((error) => {
      if (isSeasonTableUnavailableError(error)) return [];
      throw error;
    });

    for (const season of expired) {
      const computed = await this.computeSeasonalSnapshot(season);
      await prisma.gamificationSeason.update({
        where: { id: season.id },
        data: {
          status: 'CLOSED',
          closed_at: now,
          final_results: computed,
        },
      }).catch((error) => {
        if (isSeasonTableUnavailableError(error)) return undefined;
        throw error;
      });
    }
  }

  private async computeSeasonalSnapshot(season: SeasonRecord) {
    const rewards = normalizeRewards(season.prize_payload);
    const receipts = await prisma.interactionReceipt.findMany({
      where: {
        actor_id: { not: null },
        status: { in: ['DONE', 'COMPLETED', 'CREATED'] },
        created_at: {
          gte: season.starts_at,
          lte: season.ends_at,
        },
      },
      select: {
        actor_id: true,
        action: true,
        payload: true,
      },
    }).catch(() => []);

    const scores = new Map<string, number>();
    for (const receipt of receipts) {
      const actorId = String(receipt.actor_id || '').trim();
      if (!actorId) continue;
      const reward = resolveReceiptReward(receipt.action, receipt.payload);
      if (!reward) continue;
      scores.set(actorId, (scores.get(actorId) || 0) + reward);
    }

    const orderedIds = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([userId]) => userId);

    const profiles = orderedIds.length > 0
      ? await prisma.profile.findMany({
          where: { id: { in: orderedIds } },
          select: { id: true, name: true, avatar: true, karma: true },
        }).catch(() => [])
      : [];

    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

    const leaderboard: SeasonalLeaderboardEntry[] = orderedIds.map((userId, index) => {
      const profile = profilesById.get(userId);
      const karma = Number(profile?.karma || 0);
      const rank = resolveClientRank(karma);
      const reward = rewards.find((item) => item.position === index + 1) || null;
      return {
        userId,
        name: String(profile?.name || 'Buscador'),
        avatar: profile?.avatar || null,
        karma,
        rankLevel: rank.level,
        rankName: rank.name,
        seasonKarma: Number(scores.get(userId) || 0),
        seasonalPosition: index + 1,
        reward,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      rewards,
      leaderboard,
      podium: leaderboard.slice(0, 3),
    };
  }

  async getSeasonalLeaderboard(userId: string): Promise<SeasonalLeaderboardState> {
    const season = await this.ensureActiveSeason();
    const stored = asRecord(season.final_results);
    const useStored = season.status === 'CLOSED' && Array.isArray(stored.leaderboard);
    const computed = useStored ? stored : await this.computeSeasonalSnapshot(season);
    const leaderboard = Array.isArray(computed.leaderboard)
      ? computed.leaderboard.map((entry) => {
          const raw = asRecord(entry);
          return {
            userId: String(raw.userId || ''),
            name: String(raw.name || 'Buscador'),
            avatar: raw.avatar ? String(raw.avatar) : null,
            karma: Number(raw.karma || 0),
            rankLevel: Number(raw.rankLevel || 1),
            rankName: String(raw.rankName || 'Semente'),
            seasonKarma: Number(raw.seasonKarma || 0),
            seasonalPosition: Number(raw.seasonalPosition || 0),
            reward: raw.reward ? asReward(raw.reward) : null,
          };
        }).filter((entry) => !!entry.userId)
      : [];

    const rewards = normalizeRewards(
      Array.isArray(asRecord(computed).rewards)
        ? { rewards: asRecord(computed).rewards }
        : season.prize_payload,
    );

    const me = leaderboard.find((entry) => entry.userId === userId) || null;

    return {
      season: {
        id: season.id,
        slug: season.slug,
        title: season.title,
        subtitle: season.subtitle || null,
        status: season.status,
        startsAt: season.starts_at.toISOString(),
        endsAt: season.ends_at.toISOString(),
        closesInMs: Math.max(0, season.ends_at.getTime() - Date.now()),
        closedAt: season.closed_at?.toISOString() || null,
        prizeTitle: season.prize_title || null,
        prizeSummary: season.prize_summary || null,
        rewards,
      },
      me: {
        userId,
        seasonKarma: me?.seasonKarma || 0,
        seasonalPosition: me?.seasonalPosition || null,
        reward: me?.reward || null,
      },
      leaderboard,
      podium: leaderboard.slice(0, 3),
    };
  }
}

export const gamificationService = new GamificationService();

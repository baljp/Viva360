import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/error';
import prisma from '../config/database';
import notificationService from '../services/notification.service';

// ==========================================
// GAMIFICATION CONTROLLERS
// ==========================================

/**
 * Get user's achievements
 */
export const getAchievements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const achievements = await prisma.achievement.findMany({
    where: { userId },
    orderBy: [
      { rarity: 'desc' },
      { unlockedAt: 'desc' },
    ],
  });

  // Get total karma from achievements
  const totalKarmaFromAchievements = achievements.reduce((sum, a) => sum + a.karmaReward, 0);

  res.json({
    achievements,
    stats: {
      total: achievements.length,
      byRarity: {
        legendary: achievements.filter(a => a.rarity === 'LEGENDARY').length,
        epic: achievements.filter(a => a.rarity === 'EPIC').length,
        rare: achievements.filter(a => a.rarity === 'RARE').length,
        common: achievements.filter(a => a.rarity === 'COMMON').length,
      },
      totalKarmaEarned: totalKarmaFromAchievements,
    },
  });
});

/**
 * Unlock an achievement
 */
export const unlockAchievement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { badgeId, badgeName, badgeIcon, description, rarity, category, karmaReward } = req.body;

  // Check if already unlocked
  const existing = await prisma.achievement.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });

  if (existing) {
    return res.json({ message: 'Achievement already unlocked', achievement: existing });
  }

  // Create achievement
  const achievement = await prisma.achievement.create({
    data: {
      userId,
      badgeId,
      badgeName,
      badgeIcon,
      description,
      rarity: rarity || 'COMMON',
      category,
      karmaReward: karmaReward || 0,
    },
  });

  // Award karma
  if (karmaReward > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { karma: { increment: karmaReward } },
    });
  }

  // Notify user
  await notificationService.notifyAchievementUnlocked(userId, badgeName, karmaReward);

  res.status(201).json(achievement);
});

/**
 * Get active challenges
 */
export const getChallenges = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { type } = req.query;

  const now = new Date();
  const where: any = {
    isActive: true,
    startsAt: { lte: now },
    endsAt: { gte: now },
  };

  if (type) {
    where.type = type as string;
  }

  const challenges = await prisma.challenge.findMany({
    where,
    orderBy: { endsAt: 'asc' },
    include: {
      challengeParticipations: {
        where: { userId },
        select: { progress: true, completed: true, completedAt: true },
      },
    },
  });

  // Add user's participation status
  const withParticipation = challenges.map(challenge => ({
    ...challenge,
    myProgress: challenge.challengeParticipations[0]?.progress || 0,
    isCompleted: challenge.challengeParticipations[0]?.completed || false,
    isJoined: challenge.challengeParticipations.length > 0,
  }));

  res.json(withParticipation);
});

/**
 * Join a challenge
 */
export const joinChallenge = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const challenge = await prisma.challenge.findUnique({ where: { id: id as string } });
  if (!challenge) {
    throw new AppError('Desafio não encontrado', 404);
  }

  // Check if already joined
  const existing = await prisma.challengeParticipation.findUnique({
    where: { userId_challengeId: { userId, challengeId: id as string } },
  });

  if (existing) {
    return res.json({ message: 'Você já está participando deste desafio' });
  }

  const participation = await prisma.challengeParticipation.create({
    data: {
      userId,
      challengeId: id as string,
    },
  });

  res.status(201).json(participation);
});

/**
 * Update challenge progress
 */
export const updateChallengeProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { increment } = req.body;

  const participation = await prisma.challengeParticipation.findUnique({
    where: { userId_challengeId: { userId, challengeId: id as string } },
    include: { challenge: true },
  });

  if (!participation) {
    throw new AppError('Você não está participando deste desafio', 404);
  }

  if (participation.completed) {
    return res.json({ message: 'Desafio já completado', participation });
  }

  const newProgress = Math.min(participation.progress + (increment || 1), participation.challenge.target);
  const isComplete = newProgress >= participation.challenge.target;

  const updated = await prisma.challengeParticipation.update({
    where: { id: participation.id },
    data: {
      progress: newProgress,
      completed: isComplete,
      completedAt: isComplete ? new Date() : null,
    },
  });

  // Award karma if completed
  if (isComplete) {
    await prisma.user.update({
      where: { id: userId },
      data: { karma: { increment: participation.challenge.reward } },
    });

    // Unlock badge if challenge has one
    if (participation.challenge.badgeId) {
      await prisma.achievement.create({
        data: {
          userId,
          badgeId: participation.challenge.badgeId,
          badgeName: participation.challenge.title,
          badgeIcon: participation.challenge.icon || '🏆',
          description: participation.challenge.description,
          category: participation.challenge.category,
          karmaReward: participation.challenge.reward,
        },
      }).catch(() => {}); // Ignore if already exists
    }

    await notificationService.create({
      userId,
      type: 'GAMIFICATION',
      title: 'Desafio Completado! 🎉',
      message: `Você completou "${participation.challenge.title}" e ganhou ${participation.challenge.reward} karma!`,
    });
  }

  res.json(updated);
});

/**
 * Get leaderboard
 */
export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { period = 'WEEKLY', category = 'KARMA', limit = 20 } = req.query;

  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      period: period as string,
      category: category as string,
    },
    orderBy: { score: 'desc' },
    take: Number(limit),
    include: {
      user: {
        select: { id: true, name: true, avatar: true, prestigeLevel: true },
      },
    },
  });

  // Add rank
  const withRank = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  res.json(withRank);
});

/**
 * Update daily streak
 */
export const updateStreak = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const now = new Date();
  const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null;

  // Calculate days since last check-in
  const daysSinceLastCheckIn = lastCheckIn
    ? Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  let newStreak = user.streak;
  let newMultiplier = user.multiplier;
  let bonusKarma = 0;

  if (daysSinceLastCheckIn === 0) {
    // Already checked in today
    return res.json({
      streak: newStreak,
      multiplier: newMultiplier,
      message: 'Você já fez check-in hoje!',
    });
  } else if (daysSinceLastCheckIn === 1) {
    // Consecutive day
    newStreak += 1;
    newMultiplier = Math.min(3.0, 1.0 + (newStreak * 0.05)); // Max 3x multiplier
    bonusKarma = Math.floor(10 * newMultiplier);
  } else {
    // Streak broken
    newStreak = 1;
    newMultiplier = 1.0;
    bonusKarma = 10;
  }

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      multiplier: newMultiplier,
      karma: { increment: bonusKarma },
      lastCheckIn: now,
    },
  });

  // Notify streak milestones
  if ([7, 14, 30, 60, 90, 180, 365].includes(newStreak)) {
    await notificationService.notifyStreakBonus(userId, newStreak, bonusKarma * 2);
  }

  res.json({
    streak: newStreak,
    multiplier: newMultiplier,
    bonusKarma,
    message: daysSinceLastCheckIn > 1 
      ? 'Seu streak foi reiniciado. Continue firme!' 
      : `🔥 Streak de ${newStreak} dias! +${bonusKarma} karma`,
  });
});

/**
 * Calculate and update plant XP/stage
 */
export const updatePlantProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { xpGained } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const newXp = user.plantXp + (xpGained || 0);

  // Calculate plant stage based on XP
  let newStage = user.plantStage;
  if (newXp >= 10000) newStage = 'TREE';
  else if (newXp >= 5000) newStage = 'FLOWER';
  else if (newXp >= 2000) newStage = 'BUD';
  else if (newXp >= 500) newStage = 'SPROUT';
  else newStage = 'SEED';

  const stageChanged = newStage !== user.plantStage;

  await prisma.user.update({
    where: { id: userId },
    data: {
      plantXp: newXp,
      plantStage: newStage as any,
    },
  });

  // Notify on stage evolution
  if (stageChanged) {
    await notificationService.create({
      userId,
      type: 'GAMIFICATION',
      title: 'Sua planta evoluiu! 🌱',
      message: `Seu jardim agora tem uma ${newStage.toLowerCase()}!`,
    });
  }

  res.json({
    plantXp: newXp,
    plantStage: newStage,
    evolved: stageChanged,
  });
});

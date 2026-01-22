import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/error';
import prisma from '../config/database';
import notificationService from '../services/notification.service';

// ==========================================
// RITUALS & DAILY ENGAGEMENT CONTROLLERS
// For: Buscador (Client) Profile
// ==========================================

/**
 * Daily Check-in / Morning Ritual
 * Awards karma, updates streak, tracks mood
 */
export const performDailyCheckIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { mood, intention, photoUrl } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuário não encontrado', 404);

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastCheckInDate = user.lastCheckIn 
    ? new Date(user.lastCheckIn).toISOString().split('T')[0] 
    : null;

  // Already checked in today
  if (lastCheckInDate === today) {
    return res.json({
      success: false,
      message: 'Você já fez seu ritual matinal hoje!',
      streak: user.streak,
      karma: user.karma,
    });
  }

  // Calculate streak
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = user.streak;
  let streakBroken = false;

  if (lastCheckInDate === yesterdayStr) {
    // Consecutive day - increment streak
    newStreak += 1;
  } else if (lastCheckInDate) {
    // Streak broken
    newStreak = 1;
    streakBroken = true;
  } else {
    // First check-in ever
    newStreak = 1;
  }

  // Calculate multiplier based on streak
  const newMultiplier = Math.min(3.0, 1.0 + (newStreak * 0.05));

  // Calculate karma reward
  const baseKarma = 15;
  const streakBonus = Math.floor(newStreak / 7) * 5;
  const moodBonus = mood ? 5 : 0;
  const intentionBonus = intention ? 5 : 0;
  const photoBonus = photoUrl ? 10 : 0;
  const totalKarmaGain = Math.floor((baseKarma + streakBonus + moodBonus + intentionBonus + photoBonus) * newMultiplier);

  // Calculate plant XP gain
  const plantXpGain = Math.floor(10 * newMultiplier);
  const newPlantXp = user.plantXp + plantXpGain;

  // Determine new plant stage
  let newPlantStage = user.plantStage;
  if (newPlantXp >= 10000) newPlantStage = 'TREE';
  else if (newPlantXp >= 5000) newPlantStage = 'FLOWER';
  else if (newPlantXp >= 2000) newPlantStage = 'BUD';
  else if (newPlantXp >= 500) newPlantStage = 'SPROUT';
  else newPlantStage = 'SEED';

  const plantEvolved = newPlantStage !== user.plantStage;

  // Create mood entry if mood provided
  if (mood) {
    await prisma.moodEntry.create({
      data: {
        userId,
        mood,
        notes: intention,
        photoUrl,
        isRitualEntry: true,
        ritualComplete: true,
      },
    });
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      multiplier: newMultiplier,
      karma: { increment: totalKarmaGain },
      plantXp: newPlantXp,
      plantStage: newPlantStage as any,
      lastCheckIn: now,
      lastMood: mood,
      intention,
    },
    select: {
      id: true,
      streak: true,
      multiplier: true,
      karma: true,
      plantXp: true,
      plantStage: true,
      lastMood: true,
      intention: true,
    },
  });

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId,
      type: 'INCOME',
      amount: totalKarmaGain,
      description: `Ritual Matinal - Dia ${newStreak}`,
      status: 'COMPLETED',
      reference: 'DAILY_RITUAL',
    },
  });

  // Notify streak milestones
  if ([7, 14, 30, 60, 90, 180, 365].includes(newStreak)) {
    await notificationService.notifyStreakBonus(userId, newStreak, totalKarmaGain * 2);
  }

  // Notify plant evolution
  if (plantEvolved) {
    await notificationService.create({
      userId,
      type: 'RITUAL',
      title: 'Sua planta evoluiu! 🌱',
      message: `Parabéns! Seu jardim agora tem uma ${getPlantStageName(newPlantStage as any)}!`,
    });
  }

  res.json({
    success: true,
    message: streakBroken 
      ? `Novo ciclo iniciado! +${totalKarmaGain} karma ✨` 
      : `🔥 Streak de ${newStreak} dias! +${totalKarmaGain} karma`,
    streak: newStreak,
    multiplier: newMultiplier,
    karmaGained: totalKarmaGain,
    plantXpGained: plantXpGain,
    plantEvolved,
    user: updatedUser,
  });
});

/**
 * Get user's ritual status for today
 */
export const getRitualStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      streak: true,
      multiplier: true,
      karma: true,
      plantXp: true,
      plantStage: true,
      lastCheckIn: true,
      lastMood: true,
      intention: true,
    },
  });

  if (!user) throw new AppError('Usuário não encontrado', 404);

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastCheckInDate = user.lastCheckIn 
    ? new Date(user.lastCheckIn).toISOString().split('T')[0] 
    : null;

  const hasCheckedInToday = lastCheckInDate === today;

  // Check if streak is at risk (didn't check in yesterday and today)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const streakAtRisk = !hasCheckedInToday && lastCheckInDate !== yesterdayStr && user.streak > 0;

  res.json({
    ...user,
    hasCheckedInToday,
    streakAtRisk,
    nextReward: calculateNextReward(user.streak, user.multiplier),
    plantStageName: getPlantStageName(user.plantStage as any),
    plantProgress: calculatePlantProgress(user.plantXp),
  });
});

/**
 * Water the plant (send good vibes to yourself or another user)
 */
export const waterPlant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const senderId = req.user!.userId;
  const { targetUserId, message } = req.body;

  const receiverId = targetUserId || senderId;
  const isSelfWatering = senderId === receiverId;

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new AppError('Usuário não encontrado', 404);

  // Check watering cooldown (can water same plant once per day)
  if (isSelfWatering) {
    // Self-watering is always allowed
  } else {
    // Check tribe connection exists
    const connection = await prisma.tribeMember.findFirst({
      where: {
        userId: senderId,
        tribe: { tribeMembers: { some: { userId: receiverId } } },
      },
    });

    if (!connection && senderId !== receiverId) {
      throw new AppError('Vocês precisam estar na mesma tribo para regar a planta', 403);
    }
  }

  // Award XP to target's plant
  const xpGain = isSelfWatering ? 5 : 15;
  const newPlantXp = receiver.plantXp + xpGain;

  let newPlantStage = receiver.plantStage;
  if (newPlantXp >= 10000) newPlantStage = 'TREE';
  else if (newPlantXp >= 5000) newPlantStage = 'FLOWER';
  else if (newPlantXp >= 2000) newPlantStage = 'BUD';
  else if (newPlantXp >= 500) newPlantStage = 'SPROUT';

  const plantEvolved = newPlantStage !== receiver.plantStage;

  await prisma.user.update({
    where: { id: receiverId },
    data: {
      plantXp: newPlantXp,
      plantStage: newPlantStage as any,
    },
  });

  // Create energy transfer record if sending to another user
  if (!isSelfWatering) {
    await prisma.energyTransfer.create({
      data: {
        senderId,
        receiverId,
        amount: xpGain,
        message: message || 'Enviando luz para seu jardim 🌟',
      },
    });

    // Notify receiver
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    await notificationService.create({
      userId: receiverId,
      type: 'RITUAL',
      title: 'Recebeu luz! 🌟',
      message: `${sender?.name || 'Alguém'} regou sua planta com amor.`,
    });

    // Award karma to sender for good deed
    await prisma.user.update({
      where: { id: senderId },
      data: { karma: { increment: 5 } },
    });
  }

  res.json({
    success: true,
    message: isSelfWatering 
      ? `Sua planta recebeu +${xpGain} XP 💧` 
      : `Você enviou luz para o jardim! +5 karma para você ✨`,
    plantXpGained: xpGain,
    plantEvolved,
    newPlantStage,
  });
});

/**
 * Get daily quests for user
 */
export const getDailyQuests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastCheckIn: true, streak: true },
  });

  if (!user) throw new AppError('Usuário não encontrado', 404);

  const today = new Date().toISOString().split('T')[0];
  const lastCheckInDate = user.lastCheckIn 
    ? new Date(user.lastCheckIn).toISOString().split('T')[0] 
    : null;
  const hasCheckedIn = lastCheckInDate === today;

  // Dynamic quests based on user state
  const quests = [
    {
      id: 'ritual',
      label: 'Ritual Matinal',
      reward: 15,
      isCompleted: hasCheckedIn,
      type: 'ritual',
      description: 'Faça seu check-in diário e registre seu humor',
    },
    {
      id: 'water',
      label: 'Regue uma Planta',
      reward: 5,
      isCompleted: false, // Would need to track this
      type: 'water',
      description: 'Envie luz para o jardim de alguém da sua tribo',
    },
    {
      id: 'breathe',
      label: 'Minuto de Presença',
      reward: 10,
      isCompleted: false,
      type: 'breathe',
      description: 'Complete uma sessão de respiração consciente',
    },
    {
      id: 'gratitude',
      label: 'Gratidão do Dia',
      reward: 10,
      isCompleted: false,
      type: 'other',
      description: 'Registre algo pelo qual você é grato hoje',
    },
  ];

  // Calculate streak bonus
  const streakBonus = user.streak >= 7 ? '+25% karma em todas as missões' : null;

  res.json({
    quests,
    streakBonus,
    totalAvailable: quests.reduce((sum, q) => sum + (q.isCompleted ? 0 : q.reward), 0),
  });
});

/**
 * Complete a breathing exercise
 */
export const completeBreathingExercise = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { duration, technique } = req.body;

  const karmaGain = Math.min(Math.floor(duration / 60) * 5, 25); // 5 karma per minute, max 25
  const plantXpGain = Math.floor(duration / 60) * 3;

  await prisma.user.update({
    where: { id: userId },
    data: {
      karma: { increment: karmaGain },
      plantXp: { increment: plantXpGain },
    },
  });

  await prisma.moodEntry.create({
    data: {
      userId,
      mood: 'SERENO',
      notes: `Respiração consciente: ${technique || 'livre'} por ${Math.floor(duration / 60)} min`,
      isRitualEntry: true,
      ritualComplete: true,
    },
  });

  res.json({
    success: true,
    message: `Parabéns! +${karmaGain} karma e +${plantXpGain} XP para sua planta 🧘`,
    karmaGained: karmaGain,
    plantXpGained: plantXpGain,
  });
});

/**
 * Record gratitude entry
 */
export const recordGratitude = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { content, photoUrl } = req.body;

  if (!content) {
    throw new AppError('O conteúdo da gratidão é obrigatório', 400);
  }

  const karmaGain = 10;
  const plantXpGain = 5;

  await prisma.user.update({
    where: { id: userId },
    data: {
      karma: { increment: karmaGain },
      plantXp: { increment: plantXpGain },
    },
  });

  await prisma.moodEntry.create({
    data: {
      userId,
      mood: 'GRATO',
      notes: content,
      photoUrl,
      isRitualEntry: true,
      ritualComplete: true,
    },
  });

  res.json({
    success: true,
    message: `Gratidão registrada! +${karmaGain} karma ✨`,
    karmaGained: karmaGain,
    plantXpGained: plantXpGain,
  });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getPlantStageName(stage: string): string {
  const names: Record<string, string> = {
    SEED: 'Semente',
    SPROUT: 'Broto',
    BUD: 'Botão',
    FLOWER: 'Flor',
    TREE: 'Árvore',
    WITHERED: 'Murcha',
  };
  return names[stage] || stage;
}

function calculateNextReward(streak: number, multiplier: number): number {
  const baseKarma = 15;
  const streakBonus = Math.floor((streak + 1) / 7) * 5;
  return Math.floor((baseKarma + streakBonus) * Math.min(3.0, 1.0 + ((streak + 1) * 0.05)));
}

function calculatePlantProgress(xp: number): { current: number; total: number; percentage: number } {
  const stages = [
    { min: 0, max: 500 },
    { min: 500, max: 2000 },
    { min: 2000, max: 5000 },
    { min: 5000, max: 10000 },
    { min: 10000, max: Infinity },
  ];

  for (const stage of stages) {
    if (xp < stage.max) {
      const current = xp - stage.min;
      const total = stage.max - stage.min;
      return {
        current,
        total: total === Infinity ? current : total,
        percentage: total === Infinity ? 100 : Math.round((current / total) * 100),
      };
    }
  }

  return { current: xp, total: xp, percentage: 100 };
}

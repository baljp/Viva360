import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/error';
import prisma from '../config/database';
import notificationService from '../services/notification.service';

// ==========================================
// SOUL PHARMACY CONTROLLERS
// ==========================================

/**
 * List soul pills with filtering
 */
export const listPills = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    mood, 
    type, 
    isFree, 
    featured, 
    creatorId,
    page = 1, 
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const where: any = { isPublished: true };

  if (mood) {
    where.targetMoods = { contains: mood as string };
  }
  if (type) {
    where.type = type as string;
  }
  if (isFree === 'true') {
    where.isFree = true;
  }
  if (featured === 'true') {
    where.isFeatured = true;
  }
  if (creatorId) {
    where.creatorId = creatorId as string;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const orderBy: any = { [sortBy as string]: sortOrder };

  const [pills, total] = await Promise.all([
    prisma.soulPill.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
      },
    }),
    prisma.soulPill.count({ where }),
  ]);

  // Transform targetMoods from JSON string
  const transformed = pills.map(pill => ({
    ...pill,
    targetMoods: JSON.parse(pill.targetMoods),
  }));

  res.json({
    data: transformed,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get pill by ID
 */
export const getPill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const pill = await prisma.soulPill.findUnique({
    where: { id: id as string },
    include: {
      creator: {
        select: { id: true, name: true, avatar: true, bio: true },
      },
    },
  });

  if (!pill) {
    throw new AppError('Pílula não encontrada', 404);
  }

  // Increment views
  await prisma.soulPill.update({
    where: { id: id as string },
    data: { views: { increment: 1 } },
  });

  res.json({
    ...pill,
    targetMoods: JSON.parse(pill.targetMoods),
  });
});

/**
 * Get suggestions based on current mood
 */
export const getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { mood, limit = 5 } = req.query;

  // Get user's latest mood if not provided
  let targetMood = mood as string;
  if (!targetMood) {
    const latestEntry = await prisma.moodEntry.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    targetMood = latestEntry?.mood || 'SERENO';
  }

  // Get pills matching the mood
  const pills = await prisma.soulPill.findMany({
    where: {
      isPublished: true,
      targetMoods: { contains: targetMood },
    },
    orderBy: [
      { isFeatured: 'desc' },
      { avgRating: 'desc' },
      { purchases: 'desc' },
    ],
    take: Number(limit),
    include: {
      creator: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  res.json({
    mood: targetMood,
    suggestions: pills.map(p => ({
      ...p,
      targetMoods: JSON.parse(p.targetMoods),
    })),
  });
});

/**
 * Purchase a soul pill
 */
export const purchasePill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const pill = await prisma.soulPill.findUnique({ where: { id: id as string } });
  if (!pill) {
    throw new AppError('Pílula não encontrada', 404);
  }

  // Check if already purchased
  const existing = await prisma.soulPillPurchase.findUnique({
    where: { userId_pillId: { userId, pillId: id as string } },
  });
  if (existing) {
    throw new AppError('Você já possui esta pílula', 400);
  }

  // Check balance
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.personalBalance < pill.price) {
    throw new AppError('Saldo insuficiente', 400);
  }

  // Create purchase and update balances
  const [purchase] = await prisma.$transaction([
    prisma.soulPillPurchase.create({
      data: {
        userId,
        pillId: id as string,
        pricePaid: pill.price,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { personalBalance: { decrement: pill.price } },
    }),
    prisma.user.update({
      where: { id: pill.creatorId },
      data: { personalBalance: { increment: pill.price * 0.8 } }, // 80% to creator
    }),
    prisma.soulPill.update({
      where: { id: id as string },
      data: { purchases: { increment: 1 } },
    }),
  ]);

  // Notify creator
  await notificationService.notifySoulPillPurchase(
    pill.creatorId,
    pill.title,
    user.name,
    pill.price
  );

  res.status(201).json({
    message: 'Compra realizada com sucesso!',
    purchase,
  });
});

/**
 * Get my purchases
 */
export const getMyPurchases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const purchases = await prisma.soulPillPurchase.findMany({
    where: { userId },
    orderBy: { accessGranted: 'desc' },
    include: {
      pill: {
        include: {
          creator: {
            select: { id: true, name: true, avatar: true },
          },
        },
      },
    },
  });

  res.json(purchases);
});

/**
 * Create a soul pill (for professionals)
 */
export const createPill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const creatorId = req.user!.userId;
  const { title, description, type, contentUrl, thumbnailUrl, duration, targetMoods, price, isFree } = req.body;

  // Verify user is a professional
  const user = await prisma.user.findUnique({ where: { id: creatorId } });
  if (user?.role !== 'PROFESSIONAL') {
    throw new AppError('Apenas profissionais podem criar pílulas', 403);
  }

  const pill = await prisma.soulPill.create({
    data: {
      creatorId,
      title,
      description,
      type,
      contentUrl,
      thumbnailUrl,
      duration,
      targetMoods: JSON.stringify(targetMoods || []),
      price: price || 0,
      isFree: isFree || false,
      isPublished: true,
    },
  });

  res.status(201).json(pill);
});

/**
 * Update progress on a pill
 */
export const updateProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { progress, completed } = req.body;

  const purchase = await prisma.soulPillPurchase.findUnique({
    where: { userId_pillId: { userId, pillId: id as string } },
  });

  if (!purchase) {
    throw new AppError('Você não possui esta pílula', 404);
  }

  const updated = await prisma.soulPillPurchase.update({
    where: { id: purchase.id },
    data: {
      progress: progress ?? purchase.progress,
      completed: completed ?? purchase.completed,
      lastAccessed: new Date(),
    },
  });

  res.json(updated);
});

// ==========================================
// MOOD ENTRY CONTROLLERS
// ==========================================

/**
 * Create mood entry (check-in)
 */
export const createMoodEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { mood, intensity, notes, photoUrl, photoFilter, isRitualEntry } = req.body;

  // Create mood entry
  const entry = await prisma.moodEntry.create({
    data: {
      userId,
      mood,
      intensity: intensity || 3,
      notes,
      photoUrl,
      photoFilter,
      isRitualEntry: isRitualEntry || false,
      ritualComplete: isRitualEntry || false,
    },
  });

  // Update user's last mood and check-in
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastMood: mood,
      lastCheckIn: new Date(),
    },
  });

  // Get pill suggestions based on mood
  const suggestions = await prisma.soulPill.findMany({
    where: {
      isPublished: true,
      targetMoods: { contains: mood },
    },
    take: 3,
    orderBy: { avgRating: 'desc' },
    select: { id: true, title: true, type: true, thumbnailUrl: true, isFree: true },
  });

  // Update entry with suggestions
  if (suggestions.length > 0) {
    await prisma.moodEntry.update({
      where: { id: entry.id },
      data: {
        suggestedPills: JSON.stringify(suggestions.map(s => s.id)),
      },
    });
  }

  res.status(201).json({
    entry,
    suggestions,
  });
});

/**
 * Get my mood history
 */
export const getMoodHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { days = 30, page = 1, limit = 100 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));

  const entries = await prisma.moodEntry.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });

  // Calculate mood statistics
  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgIntensity = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length
    : 0;

  res.json({
    entries,
    stats: {
      totalEntries: entries.length,
      moodDistribution: moodCounts,
      averageIntensity: avgIntensity.toFixed(1),
      mostFrequentMood: Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    },
  });
});

/**
 * Get my ritual photos gallery
 */
export const getPhotoGallery = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { page = 1, limit = 50 } = req.query;

  const entries = await prisma.moodEntry.findMany({
    where: {
      userId,
      photoUrl: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    select: {
      id: true,
      mood: true,
      photoUrl: true,
      photoFilter: true,
      createdAt: true,
    },
  });

  res.json(entries);
});

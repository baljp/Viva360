import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import prisma from '../config/database';

/**
 * Advanced search for professionals with filters and pagination
 * Optimized to avoid N+1 queries
 */
export const searchProfessionals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    specialty,
    minRating,
    maxPrice,
    city,
    isAvailableForSwap,
    sortBy = 'rating',
    sortOrder = 'desc',
    q, // text search
  } = req.query;

  const pageNum = Number(page);
  const limitNum = Math.min(Number(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {
    user: {
      role: 'PROFESSIONAL',
    },
  };

  // Filter by specialty (JSON string search for SQLite)
  if (specialty) {
    where.specialty = {
      contains: specialty as string,
    };
  }

  // Filter by rating
  if (minRating) {
    where.rating = {
      gte: Number(minRating),
    };
  }

  // Filter by price
  if (maxPrice) {
    where.pricePerSession = {
      lte: Number(maxPrice),
    };
  }

  // Filter by city
  if (city) {
    where.location = {
      contains: city as string,
    };
  }

  // Filter by swap availability
  if (isAvailableForSwap === 'true') {
    where.isAvailableForSwap = true;
  }

  // Text search in name
  if (q) {
    where.user = {
      ...where.user,
      name: {
        contains: q as string,
      },
    };
  }

  // Build orderBy
  const orderBy: any = {};
  if (sortBy === 'rating') {
    orderBy.rating = sortOrder;
  } else if (sortBy === 'price') {
    orderBy.pricePerSession = sortOrder;
  } else if (sortBy === 'reviews') {
    orderBy.reviewCount = sortOrder;
  } else if (sortBy === 'hours') {
    orderBy.totalHealingHours = sortOrder;
  }

  // Execute optimized query with all relations in single call
  const [professionals, total] = await Promise.all([
    prisma.professional.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      select: {
        id: true,
        specialty: true,
        rating: true,
        reviewCount: true,
        pricePerSession: true,
        totalHealingHours: true,
        location: true,
        isAvailableForSwap: true,
        offers: true,
        needs: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            karma: true,
            prestigeLevel: true,
          },
        },
      },
    }),
    prisma.professional.count({ where }),
  ]);

  // Transform response
  const results = professionals.map(pro => ({
    id: pro.id,
    userId: pro.user.id,
    name: pro.user.name,
    avatar: pro.user.avatar,
    bio: pro.user.bio,
    specialty: JSON.parse(pro.specialty || '[]'),
    rating: pro.rating,
    reviewCount: pro.reviewCount,
    pricePerSession: pro.pricePerSession,
    totalHealingHours: pro.totalHealingHours,
    location: pro.location,
    isAvailableForSwap: pro.isAvailableForSwap,
    offers: JSON.parse(pro.offers || '[]'),
    needs: JSON.parse(pro.needs || '[]'),
    karma: pro.user.karma,
    prestigeLevel: pro.user.prestigeLevel,
  }));

  res.json({
    data: results,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum * limitNum < total,
      hasPrev: pageNum > 1,
    },
  });
});

/**
 * Advanced search for products with filters and pagination
 */
export const searchProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    category,
    type,
    minPrice,
    maxPrice,
    inStock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    q,
  } = req.query;

  const pageNum = Number(page);
  const limitNum = Math.min(Number(limit), 100);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (category) {
    where.category = category as string;
  }

  if (type) {
    where.type = type as string;
  }

  if (minPrice) {
    where.price = { ...where.price, gte: Number(minPrice) };
  }

  if (maxPrice) {
    where.price = { ...where.price, lte: Number(maxPrice) };
  }

  if (inStock === 'true') {
    where.stock = { gt: 0 };
  }

  if (q) {
    where.OR = [
      { name: { contains: q as string } },
      { description: { contains: q as string } },
    ];
  }

  // Build orderBy
  const orderBy: any = {};
  if (sortBy === 'price') {
    orderBy.price = sortOrder;
  } else if (sortBy === 'name') {
    orderBy.name = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        category: true,
        type: true,
        stock: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum * limitNum < total,
      hasPrev: pageNum > 1,
    },
  });
});

/**
 * Get available filters (for UI dropdowns)
 */
export const getSearchFilters = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [productCategories, cities] = await Promise.all([
    prisma.product.findMany({
      distinct: ['category'],
      select: { category: true },
    }),
    prisma.professional.findMany({
      distinct: ['location'],
      select: { location: true },
      where: { location: { not: null } },
    }),
  ]);

  // Common specialties (from JSON strings)
  const specialties = [
    'Yoga', 'Meditação', 'Terapia Holística', 'Reiki', 'Massagem',
    'Astrologia', 'Tarot', 'Mindfulness', 'Psicologia', 'Aromaterapia',
    'Acupuntura', 'Ayurveda', 'Constelação Familiar', 'Numerologia',
  ];

  res.json({
    productCategories: productCategories.map(p => p.category),
    cities: cities.map(c => c.location).filter(Boolean),
    specialties,
    priceRanges: [
      { label: 'Até R$ 100', min: 0, max: 100 },
      { label: 'R$ 100 - R$ 200', min: 100, max: 200 },
      { label: 'R$ 200 - R$ 300', min: 200, max: 300 },
      { label: 'Acima de R$ 300', min: 300, max: null },
    ],
    ratingRanges: [
      { label: '4.5+', min: 4.5 },
      { label: '4.0+', min: 4.0 },
      { label: '3.5+', min: 3.5 },
    ],
    productTypes: ['PHYSICAL', 'SERVICE', 'DIGITAL_CONTENT'],
  });
});

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/error';
import prisma from '../config/database';
import { cacheService } from '../services/cache.service';

// Get All Products
export const getAllProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, type, search } = req.query;
  
  // Cache key
  const cacheKey = `products_list_${JSON.stringify(req.query)}`;
  const cachedData = cacheService.get(cacheKey);
  if (cachedData) return res.json(cachedData);

  const where: any = { isActive: true };

  if (category) {
    where.category = category;
  }

  if (type) {
    where.type = type;
  }

  if (search) {
    where.name = { contains: search as string, mode: 'insensitive' };
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  cacheService.set(cacheKey, products);

  res.json(products);
});

// Get Product by ID
export const getProductById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError('Produto não encontrado', 404);
  }

  res.json(product);
});

// Create Product (Admin/Professional only)
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { name, description, price, image, category, type, stock } = req.body;

  if (!name || !price || !category || !type) {
    throw new AppError('Dados incompletos para criar produto', 400);
  }

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      image,
      category,
      type,
      stock: stock || 0,
      professionalId: type === 'SERVICE' ? userId : undefined,
    },
  });

  res.status(201).json(product);
});

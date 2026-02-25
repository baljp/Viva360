import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { marketplaceService } from '../services/marketplace.service';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { handleDbReadFallback } from '../lib/dbReadFallback';
import { mockAdapter } from '../services/mockAdapter';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.user?.userId;
  const { name, price, category, type, image, description, eventDate, hostName, spotsLeft, karmaReward } = req.body;

  if (isMockMode()) {
    const mockProduct = mockAdapter.marketplace.createProduct({
      ownerId: String(ownerId || 'mock-owner'),
      name,
      price,
      category,
      type,
      image,
      description,
      eventDate,
      hostName,
      spotsLeft,
      karmaReward,
    });
    return res.status(201).json(mockProduct);
  }

  const product = await marketplaceService.createProduct({
      name,
      price: typeof price === 'string' ? parseFloat(price) : price,
      category,
      type,
      image,
      description,
      owner_id: ownerId,
      // Extra fields passed for mock compatibility or future schema updates
      eventDate, hostName, spotsLeft, karmaReward
  });

  return res.status(201).json(product);
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { ownerId, category } = req.query as { ownerId?: string; category?: string };
  if (isMockMode()) {
    return res.json(mockAdapter.marketplace.listProducts({ ownerId, category }));
  }
  try {
    const products = await marketplaceService.listProducts(ownerId, category);
    return res.json(products);
  } catch (err) {
    if (handleDbReadFallback(res, err, {
      route: 'marketplace.listProducts',
      userId: req.user?.userId,
      fallbackPayload: [],
    })) return;
    throw err;
  }
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requesterId = req.user?.userId;
    const role = String(req.user?.role || '').toUpperCase();

    if (role !== 'ADMIN') {
      const product = await prisma.product.findUnique({
        where: { id },
        select: { owner_id: true },
      });

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      if (!product.owner_id || product.owner_id !== requesterId) {
        return res.status(403).json({ error: 'Você não pode remover este produto.' });
      }
    }

    const result = await marketplaceService.deleteProduct(id);
    return res.json(result);
});

export const purchaseProduct = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { product_id, amount, description } = req.body;

    const transaction = await marketplaceService.purchaseProduct({
        product_id,
        amount,
        description,
        user_id: userId
    });

    return res.json(transaction);
});

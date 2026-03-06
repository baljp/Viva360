import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { marketplaceService } from '../services/marketplace.service';
import prisma from '../lib/prisma';
import { isMockMode, mockCheckoutResult, mockId, mockProductResponse, saveMockFinanceTransaction, saveMockMarketplaceProduct, listMockMarketplaceProducts } from '../services/mockAdapter';
import { handleDbReadFallback, isDbUnavailableError } from '../lib/dbReadFallback';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.user?.userId;
  const { name, price, category, type, image, description, eventDate, hostName, spotsLeft, karmaReward } = req.body;

  try {
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

    if (isMockMode()) {
      const stored = product as any;
      saveMockMarketplaceProduct({
        id: String(stored.id || mockId('mock-product')),
        name: String(stored.name || name || 'Produto'),
        price: Number(stored.price || price || 0),
        category: String(stored.category || category || ''),
        type: String(stored.type || type || 'service'),
        image: (stored.image ?? image ?? null),
        description: String(stored.description || description || ''),
        owner_id: String(stored.owner_id || ownerId || ''),
        created_at: stored.created_at instanceof Date
          ? stored.created_at.toISOString()
          : String(stored.created_at || new Date().toISOString()),
      });
    }

    return res.status(201).json(product);
  } catch (err) {
    if (isMockMode() && isDbUnavailableError(err)) {
      const mockProduct = mockProductResponse({
        name,
        price,
        category,
        type,
        image,
        description,
        ownerId: ownerId || '',
        eventDate,
        hostName,
        spotsLeft,
        karmaReward,
      });
      saveMockMarketplaceProduct({
        id: String(mockProduct.id),
        name: String(mockProduct.name),
        price: Number(mockProduct.price || 0),
        category: String(mockProduct.category || ''),
        type: String(mockProduct.type || 'service'),
        image: mockProduct.image || null,
        description: String(mockProduct.description || ''),
        owner_id: String(mockProduct.owner_id || ownerId || ''),
        created_at: String(mockProduct.created_at || new Date().toISOString()),
      });
      return res.status(201).json(mockProduct);
    }
    throw err;
  }
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { ownerId, category } = req.query as { ownerId?: string; category?: string };
  const fallbackProducts = listMockMarketplaceProducts(ownerId, category);

  try {
    const products = await marketplaceService.listProducts(ownerId, category);
    if (!isMockMode()) return res.json(products);

    const merged = [...(products as Array<Record<string, unknown>>)];
    const existingIds = new Set(merged.map((item) => String(item.id || '')));
    for (const entry of fallbackProducts) {
      if (!existingIds.has(String(entry.id))) {
        merged.push(entry as unknown as Record<string, unknown>);
      }
    }
    return res.json(merged);
  } catch (err) {
    if (isMockMode() && isDbUnavailableError(err)) {
      return res.json(fallbackProducts);
    }
    if (handleDbReadFallback(res, err, {
      route: 'marketplace.listProducts',
      userId: req.user?.userId,
      fallbackPayload: fallbackProducts,
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
  try {
    const transaction = await marketplaceService.purchaseProduct({
      product_id,
      amount,
      description,
      user_id: userId
    });

    return res.json(transaction);
  } catch (error) {
    if (isMockMode() && isDbUnavailableError(error)) {
      const mockResult = mockCheckoutResult({
        userId,
        amount: Number(amount || 0),
        description: String(description || `Purchase: ${product_id}`),
        items: [{ id: String(product_id || 'compat_product'), price: Number(amount || 0), type: 'marketplace' }],
      });
      saveMockFinanceTransaction({
        id: mockResult.id,
        user_id: String(userId || ''),
        type: 'expense',
        amount: Number(mockResult.amount || 0),
        description: String(mockResult.description || ''),
        status: String(mockResult.status || 'completed'),
        date: String(mockResult.created_at || new Date().toISOString()),
      });
      return res.json(mockResult);
    }
    throw error;
  }
});

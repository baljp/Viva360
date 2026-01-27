import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';
import { asyncHandler } from '../middleware/async.middleware';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = (req as any).user?.userId;
  const { name, price, category, type, image, description, eventDate, hostName, spotsLeft, karmaReward } = req.body;

  if (isMockMode()) {
    return res.status(201).json({
      id: 'mock-' + Date.now(),
      name,
      price,
      image: image || 'https://via.placeholder.com/150',
      category,
      type: type || 'PRODUCT',
      description,
      owner_id: ownerId || 'mock-owner',
      eventDate, 
      hostName,
      spotsLeft, 
      karmaReward
    });
  }
  
  const product = await prisma.product.create({
    data: {
      name,
      price: typeof price === 'string' ? parseFloat(price) : price,
      category,
      type,
      image,
      description,
      owner_id: ownerId
    }
  });

  return res.json(product);
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { ownerId } = req.query;

  if (isMockMode()) {
    let mocks = [
        { id: 'p1', name: 'Sessão Reiki', price: 150, category: 'Healing', type: 'service', image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=400', owner_id: 'pro-1', karmaReward: 50 },
        { id: 'p2', name: 'Cristal Quartzo', price: 45, category: 'Minerals', type: 'physical', image: 'https://images.unsplash.com/photo-1596436647248-18545812971a?w=400', owner_id: 'space-1', karmaReward: 10, stock: 12 },
        { id: 'p3', name: 'Workshop Meditação', price: 200, category: 'Education', type: 'event', image: 'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?w=400', owner_id: 'space-1', eventDate: new Date().toISOString(), spotsLeft: 5 }
    ];
    
    if (ownerId) {
        mocks = mocks.filter(p => p.owner_id === ownerId);
    }
    return res.json(mocks);
  }

  const where = ownerId ? { owner_id: String(ownerId) } : {};
  const products = await prisma.product.findMany({ where });
  // Map Decimal to float for frontend
  const sanitized = products.map(p => ({
      ...p,
      price: Number(p.price)
  }));
  return res.json(sanitized);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (isMockMode()) {
        return res.json({ success: true, id });
    }

    await prisma.product.delete({ where: { id } });
    return res.json({ success: true });
});

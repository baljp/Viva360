import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isMockMode } from '../services/supabase.service';

export const createProduct = async (req: Request, res: Response) => {
  const ownerId = (req as any).user?.userId;
  const { name, price, category, type } = req.body; // type: 'SERVICE' | 'PRODUCT' | 'EVENT'

  if (isMockMode()) {
    return res.status(201).json({
      id: 'mock-product-id',
      name,
      price,
      category,
      type: type || 'PRODUCT',
      owner_id: ownerId || 'mock-owner'
    });
  }

  const product = await prisma.product.create({
    data: {
      name,
      price,
      category,
      owner_id: ownerId
      // type: type // Assuming schema update or using category as type proxy for now
    }
  });

  return res.json(product);
};

export const listProducts = async (req: Request, res: Response) => {
  if (isMockMode()) {
    return res.json([
      { id: 'p1', name: 'Sessão Reiki', price: 150, category: 'Healing', type: 'SERVICE' },
      { id: 'p2', name: 'Cristal Quartzo', price: 45, category: 'Minerals', type: 'PRODUCT' },
      { id: 'p3', name: 'Workshop Meditação', price: 200, category: 'Education', type: 'EVENT' }
    ]);
  }
  const products = await prisma.product.findMany();
  return res.json(products);
};

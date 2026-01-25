import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createProduct = async (req: Request, res: Response) => {
  const ownerId = (req as any).user?.userId;
  const { name, price, category } = req.body;

  const product = await prisma.product.create({
    data: {
      name,
      price,
      category,
      owner_id: ownerId
    }
  });

  return res.json(product);
};

export const listProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany();
  return res.json(products);
};
